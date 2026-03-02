// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using System.ComponentModel.DataAnnotations;

namespace Docs.Mcp.Database;

/// <summary>
/// Represents a documentation article indexed for full-text search.
/// </summary>
public sealed class FTSDocsArticle
{
    [Key]
    public required string Id { get; init; }

    public required string Product { get; init; }

    public required string Title { get; init; }

    public required string Content { get; init; }
}
