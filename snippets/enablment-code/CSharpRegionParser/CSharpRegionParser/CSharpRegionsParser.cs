using CSharpRegionParser.Settings;

using System;
using System.Collections.Frozen;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Text;

namespace CSharpRegionParser;

public record RegionInfo(string RegionName, string FilePath, string FileName, string Code, string CodeBase64);

public class CSharpRegionsParser(ParsingSettings ParsingSettings)
{
    private const string BeginRegionText = "#region";
    private const string EndRegionText = "#endregion";

    public ImmutableArray<RegionInfo> LoadRegionsFromFile(string filePath, string content)
    {
        var fileName = Path.GetFileName(filePath);

        var builder = ImmutableArray.CreateBuilder<RegionInfo>();

        var regionStartIndex = -1;
        while (true)
        {
            regionStartIndex = content.IndexOf(BeginRegionText, regionStartIndex + 1);
            if (regionStartIndex < 0)
            {
                break;
            }

            var endRegionIndex = content.IndexOf(EndRegionText, regionStartIndex);
            if (endRegionIndex < 0)
            {
                continue;
            }

            var regionLength = endRegionIndex - regionStartIndex;
            var regionSpan = content.AsSpan(regionStartIndex, regionLength);

            var regionName = ParseRegionName(regionSpan);
            var regionCode = ParseRegionCode(regionSpan);

            var regionCodeBytes = ASCIIEncoding.ASCII.GetBytes(regionCode);
            string regionCodeBase64 = Convert.ToBase64String(regionCodeBytes);

            builder.Add(new RegionInfo(regionName, filePath, fileName, regionCode, regionCodeBase64));
        }

        return builder.ToImmutableArray();
    }

    private string ParseRegionName(ReadOnlySpan<char> regionSpan)
    {
        //Ex: #region MyRegionName
        //  Start parsing after the '#region' text
        //  Do a Trim() for good measure
        var endLineIndex = regionSpan.IndexOf("\r");
        var regionNameStartIndex = BeginRegionText.Length + 1;
        var nameLength = endLineIndex - regionNameStartIndex;

        return regionSpan.Slice(regionNameStartIndex, nameLength).Trim().ToString();
    }

    private string ParseRegionCode(ReadOnlySpan<char> regionSpan)
    {
        var regionEndLineIndex = regionSpan.IndexOf("\n") + 1;
        var regionCode = regionSpan.Slice(regionEndLineIndex).TrimEnd().ToString();

        if (ParsingSettings.ReduceIndentation)
        {
            regionCode = ReduceCodeIndentation(regionCode);
        }

        return regionCode;
    }

    private string ReduceCodeIndentation(string regionCode)
    {
        var lines = regionCode.Split("\n", StringSplitOptions.None);
        while (true)
        {
            //Remove the first space or tab from each line, only when each line has that same item (space or tab)
            //Do this until at least 1 line does have whitespace at the start, then break out of the loop
            var reduced = TryReduceCharacter(lines, ' ')
                       || TryReduceCharacter(lines, '\t');

            if (!reduced)
            {
                break;
            }
        }

        return string.Join("\n", lines);
    }

    private bool TryReduceCharacter(string[] lines, char character)
    {
        //If every line starts with a space
        //  Remove that space from each line
        if (lines.All(x => x.Length > 0 && x.First() == character))
        {
            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                lines[i] = line.Remove(0, 1);
            }

            return true;
        }

        return false;
    }
}