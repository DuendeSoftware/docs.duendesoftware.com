using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add response compression
builder.Services.AddResponseCompression();

var app = builder.Build();

app.MapDefaultEndpoints();

// Load redirect map from Astro-generated redirects.json
var redirectMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
var redirectsPath = Path.Combine(app.Environment.WebRootPath, "redirects.json");
if (File.Exists(redirectsPath))
{
    var json = File.ReadAllText(redirectsPath);
    var parsed = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
    if (parsed is not null)
    {
        foreach (var (key, value) in parsed)
        {
            redirectMap[key] = value;
        }
    }
    app.Logger.LogInformation("Loaded {Count} redirects from redirects.json", redirectMap.Count);
}
else
{
    app.Logger.LogWarning("redirects.json not found at {Path}, no redirects will be applied", redirectsPath);
}

// Redirect middleware — match old URLs to new destinations (301 permanent)
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.TrimEnd('/') ?? "";

    if (redirectMap.TryGetValue(path, out var destination))
    {
        var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "";
        context.Response.StatusCode = 301;
        context.Response.Headers.Location = $"{destination}{queryString}";
        return;
    }

    await next();
});

// Enable response compression
app.UseResponseCompression();

// Add trailing slash redirect middleware (replicate nginx behavior)
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value;

    // If path doesn't end with slash and doesn't have a file extension, redirect with trailing slash
    if (!string.IsNullOrEmpty(path) &&
        !path.EndsWith("/") &&
        !Path.HasExtension(path) &&
        !path.StartsWith("/health") &&
        !path.StartsWith("/alive"))
    {
        var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "";
        context.Response.StatusCode = 301;
        context.Response.Headers.Location = $"{path}/{queryString}";
        return;
    }

    await next();
});

// Add version header if APPLICATION_VERSION is set
var applicationVersion = Environment.GetEnvironmentVariable("APPLICATION_VERSION");
if (!string.IsNullOrEmpty(applicationVersion))
{
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-REVISION"] = applicationVersion;
        await next();
    });
}

// Serve static files from wwwroot with proper caching
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ServeUnknownFileTypes = true,
    
    OnPrepareResponse = ctx =>
    {
        var path = ctx.File.Name;
        var requestPath = ctx.Context.Request.Path.Value ?? "";

        // Pagefind assets (pagefind folder) - cache for 1 hour
        if (requestPath.Contains("/pagefind/"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=3600";
            return;
        }

        // Astro assets (_astro folder) - cache for 1 year
        if (requestPath.Contains("/_astro/"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return;
        }

        // JavaScript and CSS - cache for 1 year
        if (path.EndsWith(".js") || path.EndsWith(".css"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return;
        }

        // Fonts - cache for 1 year
        if (path.EndsWith(".woff") || path.EndsWith(".woff2"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return;
        }

        // SVG - cache for 1 month
        if (path.EndsWith(".svg"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=2592000";
            return;
        }

        // Images - cache for 1 week
        if (path.EndsWith(".png") || path.EndsWith(".jpg") ||
            path.EndsWith(".jpeg") || path.EndsWith(".webp") || path.EndsWith(".ico"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=604800";
            return;
        }

        // HTML - cache for 1 minute (to allow quick updates)
        if (path.EndsWith(".html"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=60";
            return;
        }

        // JSON - cache for 1 year (except redirects.json which is internal)
        if (path.EndsWith(".json") && path != "redirects.json")
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000";
            return;
        }

        // Default: no caching
        ctx.Context.Response.Headers.CacheControl = "no-cache";
    }
});

// Handle 404 with custom page
app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode == 404 && !context.Response.HasStarted)
    {
        var webHostEnvironment = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
        var notFoundPath = Path.Combine(webHostEnvironment.WebRootPath, "404.html");

        if (File.Exists(notFoundPath))
        {
            context.Response.ContentType = "text/html";
            await context.Response.SendFileAsync(notFoundPath);
        }
    }
});

// Fallback to index.html for directory requests
app.MapFallback(async context =>
{
    var webHostEnvironment = context.RequestServices.GetRequiredService<IWebHostEnvironment>();
    var path = context.Request.Path.Value?.TrimEnd('/') ?? "";

    // Try to find index.html in the requested directory
    var indexPath = Path.Combine(webHostEnvironment.WebRootPath, path.TrimStart('/'), "index.html");
    if (File.Exists(indexPath))
    {
        context.Response.ContentType = "text/html";
        context.Response.Headers.CacheControl = "public, max-age=60";
        await context.Response.SendFileAsync(indexPath);
        return;
    }

    // Return 404
    context.Response.StatusCode = 404;
    var notFoundPath = Path.Combine(webHostEnvironment.WebRootPath, "404.html");
    if (File.Exists(notFoundPath))
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(notFoundPath);
    }
});

app.Run();
