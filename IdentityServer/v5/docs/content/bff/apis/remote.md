---
title: "Remote APIs"
weight: 20
---

For invoking APIs that are deployed on different servers, you have a couple of options

* create local API endpoints that call those remote APIs
* use a reverse proxy to forward the local API calls to the remote APIs

### Manual API endpoints
If you want to expose a frontend specific subset of your remote APIs or want to aggregate multiple remote APIs, it is a common practice to create local API endpoints that in turn call the remote APIs and present the data in a frontend specific way.

You can use e.g. an MVC controller for this, and leverage services like the HTTP client factory and the Duende.BFF token management to make the outgoing calls. The following is a very simplified version of that:

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

### Use a reverse proxy
A reverse proxy approach is useful when you realize that you are re-creating large parts of an already existing API surface in your BFF for forwarding. In this case you might decide to automate the process.

Duende.BFF leverages Microsoft YARP internally, to give you a developer centric way to forward certain routes in your BFF to remote APIs. These routes have the same anti-forgery protection as local API endpoints, and also integrate with the automatic token management.

The following snippet routes a local */api/customers* endpoint to a remote API, and forwards the user's access token in the outgoing call:

```cs
app.UseEndpoints(endpoints =>
{
    endpoints.MapRemoteBffApiEndpoint(
            "/api/customers", "https://remoteHost/customers")
        .RequireAccessToken(TokenType.User);
});
```

{{% notice note %}}
Be aware that above example is opening up the complete */customers* API namespace to the frontend and thus to the outside world. Try to be as specific as possible when designing the forwarding parameters.
{{% /notice %}}

There are several ways to influence security parameters of such an endpoint:

**Require authorization**

The endpoint integrates with the ASP.NET Core authorization system and you can attach a **RequireAuthorization** extension to specify an authorization policy that must be fulfilled before being able to invoke the endpoint.

**Access token requirements**

You can specify access token requirements via the **RequireAccessToken** extension. The **TokenType** parameter has three options:

* ***User***

    A valid user access token is required and will be forwarded

* ***Client***

    A valid client access token is required and will be forwarded

* ***UserOrClient***

    Either a valid user access token or a valid client access token (as fallback) is required and will be forwarded

You can also use the *WithOptionalUserAccessToken* extension to specify that the API should be called with a user access token (if present), or anonymously.

{{% notice note %}}
These settings only specify the logic that is applied before the API call gets proxied. The remote APIs you are calling should always specify their own security and token requirements.
{{% /notice %}}