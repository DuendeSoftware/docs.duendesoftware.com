---
title: "Local APIs"
order: 10
---

A _Local API_ is an API that is located within the BFF host. Local APIs are implemented with the familiar ASP.NET abstractions of API controllers or minimal API endpoints. 

There are two styles of local APIs:
- Self-contained Local APIs
- Local APIs that Make Requests using Managed Access Tokens

#### Self-Contained Local APIs
These APIs reside within the BFF and don't make HTTP requests to other APIs. They access data controlled by the BFF itself, which can simplify the architecture of the system by reducing the number of APIs that must be deployed and managed. They are suitable for scenarios where the BFF is the sole consumer of the data. If you require data accessibility from other applications or services, this approach is probably not suitable.

#### Local APIs that Make Requests using Managed Access Tokens
Alternatively, you can make the data available as a service and make HTTP requests to that service from your BFF's local endpoints. The benefits of this style of Local Endpoint include
- Your frontend's network access can be simplified into an aggregated call for the specific data that it needs, which reduces the amount of data that must be sent to the client.
- Your BFF endpoint can expose a subset of your remote APIs so that they are called in a more controlled manner than if the BFF proxied all requests to the endpoint. 
- Your BFF endpoint can include business logic to call the appropriate endpoints, which simplifies your front end code.

Your local endpoints can leverage services like the HTTP client factory and Duende.BFF [token management](/identityserver/v6/bff/tokens) to make the outgoing calls. The following is a simplified example showing how local endpoints can obtain managed access tokens and use them to make requests to remote APIs.


```cs
[Route("myApi")]
public class MyApiController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public MyApiController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }
    
    public async Task<IActionResult> Get(string id)
    {
        // create HTTP client
        var client = _httpClientFactory.CreateClient();
        
        // get current user access token and set it on HttpClient
        var token = await HttpContext.GetUserAccessTokenAsync();
        client.SetBearerToken(token);

        // call remote API
        var response = await client.GetAsync($"https://remoteServer/remoteApi?id={id}");

        // maybe process response and return to frontend
        return new JsonResult(await response.Content.ReadAsStringAsync());
    }
}
```

The example above is simplified to demonstrate the way that you might obtain a token. Real local endpoints will typically enforce constraints on the way the API is called, aggregate multiple calls, or perform other business logic. Local endpoints that merely forward requests from the frontend to the remote API may not be needed at all. Instead, you could proxy the requests through the BFF using either the [simple http forwarder](remote) or [YARP](yarp).

## Securing Local API Endpoints
Regardless of the style of data access used by a local API, it must be protected against threats such as [CSRF (Cross-Site Request Forgery)](https://developer.mozilla.org/en-US/docs/Glossary/CSRF) attacks. To defend against such attacks and ensure that only the frontend can access these endpoints, we recommend implementing two layers of protection. 

#### SameSite cookies

[The SameSite cookie attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value) is a feature of modern browsers that restricts cookies so that they are only sent to pages originating from the [site](https://developer.mozilla.org/en-US/docs/Glossary/Site) where the cookie was originally issued.

This is a good first layer of defense, but makes the assumption that you can trust all subdomains of your site. All subdomains within a registrable domain are considered the same site for purposes of SameSite cookies. Thus, if another application hosted on a subdomain within your site is infected with malware, it can make CSRF attacks against your application.


#### Anti-forgery header

For this reason, we recommend requiring an additional custom header on API endpoints, for example:

```
GET /endpoint

x-csrf: 1
```

The value of the header is not important, but its presence, combined with the cookie requirement, triggers a CORS preflight request for cross-origin calls. This effectively isolates the caller to the same origin as the backend, providing a robust security guarantee. 

Additionally, API endpoints should handle scenarios where the session has expired or authorization fails without triggering an authentication redirect to the upstream identity provider. Instead, they should return Ajax-friendly status codes.

## Setup
Duende.BFF can automate both the pre-processing step of requiring the custom anti-forgery header and the post-processing step of converting response codes for API endpoints. To do so, first add the BFF middleware to the pipeline, and then decorate your endpoints to indicate that they should receive BFF pre and post processing.

#### Add Middleware
Add the BFF middleware to the pipeline by calling *UseBFF*. Note that the  middleware must be placed before the authorization middleware, but after routing.

```csharp
public void Configure(IApplicationBuilder app)
{
    // rest omitted

    app.UseAuthentication();
    app.UseRouting();

    app.UseBff();

    app.UseAuthorization();

    app.UseEndpoints(endpoints => { /* ... */ }
}
```

#### Decorate Endpoints
Endpoints that require the pre and post processing described above must be decorated with a call to *AsBffApiEndpoint()*.

For minimal API endpoints, you can apply BFF pre- and post-processing when they are mapped.
```csharp
endpoints.MapPost("/foo", context => { ... })
    .RequireAuthorization()  // no anonymous access
    .AsBffApiEndpoint();     // BFF pre/post processing
```


For MVC controllers, you can similarly apply BFF pre- and post-processing to controller actions when they are mapped.
```csharp
endpoints.MapControllers()
    .RequireAuthorization()  // no anonymous access
    .AsBffApiEndpoint();     // BFF pre/post processing
```

Alternatively, you can apply the *[BffApi]* attribute directly to the controller or action.
```csharp
[Route("myApi")]
[BffApi]
public class MyApiController : ControllerBase
{ ... }
```

#### Disabling Anti-forgery Protection

Disabling anti-forgery protection is possible but not recommended. Antiforgery protection defends against CSRF attacks, so opting out may cause security vulnerabilities. 

However, if you are defending against CSRF attacks with some other mechanism, you can opt-out of Duende.BFF's CSRF protection. Depending on the version of Duende.BFF, use one of the following approaches.

For *version 1.x*, set the *requireAntiForgeryCheck* parameter to *false* when adding the endpoint. For example:

```csharp
app.UseEndpoints(endpoints =>
{
    // MVC controllers
    endpoints.MapControllers()
        .RequireAuthorization()
        // WARNING: Disabling antiforgery protection may make
        // your APIs vulnerable to CSRF attacks
        .AsBffApiEndpoint(requireAntiforgeryCheck: false);

    // simple endpoint
    endpoints.MapPost("/foo", context => { /* ... */ })
        .RequireAuthorization()
        // WARNING: Disabling antiforgery protection may make
        // your APIs vulnerable to CSRF attacks
        .AsBffApiEndpoint(requireAntiforgeryCheck: false);
});
```

On MVC controllers and actions you can set the *RequireAntiForgeryCheck* as a flag in the *BffApiAttribute*, like this:

```csharp
[Route("sample")]
// WARNING: Disabling antiforgery protection may make
// your APIs vulnerable to CSRF attacks
[BffApi(requireAntiForgeryCheck: false)]
public class SampleApiController : ControllerBase
{ /* ... */ }
```


In *version 2.x*, use the *SkipAntiforgery* fluent API when adding the endpoint. For example:

```csharp
app.UseEndpoints(endpoints =>
{
    // MVC controllers
    endpoints.MapControllers()
        .RequireAuthorization()
        .AsBffApiEndpoint()
        // WARNING: Disabling antiforgery protection may make
        // your APIs vulnerable to CSRF attacks
        .SkipAntiforgery();

    // simple endpoint
    endpoints.MapPost("/foo", context => { /* ... */ })
        .RequireAuthorization()
        .AsBffApiEndpoint()
        // WARNING: Disabling antiforgery protection may make
        // your APIs vulnerable to CSRF attacks
        .SkipAntiforgery();
});
```

MVC controllers and actions can use the *BffApiSkipAntiforgeryAttribute* (which is independent of the *BffApiAttribute*), like this:

```csharp
[Route("sample")]
// WARNING: Disabling antiforgery protection may make
// your APIs vulnerable to CSRF attacks
[BffApiSkipAntiforgeryAttribute]
public class SampleApiController : ControllerBase
{ /* ... */ }
```







