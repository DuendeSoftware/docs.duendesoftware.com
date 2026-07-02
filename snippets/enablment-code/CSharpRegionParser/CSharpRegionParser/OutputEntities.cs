using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Text;


namespace CSharpRegionParser;

public record SnippetsMetadata(ImmutableArray<SnippetsMetadata.SnippetMetadata> Snippets)
{
    public record SnippetMetadata(string Id, string RelativeFilePath);

    public const string FileName = "snippets-metadata.json";
}

public record Snippet(string Id, string Language, string CodeBase64)
{
    public const string DirectoryName = "/snippet-files";
}