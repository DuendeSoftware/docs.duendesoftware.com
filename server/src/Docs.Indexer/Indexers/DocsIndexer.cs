// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using System.Text;
using System.Text.RegularExpressions;
using Docs.Mcp.Database;
using Markdig.Syntax;
using Markdig.Syntax.Inlines;
using Microsoft.EntityFrameworkCore;

namespace Docs.Indexer.Indexers;

/// <summary>
/// Indexes documentation articles from local llms.txt files.
/// </summary>
public sealed partial class DocsIndexer(McpDb db)
{
    /// <summary>
    /// Index documentation from the wwwroot directory.
    /// Reads llms.txt and parses linked _llms-txt/*.txt files.
    /// </summary>
    public async Task IndexAsync(string wwwrootPath)
    {
        var llmsTxtPath = Path.Combine(wwwrootPath, "llms.txt");
        if (!File.Exists(llmsTxtPath))
        {
            throw new InvalidOperationException($"llms.txt not found at: {llmsTxtPath}");
        }

        Console.WriteLine($"Reading: {llmsTxtPath}");
        var llmsTxt = await File.ReadAllTextAsync(llmsTxtPath);
        var llmsMd = Markdig.Markdown.Parse(llmsTxt);

        var llmsTxtDir = Path.Combine(wwwrootPath, "_llms-txt");
        if (!Directory.Exists(llmsTxtDir))
        {
            throw new InvalidOperationException($"_llms-txt directory not found at: {llmsTxtDir}");
        }

        var totalArticles = 0;

        // Find links to _llms-txt files
        foreach (var link in llmsMd.Descendants<LinkInline>())
        {
            if (link.Url?.Contains("_llms-txt/", StringComparison.OrdinalIgnoreCase) != true)
            {
                continue;
            }

            // Extract filename from URL
            var fileName = ExtractFileName(link.Url);
            if (string.IsNullOrEmpty(fileName))
            {
                continue;
            }

            var filePath = Path.Combine(llmsTxtDir, fileName);
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"  Warning: File not found: {filePath}");
                continue;
            }

            var articlesCount = await IndexDocumentFileAsync(filePath);
            totalArticles += articlesCount;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"Indexed {totalArticles} documentation articles");
    }

    private async Task<int> IndexDocumentFileAsync(string filePath)
    {
        Console.WriteLine($"  Processing: {Path.GetFileName(filePath)}");
        var content = await File.ReadAllTextAsync(filePath);

        // Split on ----- delimiter
        var sections = content.Split(["-----"], StringSplitOptions.RemoveEmptyEntries);
        var articlesCount = 0;
        string? productName = null;

        foreach (var section in sections)
        {
            var trimmedSection = section.Trim();
            if (string.IsNullOrEmpty(trimmedSection))
            {
                continue;
            }

            // Skip SYSTEM tags at the start
            if (trimmedSection.StartsWith("<SYSTEM>", StringComparison.OrdinalIgnoreCase))
            {
                var endTag = trimmedSection.IndexOf("</SYSTEM>", StringComparison.OrdinalIgnoreCase);
                if (endTag > 0)
                {
                    trimmedSection = trimmedSection[(endTag + 9)..].Trim();
                }
            }

            if (string.IsNullOrEmpty(trimmedSection))
            {
                continue;
            }

            // Extract title from first H1
            var title = ExtractH1Title(trimmedSection);
            if (string.IsNullOrEmpty(title))
            {
                continue;
            }

            // First H1 in the file becomes the product name
            productName ??= title;

            // Extract content (everything after the H1 line)
            var contentStart = trimmedSection.IndexOf('\n');
            var articleContent = contentStart > 0 ? trimmedSection[(contentStart + 1)..].Trim() : trimmedSection;

            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO FTSDocsArticle (Id, Product, Title, Content) VALUES ({0}, {1}, {2}, {3})",
                Guid.NewGuid().ToString(),
                productName,
                title,
                articleContent);

            articlesCount++;
        }

        return articlesCount;
    }

    private static string? ExtractFileName(string url)
    {
        // URL format: https://docs.duendesoftware.com/_llms-txt/access-token-management.txt
        var match = LlmsTxtFileNameRegex().Match(url);
        return match.Success ? match.Groups[1].Value : null;
    }

    private static string? ExtractH1Title(string markdown)
    {
        // Find first line starting with # (but not ##)
        using var reader = new StringReader(markdown);
        while (reader.ReadLine() is { } line)
        {
            var trimmed = line.TrimStart();
            if (trimmed.StartsWith("# ", StringComparison.Ordinal))
            {
                return trimmed[2..].Trim();
            }

            // Skip empty lines, but stop at non-heading content
            if (!string.IsNullOrWhiteSpace(trimmed) && !trimmed.StartsWith('#'))
            {
                break;
            }
        }

        return null;
    }

    [GeneratedRegex(@"_llms-txt/([^/]+\.txt)$", RegexOptions.IgnoreCase)]
    private static partial Regex LlmsTxtFileNameRegex();
}
