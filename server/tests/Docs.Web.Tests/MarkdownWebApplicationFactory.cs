using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Docs.Web.Tests;

/// <summary>
/// A WebApplicationFactory that creates a temp wwwroot with .md files for content negotiation tests.
/// </summary>
public sealed class MarkdownWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _tempWebRoot;

    public MarkdownWebApplicationFactory()
    {
        _tempWebRoot = Path.Combine(Path.GetTempPath(), "Docs.Web.Tests.Md", Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempWebRoot);

        // Write empty redirects.json so Program.cs doesn't warn
        File.WriteAllText(Path.Combine(_tempWebRoot, "redirects.json"), "{}");

        // Create test markdown files
        var guideDir = Path.Combine(_tempWebRoot, "docs", "guide");
        Directory.CreateDirectory(guideDir);
        File.WriteAllText(Path.Combine(guideDir, "index.md"), "# Guide");

        var docsDir = Path.Combine(_tempWebRoot, "docs");
        File.WriteAllText(Path.Combine(docsDir, "page.md"), "# Page");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseWebRoot(_tempWebRoot);
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
