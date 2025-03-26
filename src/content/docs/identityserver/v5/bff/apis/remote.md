---
title: "Remote APIs"
weight: 20
---

For invoking APIs that are deployed on different servers, you have a couple of options:

* create local API endpoints that call those remote APIs
* use our built-in simplified HTTP forwarder
* use a fully fledged reverse proxy to transparently forward the local API calls to the remote APIs

### Manual API endpoints
If you want to expose a frontend specific subset of your remote APIs or want to aggregate multiple remote APIs, it is a common practice to create local API endpoints that in turn call the remote APIs and present the data in a frontend specific way.

You can use a MVC controller for this, and leverage services like the HTTP client factory and the Duende.BFF [token management](/identityserver/v5/bff/tokens) to make the outgoing calls. The following is a very simplified version of that:

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

### Use our built-in simple HTTP forwarder
Our HTTP forwarder is useful when you realize that you are re-creating large parts of an already existing API surface in your BFF for forwarding. In this case you might decide to automate the process.

Duende.BFF uses [Microsoft YARP](https://github.com/microsoft/reverse-proxy) internally to give you a developer centric and simplified way to forward certain routes in your BFF to remote APIs. These routes have the same anti-forgery protection as local API endpoints, and also integrate with the automatic token management.

To enable that feature, you need add a reference to the *Duende.BFF.Yarp* Nuget package and add the service to DI:

```cs
services.AddBff()
    .AddRemoteApis();
```

The following snippet routes a local */api/customers* endpoint to a remote API, and forwards the user's access token in the outgoing call:

```cs
app.UseEndpoints(endpoints =>
{
    endpoints.MapRemoteBffApiEndpoint(
            "/api/customers", "https://remoteHost/customers")
        .RequireAccessToken(TokenType.User);
});
```

:::note
Be aware that above example is opening up the complete */customers* API namespace to the frontend and thus to the outside world. Try to be as specific as possible when designing the forwarding paths.
:::

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

You can also use the *WithOptionalUserAccessToken* extension to specify that the API should be called with a user access token (if present), otherwise anonymously.

:::note
These settings only specify the logic that is applied before the API call gets proxied. The remote APIs you are calling should always specify their own authorization and token requirements.
:::

### Use a fully fledged Reverse Proxy
Instead of using simplified forwarder, you can also use a more feature complete reverse proxy - e.g. Microsoft YARP.

YARP has built-in features that you might need, e.g. load balancing, service discovery, session affinity etc. So instead of us wrapping YARP internally, you can also use YARP directly and add our services like anti-forgery protection and token management on top.

#### Adding YARP
To enable our YARP integration, add a reference to the *Duende.BFF.Yarp* Nuget package and add the YARP and our service to DI:

```cs
services.AddBff();

var builder = services.AddReverseProxy()
    .AddTransforms<AccessTokenTransformProvider>();
```

#### Configuring YARP
You can use many ways to configure YARP - most commonly via a config file or code. The following shows a simple code snippet using the in-memory configuration provider:

```cs
builder.LoadFromMemory(
    new[]
    {
        new RouteConfig()
        {
            RouteId = "todos",
            ClusterId = "cluster1",

            Match = new RouteMatch
            {
                Path = "/todos/{**catch-all}"
            }
        }.WithAccessToken(TokenType.User),
    },
    new[]
    {
        new ClusterConfig
        {
            ClusterId = "cluster1",

            Destinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase)
            {
                { "destination1", new DestinationConfig() { Address = "https://api.mycompany.com/todos" } },
            }
        }
    });
```

The *WithAccessToken* extension method adds an entry to YARP's metadata dictionary that instructs our plumbing to forward the current user access token for the route.

You can achieve the same in configuration with the following:

```json
"ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}",
        },
        "Metadata": { 
            "Duende.Bff.Yarp.TokenType": "User"
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "destination1": {
            "Address": "https://api.mycompany.com/todos"
          }
        }
      }
    }
}
```

:::note
The allowed values for the token type are *User*, *Client*, *UserOrClient*
:::

#### Adding the YARP endpoint
Last but not least, you need to add the YARP endpoint to the routing table:

```cs
endpoints.MapBffReverseProxy();
                
// which is equivalent to
//endpoints.MapReverseProxy()
//    .AsBffApiEndpoint();
```
