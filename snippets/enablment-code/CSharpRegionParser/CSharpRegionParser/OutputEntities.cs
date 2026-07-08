using System.Collections.Immutable;

namespace CSharpRegionParser;

public record SnippetsOutput(ImmutableArray<SnippetsOutput.Snippet> Snippets)
{
    public const string FileName = "snippets.json";
    public record Snippet(string Id, string Language, string CodeBase64);
}

