---
title: "YARP extensions"
order: 30
newContentUrl: "https://docs.duendesoftware.com/bff/v3/fundamentals/apis/yarp/"
---

Duende.BFF integrates with Microsoft's full-featured reverse proxy [YARP](https://microsoft.github.io/reverse-proxy/).

YARP includes many advanced features such as load balancing, service discovery, and session affinity. It also has its own extensibility mechanism. Duende.BFF includes YARP extensions for token management and anti-forgery protection so that you can combine the security and identity features of Duende.BFF with the flexible reverse proxy features of YARP.

## Adding YARP
To enable Duende.BFF's YARP integration, add a reference to the *Duende.BFF.Yarp* Nuget package to your project and add YARP and the BFF's YARP extensions to DI:

```cs
builder.Services.AddBff();

// adds YARP with BFF extensions
var yarpBuilder = services.AddReverseProxy()
    .AddBffExtensions();
```

## Configuring YARP
YARP is most commonly configured by a config file. The following simple example forwards a local URL to a remote API:

```json
"ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}",
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

See the Microsoft [documentation](https://microsoft.github.io/reverse-proxy/articles/config-files.html) for the complete configuration schema.

Another option is to configure YARP in code using the in-memory config provider included in the BFF extensions for YARP. The above configuration as code would look like this:

```cs
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
                        Address = "https://api.mycompany.com/todos" 
                    } 
                },
            }
        }
    });
```

## Token management
Duende.BFF's YARP extensions provide access token management and attach user or client access tokens automatically to proxied API calls. To enable this, add metadata with the name *Duende.Bff.Yarp.TokenType* to the route or cluster configuration:

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
    // rest omitted
}
```

Similarly to the [simple HTTP forwarder](../apis/remote#access-token-requirements), the allowed values for the token type are *User*, *Client*, *UserOrClient*. 

Routes that set the *Duende.Bff.Yarp.TokenType* metadata **require** the given type of access token. If it is unavailable (for example, if the *User* token type is specified but the request to the BFF is anonymous), then the proxied request will not be sent, and the BFF will return an HTTP 401: Unauthorized response.

If you are using the code config method, call the *WithAccessToken* extension method to achieve the same thing:

```cs
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
        }.WithAccessToken(TokenType.User)
    },
    // rest omitted
);
```

Again, the *WithAccessToken* method causes the route to require the given type of access token. If it is unavailable, the proxied request will not be made and the BFF will return an HTTP 401: Unauthorized response.

## Optional User Access Tokens
You can also attach user access tokens optionally by adding metadata named "Duende.Bff.Yarp.OptionalUserToken" to a YARP route.

```json
"ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}",
        },
        "Metadata": { 
            "Duende.Bff.Yarp.OptionalUserToken": "true"
        }
      }
    },
    // rest omitted
}
```

This metadata causes the user's access token to be sent with the proxied request when the user is logged in, but makes the request anonymously when the user is not logged in. It is an error to set both *Duende.Bff.Yarp.TokenType* and *Duende.Bff.Yarp.OptionalUserToken*, since they have conflicting semantics (*TokenType* requires the token, *OptionalUserToken* makes it optional).

If you are using the code config method, call the *WithOptionalUserAccessToken* extension method to achieve the same thing:

```cs
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
        }.WithOptionalUserAccessToken()
    },
    // rest omitted
);
```

## Anti-forgery protection
Duende.BFF's YARP extensions can also add anti-forgery protection to proxied API calls. Anti-forgery protection defends against CSRF attacks by requiring a custom header on API endpoints, for example:

```
GET /endpoint

x-csrf: 1
```

The value of the header is not important, but its presence, combined with the cookie requirement, triggers a CORS preflight request for cross-origin calls. This effectively isolates the caller to the same origin as the backend, providing a robust security guarantee. 

You can add the anti-forgery protection to all YARP routes by calling the *AsBffApiEndpoint* extension method:

```cs
app.MapReverseProxy()
    .AsBffApiEndpoint();

// or shorter
app.MapBffReverseProxy();
```

If you need more fine grained control over which routes should enforce the anti-forgery header, you can also annotate the route configuration by adding the *Duende.Bff.Yarp.AntiforgeryCheck* metadata to the route config:

```json
"ReverseProxy": {
    "Routes": {
      "todos": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "/todos/{**catch-all}",
        },
        "Metadata": { 
            "Duende.Bff.Yarp.AntiforgeryCheck" : "true"
        }
      }
    },
    // rest omitted
}
```

This is also possible in code:

```cs
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

```cs
app.MapReverseProxy(proxyApp =>
{
    proxyApp.UseAntiforgeryCheck();
});
```