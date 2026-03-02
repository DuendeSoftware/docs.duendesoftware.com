// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Docs.Mcp.Database;

/// <summary>
/// Database context for the MCP server's full-text search index.
/// Uses SQLite FTS5 for efficient text search.
/// </summary>
public sealed class McpDb(DbContextOptions<McpDb> options) : DbContext(options)
{
    public DbSet<FTSDocsArticle> FTSDocsArticle => Set<FTSDocsArticle>();

    public DbSet<FTSBlogArticle> FTSBlogArticle => Set<FTSBlogArticle>();

    public DbSet<FTSSampleProject> FTSSampleProject => Set<FTSSampleProject>();

    /// <summary>
    /// Creates the FTS5 virtual tables. Call this when creating a fresh database.
    /// </summary>
    public async Task CreateFtsTablesAsync(CancellationToken cancellationToken = default)
    {
        await Database.ExecuteSqlRawAsync(
            "CREATE VIRTUAL TABLE IF NOT EXISTS FTSDocsArticle USING fts5(Id, Product, Title, Content, tokenize = 'porter unicode61');",
            cancellationToken);

        await Database.ExecuteSqlRawAsync(
            "CREATE VIRTUAL TABLE IF NOT EXISTS FTSBlogArticle USING fts5(Id, Title, Content, tokenize = 'porter unicode61');",
            cancellationToken);

        await Database.ExecuteSqlRawAsync(
            "CREATE VIRTUAL TABLE IF NOT EXISTS FTSSampleProject USING fts5(Id, Product, Title, Description, Files, tokenize = 'porter unicode61');",
            cancellationToken);
    }

    /// <summary>
    /// Escapes a query string for safe use in FTS5 MATCH expressions.
    /// Each word is wrapped in quotes to treat it as a literal term.
    /// </summary>
    public static string? EscapeFtsQueryString(string? query)
        => !string.IsNullOrEmpty(query)
            ? string.Join(" ", query.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Select(q => $"\"{q.Replace("\"", "\"\"", StringComparison.OrdinalIgnoreCase)}\""))
            : query;

    /// <summary>
    /// Escapes a query string for safe use in FTS5 MATCH expressions,
    /// joining terms with the specified operator (e.g., "OR", "AND").
    /// </summary>
    public static string? EscapeFtsQueryString(string? query, string joinWith)
        => !string.IsNullOrEmpty(query)
            ? string.Join($" {joinWith} ", query.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Select(q => $"\"{q.Replace("\"", "\"\"", StringComparison.OrdinalIgnoreCase)}\""))
            : query;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // FTS5 tables don't have traditional primary keys in the EF sense,
        // but we still need to configure the entities for querying
        modelBuilder.Entity<FTSDocsArticle>().HasNoKey();
        modelBuilder.Entity<FTSBlogArticle>().HasNoKey();
        modelBuilder.Entity<FTSSampleProject>(entity =>
        {
            entity.HasNoKey();

            // FTS5 stores Files as a JSON text column — convert to/from List<string>
            entity.Property(e => e.Files).HasConversion(
                new ValueConverter<List<string>, string>(
                    v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
                    v => JsonSerializer.Deserialize<List<string>>(v, JsonSerializerOptions.Default) ?? new List<string>()));
        });
    }
}
