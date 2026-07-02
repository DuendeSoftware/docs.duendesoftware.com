using CSharpRegionParser;
using CSharpRegionParser.Settings;

using System.Collections.Immutable;
using System.Text.Json;
using System.Text.Json.Serialization;

//1. Load settings
var parseSettingsPath = "D:/GitHub/DuendeSoftware/docs.duendesoftware.com/snippets/snippet-parse-settings.json";
var jsonSettings = new JsonSerializerOptions()
{
    AllowTrailingCommas = true,
    PropertyNameCaseInsensitive = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    Converters =
    {
        new JsonStringEnumConverter()
    }
};

var parseSettingsJson = File.ReadAllText(parseSettingsPath);
var parseSettingsDto = JsonSerializer.Deserialize<ParsingSettingsDto?>(parseSettingsJson, jsonSettings) ?? throw new Exception("Deserializing ParsingSettingsDto was null");
var parseSettings = parseSettingsDto.GenerateValidConfigObject();

//2. Find all *.cs files from there to parse -- need way to filter out code
var dirs = Directory.GetDirectories(parseSettings.RootDirectory, "*.*", SearchOption.AllDirectories)
                    .ToImmutableArray();

//3. Load info for all regions in found files
var allRegionInfos = new List<RegionInfo>();
var parser = new CSharpRegionsParser(parseSettings);
foreach (var dir in dirs)
{
    //Skip the excluded directories
    if (parseSettings.ExcludedDirectoryNames.Any(x => dir.Contains(x, StringComparison.OrdinalIgnoreCase)))
    {
        continue;
    }

    foreach (var filePath in Directory.EnumerateFiles(dir, "*.cs"))
    {
        var fileContent = File.ReadAllText(filePath);

        var infos = parser.LoadRegionsFromFile(filePath, fileContent);
        allRegionInfos.AddRange(infos);
    }
}

Console.WriteLine(allRegionInfos.Count);

//4. Write out files -- single file for all snippets, one file per snippet
var metadataFilePath = $"{parseSettings.OutputSnippetsDirectory}/{SnippetsMetadata.FileName}";
var snippetsDirectory = $"{parseSettings.OutputSnippetsDirectory}/{Snippet.DirectoryName}";
if (Directory.Exists(snippetsDirectory))
{
    Directory.Delete(snippetsDirectory, recursive: true);
}
Directory.CreateDirectory(snippetsDirectory);

var snippetsList = new List<Snippet>();
var snippetMetadatasList = new List<SnippetsMetadata.SnippetMetadata>();

foreach (var regionInfo in allRegionInfos)
{
    var snippet = new Snippet(Id: regionInfo.RegionName, Language: "csharp", CodeBase64: regionInfo.CodeBase64);
    snippetsList.Add(snippet);

    var relativeFilePath = $"{Snippet.DirectoryName}/{snippet.Id}.json";
    var fullFilePath = $"{parseSettings.OutputSnippetsDirectory}/{relativeFilePath}";
    var snippetJson = JsonSerializer.Serialize(snippet, jsonSettings);
    File.WriteAllText(fullFilePath, snippetJson);

    var snippetMetadata = new SnippetsMetadata.SnippetMetadata(Id: snippet.Id, RelativeFilePath: $"{Snippet.DirectoryName}/{snippet.Id}.json");
    snippetMetadatasList.Add(snippetMetadata);
}

var snippetsMetadata = new SnippetsMetadata(Snippets: snippetMetadatasList.ToImmutableArray());
var snippetsMetadataJson = JsonSerializer.Serialize(snippetsMetadata, jsonSettings);

File.WriteAllText(metadataFilePath, snippetsMetadataJson);
