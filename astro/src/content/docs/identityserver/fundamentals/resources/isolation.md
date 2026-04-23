---
title: "Resource Isolation"
description: Learn about isolating OAuth resources and using the resource parameter to control access token scope and audience
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 40
redirect_from:
  - /identityserver/v5/fundamentals/resources/isolation/
  - /identityserver/v6/fundamentals/resources/isolation/
  - /identityserver/v7/fundamentals/resources/isolation/
---

:::note
This feature is part of the [Duende IdentityServer Enterprise Edition](https://duendesoftware.com/products/identityserver).
:::

OAuth itself only knows about scopes - the (API) resource concept does not exist from a pure protocol point of view.
This means that all the requested scope and audience combinations get merged into a single access token.

This has a couple of downsides:

* Tokens can become very powerful (and large)
  * If such a token leaks, it allows access to multiple resources
* Resources within that single token might have conflicting settings, e.g.
  * User claims of all resources share the same token
  * Resource-specific processing like signing or encryption algorithms conflict
* Without sender-constraints, a resource could potentially re-use (or abuse) a token to call another contained resource directly

### Audience Ambiguity

In a system with multiple APIs (e.g., Shipping, Invoicing and Inventory APIs), a single token often lists all of them as valid audiences.

```json
{
  "iss": "https://demo.duendesoftware.com",
  "aud": ["invoice_api", "shipping_api", "inventory_api"],
  "scope": ["invoice.read", "shipping.write", "inventory.read"]
}
```

This violates the Principle of Least Privilege. If this token is leaked from the Inventory API, it can be used to call the Invoice API.

To solve this problem [RFC 8707](https://tools.ietf.org/html/rfc8707) adds another request parameter for the authorize and token endpoint called `resource`.
This allows requesting a token for a specific resource (in other words - making sure the audience claim has a single
value only, and all scopes belong to that single resource).

## Using The Resource Parameter

Let's assume you have the following resource design and that the client is allowed access to all scopes:

```csharp title="ApiResources.cs"
var resources = new[]
{
    new ApiResource("urn:invoices")
    {
        Scopes = { "read", "write" }
    },

    new ApiResource("urn:products")
    {
        Scopes = { "read", "write" }
    }
};
```

If the client would request a token for the `read` scope, the resulting access token would contain the audience of both
the invoice and the products API and thus be accepted at both APIs.

### Machine to Machine Scenarios

If the client in addition passes the `resource` parameter specifying the name of the resource where it wants to use
the access token, the token engine can `down-scope` the resulting access token to the single resource, e.g.:

```text
POST /token

grant_type=client_credentials&
client_id=client&
client_secret=...&

scope=read&
resource=urn:invoices
```

Thus resulting in an access token like this (some details omitted):

```json
{
  "aud": ["urn:invoice"],
  "scope": "read",
  "client_id": "client"
}
```

### Interactive Applications

The authorize endpoint supports the `resource` parameter as well, e.g.:

```text
GET /authorize?client_id=client&response_type=code&scope=read&resource=urn:invoices
```

Once the front-channel operations are done, the resulting code can be redeemed by passing the resource name on the token endpoint:

```text
POST /token

grant_type=authorization_code&
client_id=client&
client_secret=...&
authorization_code=...&
redirect_uri=...&

resource=urn:invoices
```

### Requesting Access To Multiple Resources

It is also possible to request access to multiple resources. This will result in multiple access tokens - one for each request resource.

```text
GET /authorize?client_id=client&response_type=code&scope=read offline_access&resource=urn:invoices&resource=urn:products
```

When you redeem the code, you need to specify for which resource you want to have an access token, e.g.:

```text
POST /token

grant_type=authorization_code&
client_id=client&
client_secret=...&
authorization_code=...&
redirect_uri=...&

resource=urn:invoices
```

This will return an access token for the invoices API and a refresh token. If you want to also retrieve the access token
for the products API, you use the refresh token and make another roundtrip to the token endpoint.

```text
POST /token

grant_type=refresh_token&
client_id=client&
client_secret=...&
refresh_token=...&

resource=urn:products
```

The end-result will be that the client has two access tokens - one for each resource and can manage their lifetime via the refresh token.

## Enforcing Resource Isolation

All examples so far used the `resource` parameter optionally. If you have API resources, where you want to make sure
they are not sharing access tokens with other resources, you can enforce the resource indicator, e.g.:

```csharp title="ApiResources.cs" {6,12}
var resources = new[]
{
    new ApiResource("urn:invoices")
    {
        Scopes = { "read", "write" },
        RequireResourceIndicator = true
    },

    new ApiResource("urn:products")
    {
        Scopes = { "read", "write" },
        RequireResourceIndicator = true
    }
};
```

The `RequireResourceIndicator` property **does not** mean that clients are forced to send the `resource` parameter when
they request scopes associated with the API resource. You can still request those scopes without setting the `resource`
parameter (or including the resource), and IdentityServer will issue a token as long as the client is allowed to request
the scopes.

Instead, `RequireResourceIndicator` controls **when** the resource's URI is included in the **audience claim** (`aud`)
of the issued access token.

* When `RequireResourceIndicator` is `false` (the default):
  IdentityServer **automatically includes** the API's resource URI in the token's audience if any of the resource's scopes
  are requested, even if the `resource` parameter was not sent in the request or didn't contain the resource URI.
* When `RequireResourceIndicator` is `true`:
  The API's resource URI will **only** be included in the audience **if the client explicitly includes the resource URI**
  via the `resource` parameter when requesting the token.

## .NET Client Implementation

While the examples above show the underlying HTTP protocol, .NET clients can use the Duende libraries to handle resource indicators easily.

### Machine-to-Machine (Worker)

When using `Duende.IdentityModel` for client credentials, you can pass the `resource` parameter using the `Parameters` dictionary:

```csharp
using Duende.IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",
    ClientId = "invoice_worker",
    ClientSecret = "secret",

    // The scope defines the permission
    Scope = "invoice.read",

    // The parameter defines the target (RFC 8707)
    Resource = [ "urn:invoices" ]
});
```

### ASP.NET Core

For interactive applications using the standard OpenID Connect handler, use the `Resource` property on `OpenIdConnectOptions`:

```csharp
.AddOpenIdConnect(options =>
{
    options.Authority = "https://demo.duendesoftware.com";
    options.ClientId = "interactive_app";

    options.Scope.Add("invoice.read");

    // Explicitly set the target resource here
    options.Resource = "urn:invoices";

    options.ResponseType = "code";
    options.SaveTokens = true;
});
```

Note that while the RFC allows multiple `resource` parameters, the Microsoft OpenID Connect handler only supports a single resource value here.

For dynamic scenarios (e.g. multi-tenant), you can set the resource parameter in the `OnRedirectToIdentityProvider` event:

```csharp
options.Events.OnRedirectToIdentityProvider = context =>
{
    var tenantSpecificResource = DetermineResource(context);

    // Overwrite or set the 'resource' parameter
    context.ProtocolMessage.SetParameter("resource", tenantSpecificResource);

    return Task.CompletedTask;
};
```

## More Examples to Understand Resource Isolation

Imagine a set of services with separate APIs for handling orders and tracking inventory, an Orders API and Inventory API. Each has their own distinct set of API scopes, plus a set of scopes shared between the APIs. In addition, there's a global scope used by legacy systems that haven't been updated yet to use Resource Isolation. The set of scopes used by each application are:

| urn:orders   | urn:inventory   | Not Shared with any API Resource |
|--------------|-----------------|----------------------------------|
| orders.read  | inventory.read  | global.audit                     |
| orders.write | inventory.write |                                  |
| shared.read  | shared.read     |                                  |

The below code creates in-memory scopes, API resources, and a single client (which knows about the aforementioned resources) inside a Duende IdentityServer application. Notice that all scopes are created in a single `Scopes` collection, then the `Resources` collection groups the scopes per `ApiResource`. Finally, the `Client` includes all scopes in its `AllowedScopes` property because the client will be requesting any combination of those scopes from Duende IdentityServer. The only grouping happening is when the `ApiResource` objects link an API resource to a scope.

```csharp
// Config.cs
// All scopes used by all API Resources and Clients
public static readonly IEnumerable<ApiScope> Scopes = [
    // resource specific scopes
    new ApiScope("orders.read"), new ApiScope("orders.write"),
    new ApiScope("inventory.read"), new ApiScope("inventory.write"),
    
    // a scope shared by multiple resources
    new ApiScope("shared.read"),
    
    // scopes without resource association
    new ApiScope("global.audit"),
];

// API resources with the scopes they use
public static readonly IEnumerable<ApiResource> Resources = [
    new ApiResource("urn:orders", "Orders API") 
        { Scopes = { "orders.read", "orders.write", "shared.read" } },
    new ApiResource("urn:inventory", "Inventory API") {
        Scopes = { "inventory.read", "inventory.write", "shared.read" },
        RequireResourceIndicator = true
    } ];

public static readonly IEnumerable<Client> Clients = [
    new Client {
        ClientId = "resource.isolation.demo.client",
        ClientSecrets = { new Secret("my-secret".Sha256()) },
        ClientClaimsPrefix = "",
        AllowedGrantTypes = GrantTypes.ClientCredentials,

        // Client is allowed to access all scopes for all ApiResources
        AllowedScopes =
        {
            "orders.read", "orders.write",
            "inventory.read", "inventory.write",
            "shared.read",
            "global.audit",
        }
    }
];
```

When requesting an `ApiResource`, IdentityServer will create a token with scopes filtered to what is supported by that `ApiResource`. Scopes are not owned by any individual `ApiResource`, and are global across your applications because internally they're an arbitrary string. An `ApiResource` doesn't "own" scopes, it is allowed access to those scopes.

The table below shows the resulting **audience claim** (`aud`) when making requests for a token with a specific scope/resource combination.

| Scopes                   | Resource Api  | Result **audience claim** (`aud`)  |
|--------------------------|---------------|---------------|
| orders.read              | null          | urn:orders    |
| inventory.read           | null          | NOT SET       |
| inventory.read           | urn:inventory | urn:inventory |
| orders.read global.audit | null          | urn:orders    |
| shared.read              | null          | urn:orders    |
| orders.read shared.read  | null          | urn:orders    |

### Experimenting with Resource Isolation

The below code is 2 C# File Based Apps. The first is a Duende IdentityServer with the Scopes, Resources, and Clients described above. The second app is a console client that makes requests to Duende IdentityServer with different combinations of scopes and resources. To help understand how resource isolation works, feel free to run the two apps locally. Make modifications as you see fit to experiment.

```csharp {30, 43, 51}
//IdentityServer.cs
#:sdk Microsoft.Net.Sdk.Web
#:property PublishAot=false
#:package Duende.IdentityServer@8.0.0-alpha.1

using Duende.IdentityServer.Models;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("https://localhost:5001");

_ = builder.Services.AddIdentityServer(options =>
{
    // emits static audience if required
    options.EmitStaticAudienceClaim = false;

    // control format of scope claim
    options.EmitScopesAsSpaceDelimitedStringInJwt = true;
})
.AddInMemoryApiScopes(InMemoryConfig.Scopes)
.AddInMemoryApiResources(InMemoryConfig.Resources)
.AddInMemoryClients(InMemoryConfig.Clients);

var app = builder.Build();
app.UseIdentityServer();
app.Run();

public static class InMemoryConfig
{
    //All scopes used by all API Resources and Clients
    public static readonly IEnumerable<ApiScope> Scopes = [
        // resource specific scopes
        new ApiScope("orders.read"), new ApiScope("orders.write"),
        new ApiScope("inventory.read"), new ApiScope("inventory.write"),
        
        // a scope shared by multiple resources
        new ApiScope("shared.read"),
        
        // scopes without resource association
        new ApiScope("global.audit"),
    ];

    // API resources with the scopes they use
    public static readonly IEnumerable<ApiResource> Resources = [
        new ApiResource("urn:orders", "Orders API") 
            { Scopes = { "orders.read", "orders.write", "shared.read" } },
        new ApiResource("urn:inventory", "Inventory API") {
            Scopes = { "inventory.read", "inventory.write", "shared.read" },
            RequireResourceIndicator = true
        }, ];

    public static readonly IEnumerable<Client> Clients = [
        new Client {
            ClientId = "resource.isolation.demo.client",
            ClientSecrets = { new Secret("my-secret".Sha256()) },
            ClientClaimsPrefix = "",
            AllowedGrantTypes = GrantTypes.ClientCredentials,

            //Client is allowed to access all scopes for all ApiResources
            AllowedScopes =
            {
                "orders.read", "orders.write",
                "inventory.read", "inventory.write",
                "shared.read",
                "global.audit",
            }
        }
    ];
}
```

```csharp
//ResourceIsolationClient.cs
#:property PublishAot=false

//Choose your access package library
// #:package Duende.IdentityModel@8.1.0
#:package Duende.AccessTokenManagement@4.2.0

using System.Buffers.Text;
using System.Text;
using System.Text.Json;
using Duende.IdentityModel.Client;

var cache = new DiscoveryCache("https://localhost:5001");

Console.WriteLine("Access Token for scope `orders.read`");
await RequestToken(cache, scope: "orders.read", resource: null);

Console.WriteLine();
Console.WriteLine("Access Token for scope `inventory.read`");
await RequestToken(cache, scope: "inventory.read", resource: null);

Console.WriteLine();
Console.WriteLine("Access Token for scope `inventory.read`");
await RequestToken(cache, scope: "inventory.read", resource: "urn:inventory");

Console.WriteLine();
Console.WriteLine("Access Token for scopes `orders.read global.audit`");
await RequestToken(cache, scope: "orders.read global.audit", resource: null);

Console.WriteLine();
Console.WriteLine("Access Token for scope `shared.read`");
await RequestToken(cache, scope: "shared.read", resource: null);

Console.WriteLine();
Console.WriteLine("Access Token for scopes `orders.read and shared.read`");
await RequestToken(cache, scope: "orders.read shared.read", resource: null);

static async Task RequestToken(DiscoveryCache cache, string scope, string? resource)
{
    var client = new HttpClient();
    var disco = await cache.GetAsync();

    var request = new ClientCredentialsTokenRequest
    {
        Address = disco.TokenEndpoint,
        ClientId = "resource.isolation.demo.client",
        ClientSecret = "my-secret",
        Scope = scope,
    };

    if (!string.IsNullOrEmpty(resource))
    {
        request.Resource.Add(resource);
    }

    var response = await client.RequestClientCredentialsTokenAsync(request);
    Show(response);
}

static void Show(TokenResponse response)
{
    if (!response.IsError)
    {
        if (response.AccessToken?.Contains('.') is true)
        {
            var parts = response.AccessToken.Split('.');
            var claims = parts[1];
            var raw = Encoding.UTF8.GetString(Base64Url.DecodeFromChars(claims));
            var doc = JsonDocument.Parse(raw).RootElement;
            var json = JsonSerializer.Serialize(doc, new JsonSerializerOptions { WriteIndented = true });
            Console.WriteLine(json);
        }
        else
        {
            Console.WriteLine($"Token response: {response.Json}");
        }
    }
    else if (response.ErrorType == ResponseErrorType.Http)
    {
        Console.WriteLine($"HTTP error: {response.Error} with HTTP status code: {response.HttpStatusCode}");
    }
    else
    {
        Console.WriteLine($"Protocol error response: {response.Raw}");
    }
}
```
