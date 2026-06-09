namespace Docs.Web.Middleware;

/// <summary>
/// Middleware that redirects requests with uppercase characters in the path to the lowercase equivalent (301 permanent).
/// Preserves the query string. Skips health-check endpoints.
/// </summary>
public class LowercaseUrlMiddleware : IMiddleware
{
    public Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var path = context.Request.Path.Value;

        if (!string.IsNullOrEmpty(path) &&
            !path.StartsWith("/health", StringComparison.OrdinalIgnoreCase) &&
            !path.StartsWith("/alive", StringComparison.OrdinalIgnoreCase) &&
            !path.StartsWith("/_astro", StringComparison.OrdinalIgnoreCase) &&
            !path.StartsWith("/favicon", StringComparison.OrdinalIgnoreCase) &&
            !path.StartsWith("/license", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".js", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".css", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".woff", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".woff2", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".png", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase) &&
            !path.EndsWith(".ico", StringComparison.OrdinalIgnoreCase) &&
            path != path.ToLowerInvariant())
        {
            var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "";
            context.Response.StatusCode = 301;
            context.Response.Headers.Location = $"{path.ToLowerInvariant()}{queryString}";
            return Task.CompletedTask;
        }

        return next(context);
    }
}
