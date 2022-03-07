---
title: "YARP extensions"
weight: 30
---

Instead of using the simple HTTP forwarder, you can also use a more feature complete reverse proxy - e.g. Microsoft [YARP](https://microsoft.github.io/reverse-proxy/).

YARP has built-in advanced features, e.g. load balancing, service discovery, session affinity etc. It also has its own extensibility mechanism. The BFF library includes a set of YARP extensions (e.g. token management and anti-forgery protection) so you can get the best of both worlds.

#### Adding YARP
To enable our YARP integration, add a reference to the *Duende.BFF.Yarp* Nuget package and add the YARP and our service to DI:

```cs
services.AddBff();

// adds YARP with BFF extensions
var builder = services.AddReverseProxy()
    .AddBffExtensions();
```

#### Configuring YARP
YARP is most commonly configured via a config file. The following simple snippet forwards a local URL to a remote API:

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

Another option is to configure YARP in code (using [this](https://github.com/microsoft/reverse-proxy/tree/main/samples/ReverseProxy.Code.Sample) sample). The above configuration as code would look like this:

```cs
builder.LoadFromMemory(
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

### Token management
Using the BFF extensions, you can benefit from the built-in token management, and attach user or client access tokens automatically to proxied API calls. This is done by adding metadata with the name *Duende.Bff.Yarp.TokenType* to the route or cluster configuration:

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

{{% notice note %}}
The allowed values for the token type are *User*, *Client*, *UserOrClient*
{{% /notice %}}

If you are using the code config method, the *WithAccessToken* extension method achieves the same:

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
        }.WithAccessToken(TokenType.User)
    },
    // rest omitted
    });
```


### Anti-forgery protection
Just like with local APIs, you can also add additional anti-forgery protection to proxied API calls.

You can either add the anti-forgery protection to all YARP routes by adding the *AsBffApiEndpoint* extension:

```cs
endpoints.MapReverseProxy()
    .AsBffApiEndpoint();

// or shorter
endpoints.MapBffReverseProxy();
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
        }.WithAntiforgeryCheck()
    },
    // rest omitted
    });
```

To enforce the presence of the anti-forgery headers, you need to add a middleware to the YARP pipeline:

```cs
endpoints.MapReverseProxy(proxyApp =>
{
    proxyApp.UseAntiforgeryCheck();
});
```