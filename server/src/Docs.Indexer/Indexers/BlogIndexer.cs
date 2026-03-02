// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using Docs.Mcp.Database;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;
using ReverseMarkdown;
using SimpleFeedReader;

namespace Docs.Indexer.Indexers;

/// <summary>
/// Indexes blog articles from the Duende Software RSS feed.
/// </summary>
public sealed class BlogIndexer(McpDb db, HttpClient httpClient)
{
    private const string RssFeedUrl = "https://duendesoftware.com/rss.xml";
    private static readonly DateTime ReferenceDate = new(2024, 10, 01);

    /// <summary>
    /// Fetch and index blog articles from the RSS feed.
    /// </summary>
    public async Task IndexAsync()
    {
        Console.WriteLine($"Fetching RSS feed: {RssFeedUrl}");

        var reader = new FeedReader();
        var items = await reader.RetrieveFeedAsync(RssFeedUrl);

        // Filter to blog posts since the reference date
        var blogItems = items
            .Where(it => it.PublishDate >= ReferenceDate && it.Categories?.Contains("blog") == true)
            .ToList();

        Console.WriteLine($"Found {blogItems.Count} blog posts since {ReferenceDate:yyyy-MM-dd}");

        var indexedCount = 0;
        foreach (var item in blogItems)
        {
            if (item.Uri == null)
            {
                continue;
            }

            try
            {
                await IndexBlogPostAsync(item.Title ?? "Untitled", item.GetSummary(), item.Uri);
                indexedCount++;
                Console.WriteLine($"  Indexed: {item.Title}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"  Warning: Failed to index '{item.Title}': {ex.Message}");
            }
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"Indexed {indexedCount} blog articles");
    }

    private async Task IndexBlogPostAsync(string title, string? description, Uri url)
    {
        // Fetch the HTML content
        var htmlContent = await httpClient.GetStringAsync(url);

        // Parse HTML and find content section
        var htmlDocument = new HtmlDocument();
        htmlDocument.LoadHtml(htmlContent);

        // Try to find the main content section
        var content = htmlDocument.DocumentNode.SelectSingleNode("//section[@class='page-content alt markdown']")
            ?? htmlDocument.DocumentNode.SelectSingleNode("//article")
            ?? htmlDocument.DocumentNode.SelectSingleNode("//main");

        if (content == null)
        {
            Console.WriteLine($"    Warning: Could not find content section for {title}");
            return;
        }

        // Convert HTML to Markdown
        var converter = new Converter(new Config
        {
            GithubFlavored = true,
            RemoveComments = true
        });

        var markdownContent = converter.Convert(content.InnerHtml);

        // Combine description with content if available
        var fullContent = !string.IsNullOrEmpty(description)
            ? $"Summary: {description}\n\n---\n\n{markdownContent}"
            : markdownContent;

        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO FTSBlogArticle (Id, Title, Content) VALUES ({0}, {1}, {2})",
            Guid.NewGuid().ToString(),
            title,
            fullContent);
    }
}
