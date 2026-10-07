---
title: "YARP extensions"
description: Integration of Duende.BFF with Microsoft's YARP reverse proxy, including token management, anti-forgery protection, and cookie header removal.
sidebar:
  order: 30
redirect_from:
  - /bff/v2/apis/yarp/
  - /bff/v3/fundamentals/apis/yarp/
  - /bff/fundamentals/yarp
  - /identityserver/v5/bff/apis/yarp/
  - /identityserver/v6/bff/apis/yarp/
  - /identityserver/v7/bff/apis/yarp/
---

Duende.BFF integrates with Microsoft's full-featured reverse proxy [YARP](https://microsoft.github.io/reverse-proxy/).

YARP includes many advanced features such as load balancing, service discovery, and session affinity. It also has its
own extensibility mechanism. Duende.BFF includes YARP extensions for token management and anti-forgery protection so
that you can combine the security and identity features of `Duende.BFF` with the flexible reverse proxy features of
YARP.

## Adding YARP

To enable Duende.BFF's YARP integration, add a reference to the *Duende.BFF.Yarp* NuGet package to your project and add
YARP and the BFF's YARP extensions to DI:

```csharp
builder.Services.AddBff();

// adds YARP with BFF extensions
var yarpBuilder = services.AddReverseProxy()
    .AddBffExtensions();
```

## Configuring YARP

YARP is most commonly configured by a config file. The following simple example forwards a local URL to a remote API:

```json
{
  "ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}"
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "destination1": {
            "Address": "https://API.mycompany.com/todos"
          }
        }
      }
    }
  }
}
```

See the Microsoft [documentation](https://microsoft.github.io/reverse-proxy/articles/config-files.html) for the complete
configuration schema.

Another option is to configure YARP in code using the in-memory config provider included in the BFF extensions for YARP.
The above configuration as code would look like this:

```csharp
yarpBuilder.LoadFromMemory(
    new[]
    {
        new RouteConfig()
        {
            RouteId = "todos",
            ClusterId = "cluster1",

            Match = new()
            {
                Path = "/todos/{**catch-all}"
            }
        }
    },
    new[]
    {
        new ClusterConfig
        {
            ClusterId = "cluster1",

            Destinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase)
            {
                { 
                    "destination1", new() 
                    { 
                        Address = "https://API.mycompany.com/todos" 
                    } 
                },
            }
        }
    });
```

## Token Management

Duende.BFF's YARP extensions provide access token management and attach user or client access tokens automatically to
proxied API calls. To enable this, add metadata with the name *Duende.Bff.Yarp.TokenType* to the route or cluster
configuration:

```json
{
  "ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}"
        },
        "Metadata": {
          "Duende.Bff.Yarp.TokenType": "User"
        }
      }
    }
  }
}
```

Similarly to the [simple HTTP forwarder](/bff/fundamentals/apis/remote.mdx#access-token-requirements), the allowed values
for the token type are `None`, `User`, `Client`, `UserOrClient`, and `UserOrNone`.

Routes that set the `Duende.Bff.Yarp.TokenType` metadata **require** the given type of access token. If it is
unavailable (for example, if the `User` token type is specified but the request to the BFF is anonymous), then the
proxied request will not be sent, and the BFF will return an HTTP 401: Unauthorized response.

If you are using the code config method, call the `WithAccessToken` extension method to achieve the same thing:

```csharp
yarpBuilder.LoadFromMemory(
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
        }.WithAccessToken(RequiredTokenType.User)
    },
    // rest omitted
);
```

Again, the `WithAccessToken` method causes the route to require the given type of access token. If it is unavailable,
the proxied request will not be made and the BFF will return an HTTP 401: Unauthorized response.

## Optional User Access Tokens

You can attach user access tokens optionally using the `UserOrNone` token type. This causes the user's access token to
be sent with the proxied request when the user is logged in, but makes the request anonymously when the user is not
logged in.

In configuration, set the `Duende.Bff.Yarp.TokenType` metadata to `UserOrNone`:

```json
{
  "ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}"
        },
        "Metadata": {
          "Duende.Bff.Yarp.TokenType": "UserOrNone"
        }
      }
    }
  }
}
```

If you are using the code config method, call the `WithAccessToken` extension method with `RequiredTokenType.UserOrNone`:

```csharp
yarpBuilder.LoadFromMemory(
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
        }.WithAccessToken(RequiredTokenType.UserOrNone)
    },
    // rest omitted
);
```

### Anti-forgery Protection

Duende.BFF's YARP extensions can also add anti-forgery protection to proxied API calls. Anti-forgery protection defends
against CSRF attacks by requiring a custom header on API endpoints, for example:

```
GET /endpoint

x-csrf: 1
```

The value of the header is not important, but its presence, combined with the cookie requirement, triggers a CORS
preflight request for cross-origin calls. This effectively isolates the caller to the same origin as the backend,
providing a robust security guarantee.

You can add the anti-forgery protection to all YARP routes by calling the `AsBffApiEndpoint` extension method:

```csharp
app.MapReverseProxy()
    .AsBffApiEndpoint();

// or shorter
app.MapBffReverseProxy();
```

If you need more fine-grained control over which routes should enforce the anti-forgery header, you can also annotate
the route configuration by adding the `Duende.Bff.Yarp.AntiforgeryCheck` metadata to the route config:

```json
{
  "ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}"
        },
        "Metadata": {
          "Duende.Bff.Yarp.AntiforgeryCheck": "true"
        }
      }
    }
  }
}
```

This is also possible in code:

```csharp
yarpBuilder.LoadFromMemory(
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
        }.WithAntiforgeryCheck()
    },
    // rest omitted
);
```

:::note
You can combine the token management feature with the anti-forgery check.
:::

To enforce the presence of the anti-forgery headers, you need to add a middleware to the YARP pipeline:

```csharp
// Program.cs
app.MapReverseProxy(proxyApp =>
{
    proxyApp.UseAntiforgeryCheck();
});
```

## Cookie Header Removal

The BFF removes the `Cookie` request header from every request it proxies through YARP. This applies to all routes,
with or without token metadata, whether you configure YARP with `AddYarpConfig` (4.x) or with
`AddReverseProxy().AddBffExtensions()`.

The browser sends the BFF session cookie with every request to the BFF. A remote API should authenticate the call with
an access token, which the BFF attaches on routes with token metadata, not with the browser's cookies. Forwarding the
session cookie would hand the user's BFF session to the remote API, and to anything that logs or inspects its traffic,
which could then use the cookie to call the BFF as that user. The [direct HTTP forwarder](/bff/fundamentals/apis/remote.mdx) (`MapRemoteBffApiEndpoint`) has always
removed the header, and YARP routes now behave the same way.

:::note[Changed in 2.2.1, 2.3.1, 3.0.1, 3.1.1, 4.0.4, 4.1.3, 4.2.1, and 4.3.1]
Earlier versions forwarded the inbound `Cookie` header unchanged to the remote API on YARP routes. If one of your
remote APIs relied on receiving cookies through YARP, it no longer receives them after you upgrade. See
[forwarding cookies](#forwarding-cookies) to restore the old behavior.
:::

### Forwarding Cookies

If your remote APIs need the browser's cookies, turn off the removal with the
[`RemoveCookieHeaderFromYarpRequests`](/bff/fundamentals/options.md#apis) option:

```csharp
// Program.cs
builder.Services.AddBff(options =>
{
    // WARNING: forwards the browser's cookies, including the
    // BFF session cookie, to every API proxied through YARP
    options.RemoveCookieHeaderFromYarpRequests = false;
});
```

This setting applies to every YARP route. Once you turn it off, use standard YARP transforms to remove the header on
each route that doesn't need cookies. In configuration, add a `RequestHeaderRemove` transform to the route:

```json
{
  "ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}"
        },
        "Metadata": {
          "Duende.Bff.Yarp.TokenType": "User"
        },
        "Transforms": [
          { "RequestHeaderRemove": "Cookie" }
        ]
      }
    }
  }
}
```

In code, call YARP's `WithTransformRequestHeaderRemove` extension method on the route:

```csharp
yarpBuilder.LoadFromMemory(
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
        }.WithAccessToken(RequiredTokenType.User)
         .WithTransformRequestHeaderRemove("Cookie")
    },
    // rest omitted
);
```

### Transform Order

The BFF removes the `Cookie` header after YARP copies the request headers and after the transforms configured on the
route have run. While removal is on, a route transform that sets a `Cookie` header has no effect.

Transforms and transform providers that you register after calling `AddBffExtensions`, for example with
`.AddTransforms(...)` on the `IReverseProxyBuilder` that `AddBffExtensions` or `AddYarpConfig` returns, run later. They
can still set a `Cookie` header on the outgoing request. This is intentional, so you can send a specific cookie to a
specific API. Make sure transforms like these don't copy the browser's cookies back onto the request.

## Custom Access Token Retriever

You can specify a custom [`IAccessTokenRetriever`](/bff/extensibility/tokens.md#per-route-customized-token-retrieval) on
YARP routes and clusters. This allows you to customize how access tokens are obtained for proxied requests — for
example, to perform token exchange for delegation or impersonation scenarios.

### Code Configuration

A custom retriever can be set at the **route level** or the **cluster level**. Route-level retrievers take precedence
over cluster-level retrievers.

Use the `WithAccessTokenRetriever<T>()` extension method on a `RouteConfig`:

```csharp
// Route-level retriever
new RouteConfig()
{
    RouteId = "impersonation",
    ClusterId = "cluster1",

    Match = new RouteMatch
    {
        Path = "/api/impersonation/{**catch-all}"
    }
}.WithAccessToken(RequiredTokenType.User)
 .WithAccessTokenRetriever<ImpersonationAccessTokenRetriever>()
 .WithAntiforgeryCheck()
```

Or `ClusterConfig`:

```csharp
// Cluster-level retriever (applies to all routes using this cluster)
new ClusterConfig()
{
    ClusterId = "cluster-with-impersonation",
    Destinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase)
    {
        { "destination1", new() { Address = "https://api.example.com" } },
    }
}.WithAccessTokenRetriever<ImpersonationAccessTokenRetriever>()
```

### JSON Configuration

Use the `Duende.Bff.Yarp.AccessTokenRetriever` metadata key with an assembly-qualified type name:

```json
{
  "ReverseProxy": {
    "Routes": {
      "impersonation": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/api/impersonation/{**catch-all}"
        },
        "Metadata": {
          "Duende.Bff.Yarp.TokenType": "User",
          "Duende.Bff.Yarp.AntiforgeryCheck": "true",
          "Duende.Bff.Yarp.AccessTokenRetriever": "MyApp.ImpersonationAccessTokenRetriever, MyApp"
        }
      }
    },
    "Clusters": {
      "cluster-with-impersonation": {
        "Destinations": {
          "destination1": {
            "Address": "https://api.example.com"
          }
        },
        "Metadata": {
          "Duende.Bff.Yarp.AccessTokenRetriever": "MyApp.ImpersonationAccessTokenRetriever, MyApp"
        }
      }
    }
  }
}
```

### Precedence

When a retriever is specified on both the route and the cluster, the **route-level retriever takes precedence**. This
allows you to set a default retriever on a cluster and override it for specific routes.

:::note
The custom retriever type must implement `IAccessTokenRetriever` and be registered in the service collection.
:::