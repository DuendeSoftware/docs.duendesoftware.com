namespace Docs.Web.Middleware;

/// <summary>
/// Middleware that redirects old URLs to new destinations using a preloaded redirect map (301 permanent).
/// </summary>
public class RedirectMiddleware(IReadOnlyDictionary<string, string> redirectMap) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var path = context.Request.Path.Value?.TrimEnd('/') ?? "";

        if (redirectMap.TryGetValue(path, out var destination))
        {
            var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "";
            context.Response.StatusCode = 301;
            context.Response.Headers.Location = $"{destination}{queryString}";
            return;
        }

        await next(context);
    }
}
