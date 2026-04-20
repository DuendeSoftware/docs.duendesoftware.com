namespace Docs.Web;

/// <summary>
/// Middleware that serves .md files when the client sends Accept: text/markdown.
/// </summary>
public class ContentNegotiationMiddleware : IMiddleware
{
    private readonly IWebHostEnvironment _environment;

    public ContentNegotiationMiddleware(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var accept = context.Request.Headers.Accept.ToString();
        if (accept.Contains("text/markdown", StringComparison.OrdinalIgnoreCase))
        {
            var requestPath = context.Request.Path.Value?.TrimEnd('/') ?? "";

            // Try the exact path with .md extension, then index.md inside the directory
            var candidates = new[]
            {
                Path.Combine(_environment.WebRootPath, requestPath.TrimStart('/') + ".md"),
                Path.Combine(_environment.WebRootPath, requestPath.TrimStart('/'), "index.md")
            };

            foreach (var mdPath in candidates)
            {
                if (File.Exists(mdPath))
                {
                    context.Response.ContentType = "text/markdown; charset=utf-8";
                    context.Response.Headers.TryAdd("content-signal", "ai-train=yes, search=yes, ai-input=yes");
                    await context.Response.SendFileAsync(mdPath);
                    return;
                }
            }
        }

        await next(context);
    }
}
