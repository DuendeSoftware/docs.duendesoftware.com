#:package Bullseye@5.0.0
#:package SimpleExec@12.0.0

using Bullseye;
using static Bullseye.Targets;
using static SimpleExec.Command;

// Find repository root
var repoRoot = Directory.GetCurrentDirectory();
while (!Directory.Exists(Path.Combine(repoRoot, ".git")))
{
    repoRoot = Directory.GetParent(repoRoot)?.FullName
        ?? throw new InvalidOperationException("Could not find repository root");
}

var serverDir = Path.Combine(repoRoot, "server");
var mcpdataDir = Path.Combine(serverDir, "src", "Docs.Web", "data");
var wwwrootDir = Path.Combine(serverDir, "src", "Docs.Web", "wwwroot");

// Target names
const string Restore = "restore";
const string AstroBuild = "astro-build";
const string DotnetBuild = "dotnet-build";
const string DotnetTest = "dotnet-test";
const string DotnetPublish = "dotnet-publish";
const string McpIndex = "mcp-index";
const string Build = "build";
const string Container = "container";
const string Aspire = "aspire";
const string LinkCheck = "link-check";
const string VerifyFormatting = "verify-formatting";
const string Clean = "clean";
const string Default = "default";

// Restore
Target(Restore, () =>
    RunAsync("dotnet", "restore Docs.slnx", workingDirectory: serverDir));

// Astro build in container - avoids Windows npm issues with platform-specific dependencies
Target(AstroBuild, async () =>
{
    // Ensure output directory exists
    Directory.CreateDirectory(wwwrootDir);
    
    // Convert Windows paths to Docker-compatible format (forward slashes)
    var astroPath = Path.Combine(repoRoot, "astro").Replace('\\', '/');
    var outputPath = wwwrootDir.Replace('\\', '/');
    
    // Use Docker to build Astro - consistent across all platforms
    // Use Debian-based image (not Alpine) for better compatibility with native modules
    // Increase Node.js memory limit to handle large builds
    await RunAsync("docker", 
        "run --rm " +
        $"-v \"{astroPath}:/app\" " +
        $"-v \"{outputPath}:/output\" " +
        "-w /app " +
        "-e NODE_OPTIONS=\"--max-old-space-size=4096\" " +
        "node:22-slim " +
        "sh -c \"npm ci && npm run build -- --outDir /output\"",
        configureEnvironment: env => env.Add("MSYS_NO_PATHCONV", "1"));
});

Target(DotnetBuild, dependsOn: [Restore], () =>
    RunAsync("dotnet", "build Docs.slnx --no-restore", workingDirectory: serverDir));

Target(DotnetTest, dependsOn: [DotnetBuild], () =>
    RunAsync("dotnet", "test Docs.slnx --no-build", workingDirectory: serverDir));

Target(DotnetPublish, dependsOn: [Restore], () =>
    RunAsync("dotnet", "publish src/Docs.Web/Docs.Web.csproj -c Release --no-restore",
        workingDirectory: serverDir));

Target(McpIndex, dependsOn: [AstroBuild, Restore], () =>
    RunAsync("dotnet", $"run --project src/Docs.Indexer/Docs.Indexer.csproj --no-restore -- --wwwroot \"{wwwrootDir}\" --output \"{mcpdataDir}/mcp.db\"",
        workingDirectory: serverDir));

Target(Build, dependsOn: [AstroBuild, McpIndex, DotnetBuild]);

Target(Default, dependsOn: [Build, DotnetTest]);

// Container (no Dockerfile needed!)
Target(Container, dependsOn: [AstroBuild, McpIndex], () =>
    RunAsync("dotnet", "publish src/Docs.Web/Docs.Web.csproj -c Release /t:PublishContainer",
        workingDirectory: serverDir));

// Dev
Target(Aspire, () =>
    RunAsync("dotnet", "run --project src/Docs.AppHost", workingDirectory: serverDir));

// Quality - Link check builds Astro; actual lychee runs in CI workflow due to secrets
Target(LinkCheck, dependsOn: [AstroBuild], () =>
    Console.WriteLine($"Astro built to {wwwrootDir}. Run lychee manually or via CI workflow."));

Target(VerifyFormatting, dependsOn: [Restore], () =>
    RunAsync("dotnet", "format Docs.slnx --verify-no-changes --no-restore",
        workingDirectory: serverDir));

// Clean
Target(Clean, async () =>
{
    await RunAsync("dotnet", "clean Docs.slnx", workingDirectory: serverDir);
    if (Directory.Exists(wwwrootDir))
        Directory.Delete(wwwrootDir, recursive: true);
});

await RunTargetsAndExitAsync(args);
