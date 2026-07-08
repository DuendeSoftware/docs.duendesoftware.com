using CSharpRegionParser;
using CSharpRegionParser.Settings;

using System.Collections.Immutable;
using System.Text.Json;
using System.Text.Json.Serialization;

//1. Load settings
var parseSettingsPath = "D:/GitHub/DuendeSoftware/docs.duendesoftware.com/snippets/snippet-parse-settings.json";
var parseSettingsRoot = Path.GetDirectoryName(parseSettingsPath)!;
Directory.SetCurrentDirectory(parseSettingsRoot);

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
var outputFilePath = $"{parseSettings.OutputSnippetsDirectory}/{SnippetsOutput.FileName}";
var outputSnippetsList = new List<SnippetsOutput.Snippet>();

foreach (var regionInfo in allRegionInfos)
{
    var snippet = new SnippetsOutput.Snippet(Id: regionInfo.RegionName, Language: "csharp", CodeBase64: regionInfo.CodeBase64);
    outputSnippetsList.Add(snippet);
}

var snippetsOutput = new SnippetsOutput(Snippets: outputSnippetsList.ToImmutableArray());
var snippetsOutputJson = JsonSerializer.Serialize(snippetsOutput, jsonSettings);

File.WriteAllText(outputFilePath, snippetsOutputJson);
