using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Docs.Web.Tests;

/// <summary>
/// A custom WebApplicationFactory that provides a temporary wwwroot directory
/// containing a test-specific redirects.json, isolated from the production build output.
/// </summary>
public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _tempWebRoot;

    public static readonly Dictionary<string, string> TestRedirects = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/old-path"] = "/new-path/",
        ["/another"] = "/destination/",
    };

    public CustomWebApplicationFactory()
    {
        _tempWebRoot = Path.Combine(Path.GetTempPath(), "Docs.Web.Tests", Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempWebRoot);

        // Write the test redirects.json to the temp web root
        var redirectsJson = JsonSerializer.Serialize(TestRedirects);
        File.WriteAllText(Path.Combine(_tempWebRoot, "redirects.json"), redirectsJson);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Point the app at our temp directory so Program.cs reads the test redirects.json
        builder.UseWebRoot(_tempWebRoot);

        // Use test environment to avoid OTLP export attempts
        builder.UseEnvironment("Testing");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(_tempWebRoot))
        {
            Directory.Delete(_tempWebRoot, recursive: true);
        }
    }
}
