namespace Docs.Web.Middleware;

/// <summary>
/// Middleware that redirects requests without a trailing slash to the same path with a trailing slash (301 permanent).
/// Skips paths with file extensions and health-check endpoints.
/// </summary>
public class TrailingSlashMiddleware : IMiddleware
{
    public Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var path = context.Request.Path.Value;

        if (!string.IsNullOrEmpty(path) &&
            !path.EndsWith("/") &&
            !Path.HasExtension(path) &&
            !path.StartsWith("/health") &&
            !path.StartsWith("/alive"))
        {
            var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "";
            context.Response.StatusCode = 301;
            context.Response.Headers.Location = $"{path}/{queryString}";
            return Task.CompletedTask;
        }

        return next(context);
    }
}
