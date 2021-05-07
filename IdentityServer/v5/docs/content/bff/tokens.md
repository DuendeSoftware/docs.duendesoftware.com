---
title: "Token Management"
date: 2020-09-10T08:22:12+02:00
weight: 50
---

Duende.BFF includes an automatic token management feature. This uses the access and refresh token stored in the authentication session to always provide a current access token for outgoing API calls.

For most scenarios, there is no additional configuration necessary. The token management will infer the configuration and token endpoint URL from the metadata of the OpenID Connect provider.

The easiest way to retrieve the current access token is to use an extension method on *HttpContext*:

```cs
    var token = await HttpContext.GetUserAccessTokenAsync();
```

You can then use the token to set it on an *HttpClient* instance:

```cs
    var client = new HttpClient();
    client.SetBearerToken(token);
```

We recommend to leverage the *HttpClientFactory* to fabricate HTTP clients that are already aware of the token management plumbing. For this you would register a named client in your *startup* e.g. like this:

```cs
// registers HTTP client that uses the managed user access token
services.AddUserAccessTokenClient("apiClient", configureClient: client =>
{
    client.BaseAddress = new Uri("https://remoteServer/");
});
```

..and then retrieve a client instance like this:

```cs
[Route("myApi")]
public class MyApiController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public MyController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }
    
    public async Task<IActionResult> Get(string id)
    {
        // create HTTP client with automatic token management
        var client = _httpClientFactory.CreateClient("apiClient");
        
        // call remote API
        var response = await client.GetAsync("remoteApi");

        // rest omitted
    }
}
```

If you prefer to use typed clients, you can do that as well:

```cs
// registers a typed HTTP client with token management support
services.AddHttpClient<MyTypedApiClient>(client =>
{
    client.BaseAddress = new Uri("https://remoteServer/");
})
    .AddUserAccessTokenHandler();
```

..and then use that client e.g. like this on a controller:

```cs
public async Task<IActionResult> CallApiAsUserTyped(
    [FromServices] MyTypedClient client)
{
    var response = await client.GetData();
    
    // rest omitted
}
```

The client will internally always try to use a current and valid access token. If for any reason, this is not possible, the 401 status code will be returned to the caller. 