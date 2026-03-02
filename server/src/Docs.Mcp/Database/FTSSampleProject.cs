// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

using System.ComponentModel.DataAnnotations;

namespace Docs.Mcp.Database;

/// <summary>
/// Represents a code sample project indexed for full-text search.
/// </summary>
public sealed class FTSSampleProject
{
    [Key]
    public required string Id { get; init; }

    public required string Product { get; init; }

    public required string Title { get; init; }

    public required string Description { get; init; }

    public List<string> Files { get; init; } = [];
}
