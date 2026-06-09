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
            !path.StartsWith("/health") &&
            !path.StartsWith("/alive") &&
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
