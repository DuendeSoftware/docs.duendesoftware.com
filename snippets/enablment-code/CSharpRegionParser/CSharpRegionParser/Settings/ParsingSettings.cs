using System.Collections.Frozen;
using System.Text.Json.Serialization;

namespace CSharpRegionParser.Settings;

public record ParsingSettings(
    string RootDirectory,
    FrozenSet<string> ExcludedDirectoryNames,
    bool ReduceIndentation,
    string OutputSnippetsDirectory);

public class ParsingSettingsDto : DtoBase<ParsingSettings>
{
    [JsonRequired]
    public string? RootDirectory { get; set; }
    [JsonRequired]
    public List<string?>? ExcludedDirectoryNames { get; set; }
    [JsonRequired]
    public bool? ReduceIndentation { get; set; }
    [JsonRequired]
    public string? OutputSnippetsDirectory { get; set; }

    protected override ParsingSettings? GenerateConfigObject()
    {
        if (!string.IsNullOrWhiteSpace(RootDirectory)
            && ReduceIndentation.HasValue
            && !string.IsNullOrWhiteSpace(OutputSnippetsDirectory)
            && ExcludedDirectoryNames is not null
            && (ExcludedDirectoryNames.Count == 0 || ExcludedDirectoryNames.All(x => !string.IsNullOrWhiteSpace(x))))
        {
            var excludedDirectories = ExcludedDirectoryNames.Select(x => x!).ToFrozenSet();
            return new ParsingSettings(
                RootDirectory,
                excludedDirectories,
                ReduceIndentation.Value,
                OutputSnippetsDirectory);
        }

        return null;
    }
}
