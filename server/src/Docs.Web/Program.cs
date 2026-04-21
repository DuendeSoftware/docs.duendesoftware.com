using System.Text.Json;
using Docs.Web;
using Docs.Web.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add response compression
builder.Services.AddResponseCompression();

// Custom middlewares
builder.Services.AddTransient<MarkdownContentNegotationMiddleware>();
builder.Services.AddTransient<TrailingSlashMiddleware>();
builder.Services.AddTransient<NotFoundMiddleware>();

// Load redirect map from Astro-generated redirects.json
var redirectMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
var redirectsPath = Path.Combine(builder.Environment.WebRootPath, "redirects.json");
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
}
builder.Services.AddSingleton<IReadOnlyDictionary<string, string>>(redirectMap);
builder.Services.AddTransient<RedirectMiddleware>();

var app = builder.Build();

if (redirectMap.Count > 0)
{
    app.Logger.LogInformation("Loaded {Count} redirects from redirects.json", redirectMap.Count);
}
else
{
    app.Logger.LogWarning("No redirects loaded (redirects.json missing or empty at {Path})", redirectsPath);
}

app.MapDefaultEndpoints();

// Redirect middleware — match old URLs to new destinations (301 permanent)
app.UseMiddleware<RedirectMiddleware>();

// Enable response compression
app.UseResponseCompression();

// Serve .md file when Accept: text/markdown
app.UseMiddleware<MarkdownContentNegotationMiddleware>();

// Add trailing slash redirect middleware (replicate nginx behavior)
app.UseMiddleware<TrailingSlashMiddleware>();

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
app.UseMiddleware<NotFoundMiddleware>();

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
