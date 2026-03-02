// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Docs.Indexer.Infrastructure;
using Docs.Mcp.Database;
using Markdig.Syntax;
using Markdig.Syntax.Inlines;
using Microsoft.EntityFrameworkCore;

namespace Docs.Indexer.Indexers;

/// <summary>
/// Indexes code samples from the Duende samples repository.
/// </summary>
public sealed class SamplesIndexer(McpDb db, HttpClient httpClient)
{
    private const string SamplesLlmsTxtUrl = "https://docs.duendesoftware.com/_llms-txt/identityserver-sample-code.txt";
    private const string SamplesRepoZipUrl = "https://github.com/duendesoftware/samples/archive/refs/heads/main.zip";

    /// <summary>
    /// Fetch and index code samples from the GitHub repository.
    /// </summary>
    public async Task IndexAsync()
    {
        Console.WriteLine($"Fetching samples llms.txt: {SamplesLlmsTxtUrl}");
        var llmsTxt = await httpClient.GetStringAsync(SamplesLlmsTxtUrl);

        // Fix formatting issues from minification
        llmsTxt = llmsTxt.Replace("###", "\n\n###", StringComparison.OrdinalIgnoreCase);
        llmsTxt = llmsTxt.Replace("* ", "\n* ", StringComparison.OrdinalIgnoreCase);

        Console.WriteLine($"Downloading samples repository: {SamplesRepoZipUrl}");
        await using var repoStream = await httpClient.GetStreamAsync(SamplesRepoZipUrl);
        await using var tempFile = await TemporaryFileStream.CreateFromAsync(repoStream);
        using var zipArchive = new ZipArchive(tempFile, ZipArchiveMode.Read);

        Console.WriteLine($"Repository contains {zipArchive.Entries.Count} files");

        var llmsMd = Markdig.Markdown.Parse(llmsTxt);

        // Parse samples from markdown
        string? sampleTitle = null;
        var sampleContent = new StringBuilder();
        var indexedCount = 0;

        foreach (var block in llmsMd)
        {
            if (block is HeadingBlock headingBlock)
            {
                // Save previous sample if we have one
                if (sampleTitle != null && sampleContent.Length > 0)
                {
                    var files = await GetFilesForSampleAsync(sampleContent.ToString(), zipArchive);
                    if (files.Count > 0)
                    {
                        await InsertSampleAsync(sampleTitle, sampleContent.ToString(), files);
                        indexedCount++;
                        Console.WriteLine($"  Indexed: {ExtractTitle(sampleTitle)} ({files.Count} files)");
                    }
                }

                // Start new sample
                sampleTitle = llmsTxt.Substring(headingBlock.Span.Start, headingBlock.Span.Length).TrimStart('#', ' ');
                sampleContent.Clear();

                // Add keyword hints for better search
                if (sampleTitle.Contains("passkey", StringComparison.OrdinalIgnoreCase))
                {
                    sampleTitle += " webauthn fido2 yubikey passwordless";
                }
            }

            if (sampleTitle != null)
            {
                sampleContent.AppendLine(llmsTxt.Substring(block.Span.Start, block.Span.Length));
            }
        }

        // Save last sample
        if (sampleTitle != null && sampleContent.Length > 0)
        {
            var files = await GetFilesForSampleAsync(sampleContent.ToString(), zipArchive);
            if (files.Count > 0)
            {
                await InsertSampleAsync(sampleTitle, sampleContent.ToString(), files);
                indexedCount++;
                Console.WriteLine($"  Indexed: {ExtractTitle(sampleTitle)} ({files.Count} files)");
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"Indexed {indexedCount} sample projects");
    }

    private async Task InsertSampleAsync(string title, string description, List<string> files)
    {
        var filesJson = JsonSerializer.Serialize(files);

        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO FTSSampleProject (Id, Product, Title, Description, Files) VALUES ({0}, {1}, {2}, {3}, {4})",
            Guid.NewGuid().ToString(),
            "IdentityServer",
            ExtractTitle(title),
            description,
            filesJson);
    }

    private static string ExtractTitle(string markdownText)
    {
        // Remove section anchors like: [Section titled "..."](...) 
        var indexOfSection = markdownText.IndexOf("[Section", StringComparison.OrdinalIgnoreCase);
        if (indexOfSection > 0)
        {
            markdownText = markdownText[..(indexOfSection - 1)];
        }

        return markdownText.Trim();
    }

    private static async Task<List<string>> GetFilesForSampleAsync(string markdownText, ZipArchive archive)
    {
        var files = new List<string>();
        var markdown = Markdig.Markdown.Parse(markdownText);

        foreach (var link in markdown.Descendants<LinkInline>())
        {
            if (link.Url?.Contains("github.com/duendesoftware/samples/", StringComparison.OrdinalIgnoreCase) != true)
            {
                continue;
            }

            // Extract path from URL
            // URL: https://github.com/DuendeSoftware/samples/tree/main/IdentityServer/v7/AspNetIdentityPasskeys
            // ZIP: samples-main/IdentityServer/v7/AspNetIdentityPasskeys/...
            var sampleRootIndex = link.Url.IndexOf("/IdentityServer/v7/", StringComparison.OrdinalIgnoreCase);
            if (sampleRootIndex < 0)
            {
                continue;
            }

            var sampleRootPath = $"samples-main{link.Url[sampleRootIndex..]}";
            const string sharedHostRootPath = "samples-main/IdentityServer/v7/IdentityServerHost";

            var matchingEntries = archive.Entries
                .Where(e =>
                    (e.FullName.StartsWith(sampleRootPath, StringComparison.OrdinalIgnoreCase) ||
                     e.FullName.StartsWith(sharedHostRootPath, StringComparison.OrdinalIgnoreCase)) &&
                    IsRelevantFile(e.FullName));

            foreach (var entry in matchingEntries)
            {
                using var entryStream = new StreamReader(entry.Open());
                var content = await entryStream.ReadToEndAsync();

                files.Add($"File: `{entry.FullName}`:\n```\n{content}\n```");
            }
        }

        return files;
    }

    private static bool IsRelevantFile(string path)
    {
        // C# and Razor files
        if (path.EndsWith(".cs", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith(".cshtml", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // JavaScript for passkey samples
        if (path.Contains("passkey", StringComparison.OrdinalIgnoreCase) &&
            path.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }
}
