// Copyright (c) Duende Software. All rights reserved.
// See LICENSE in the project root for license information.

namespace Docs.Indexer.Infrastructure;

/// <summary>
/// A temporary file stream that automatically deletes the file when disposed.
/// Used for processing large downloads like ZIP files without keeping them in memory.
/// </summary>
public sealed class TemporaryFileStream : FileStream
{
    private readonly string _path;

    private TemporaryFileStream(string path)
        : base(path, FileMode.OpenOrCreate, FileAccess.ReadWrite)
    {
        _path = path;
    }

    /// <summary>
    /// Creates a temporary file stream by copying content from another stream.
    /// </summary>
    public static async Task<TemporaryFileStream> CreateFromAsync(Stream sourceStream)
    {
        var tempStream = Create();

        await sourceStream.CopyToAsync(tempStream);
        tempStream.Position = 0;

        return tempStream;
    }

    private static TemporaryFileStream Create()
    {
        var path = Path.Combine(
            Path.GetTempPath(),
            $"{Guid.NewGuid()}.tmp");

        return new TemporaryFileStream(path);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        try
        {
            File.Delete(_path);
        }
        catch (IOException)
        {
            // Best-effort cleanup - file may be locked or inaccessible
        }
        catch (UnauthorizedAccessException)
        {
            // Best-effort cleanup - insufficient permissions
        }
    }
}
