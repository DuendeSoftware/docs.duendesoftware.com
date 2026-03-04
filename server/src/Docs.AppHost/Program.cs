var builder = DistributedApplication.CreateBuilder(args);

// Astro build
_ = builder
    .AddJavaScriptApp("astro-build", "../../../astro", "build")
    .WithExplicitStart();

// MCP server indexer
_ = builder.AddProject<Projects.Docs_Indexer>("mcp-indexer")
    .WithExplicitStart()
    .WithArgs(
        // Paths relative to indexer executable
        "--wwwroot", "../../../../../../astro/dist",
        "--output", "../../../../../../server/src/Docs.Web/data/mcp.db");

// Astro dev server (for local development only)
_ = builder.AddJavaScriptApp("astro-dev", "../../../astro")
    .WithHttpEndpoint(port: 4321, env: "PORT")
    .WithExternalHttpEndpoints();

// ASP.NET Core static file server
_ = builder.AddProject<Projects.Docs_Web>("web")
    .WithExplicitStart()
    .OnBeforeResourceStarted((resource, resourceEvent, cancellationToken) =>
    {
        // Try copying Astro build dist folder to server wwwroot
        var sourceDirectory = NormalizePathForCurrentPlatform("../../../astro/dist");
        var destinationDirectory = NormalizePathForCurrentPlatform("../../../server/src/Docs.Web/wwwroot");

        CopyDirectory(sourceDirectory, destinationDirectory);

        return Task.CompletedTask;

        string NormalizePathForCurrentPlatform(string path)
        {
            path = path.Replace('\\', Path.DirectorySeparatorChar).Replace('/', Path.DirectorySeparatorChar);
            return Path.GetFullPath(path);
        }

        void CopyDirectory(string sourcePath, string destinationPath)
        {
            // Get information about the source directory
            var dir = new DirectoryInfo(sourcePath);

            // Check if the source directory exists
            if (!dir.Exists)
                throw new DirectoryNotFoundException($"Source directory not found: {dir.FullName}");

            // Cache directories before we start copying
            DirectoryInfo[] dirs = dir.GetDirectories();

            // Create the destination directory
            if (!Directory.Exists(destinationPath))
                Directory.CreateDirectory(destinationPath);

            // Get the files in the source directory and copy to the destination directory
            foreach (var file in dir.GetFiles())
            {
                string targetFilePath = Path.Combine(destinationPath, file.Name);
                file.CopyTo(targetFilePath, overwrite: true);
            }

            foreach (DirectoryInfo subDir in dirs)
            {
                string newDestinationDir = Path.Combine(destinationPath, subDir.Name);
                CopyDirectory(subDir.FullName, newDestinationDir);
            }
        }
    });

builder.Build().Run();
