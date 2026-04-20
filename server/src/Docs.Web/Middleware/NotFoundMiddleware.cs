namespace Docs.Web.Middleware;

/// <summary>
/// Middleware that serves a custom 404.html page when the response status code is 404.
/// </summary>
public class NotFoundMiddleware : IMiddleware
{
    private readonly IWebHostEnvironment _environment;

    public NotFoundMiddleware(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        await next(context);

        if (context.Response.StatusCode == 404 && !context.Response.HasStarted)
        {
            var notFoundPath = Path.Combine(_environment.WebRootPath, "404.html");

            if (File.Exists(notFoundPath))
            {
                context.Response.ContentType = "text/html";
                await context.Response.SendFileAsync(notFoundPath);
            }
        }
    }
}
