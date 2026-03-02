// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using Docs.Indexer.Indexers;
using Docs.Mcp.Database;
using Microsoft.EntityFrameworkCore;

// Parse command line arguments
string? wwwrootPath = null;
string? outputPath = null;
var forceRebuild = false;

for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--wwwroot" when i + 1 < args.Length:
            wwwrootPath = args[++i];
            break;
        case "--output" when i + 1 < args.Length:
            outputPath = args[++i];
            break;
        case "--force":
            forceRebuild = true;
            break;
    }
}

if (string.IsNullOrEmpty(wwwrootPath))
{
    Console.Error.WriteLine("Error: --wwwroot <path> is required");
    Console.Error.WriteLine("Usage: Docs.Indexer --wwwroot <path> --output <path> [--force]");
    return 1;
}

if (string.IsNullOrEmpty(outputPath))
{
    Console.Error.WriteLine("Error: --output <path> is required");
    Console.Error.WriteLine("Usage: Docs.Indexer --wwwroot <path> --output <path> [--force]");
    return 1;
}

if (!Directory.Exists(wwwrootPath))
{
    Console.Error.WriteLine($"Error: wwwroot path does not exist: {wwwrootPath}");
    return 1;
}

// Skip if database already exists (unless --force)
if (File.Exists(outputPath) && !forceRebuild)
{
    Console.WriteLine($"Database already exists: {outputPath}");
    Console.WriteLine("Skipping indexing. Use --force to rebuild.");
    return 0;
}

// Ensure output directory exists
var outputDir = Path.GetDirectoryName(outputPath);
if (!string.IsNullOrEmpty(outputDir))
{
    Directory.CreateDirectory(outputDir);
}

// Delete existing database if it exists
if (File.Exists(outputPath))
{
    Console.WriteLine($"Deleting existing database: {outputPath}");
    File.Delete(outputPath);
}

Console.WriteLine($"Creating MCP index database: {outputPath}");
Console.WriteLine($"Source wwwroot: {wwwrootPath}");

// Create database context
var optionsBuilder = new DbContextOptionsBuilder<McpDb>();
optionsBuilder.UseSqlite($"Data Source={outputPath}");

await using var db = new McpDb(optionsBuilder.Options);

// Create FTS5 tables
Console.WriteLine("Creating FTS5 tables...");
await db.CreateFtsTablesAsync();

// Run indexers
using var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Duende.Docs.Indexer/1.0");

var docsIndexer = new DocsIndexer(db);
var blogIndexer = new BlogIndexer(db, httpClient);
var samplesIndexer = new SamplesIndexer(db, httpClient);

Console.WriteLine();
Console.WriteLine("=== Indexing Documentation ===");
await docsIndexer.IndexAsync(wwwrootPath);

Console.WriteLine();
Console.WriteLine("=== Indexing Blog ===");
await blogIndexer.IndexAsync();

Console.WriteLine();
Console.WriteLine("=== Indexing Samples ===");
await samplesIndexer.IndexAsync();

Console.WriteLine();
Console.WriteLine("=== Indexing Complete ===");
Console.WriteLine($"Database created at: {outputPath}");
Console.WriteLine($"  Docs articles: {await db.FTSDocsArticle.CountAsync()}");
Console.WriteLine($"  Blog articles: {await db.FTSBlogArticle.CountAsync()}");
Console.WriteLine($"  Sample projects: {await db.FTSSampleProject.CountAsync()}");

return 0;
