---
title: "Requesting a Token"
description: "Guide explaining how to request tokens for both machine-to-machine communication and interactive applications, including code examples for .NET implementations"
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Requesting
  order: 10
redirect_from:
  - /identityserver/v5/tokens/requesting/
  - /identityserver/v6/tokens/requesting/
  - /identityserver/v7/tokens/requesting/
---

A typical architecture is composed of two application (aka
client) [types](/identityserver/overview/terminology.md#client) - machine-to-machine calls and interactive applications.

## Machine-to-machine Communication

In this scenario a headless application with no interactive user (e.g. a server daemon, batch job etc.) wants to call an
API.

Prerequisites are:

* define a [client](/identityserver/fundamentals/clients.md) for the *client credentials* grant type
* define an [API scope](/identityserver/fundamentals/resources/api-scopes.md) (and optionally a resource)
* grant the client access to the scope via the [`AllowedScopes`](/identityserver/reference/models/client.md#basics)
  property

According to the OAuth [specification](https://tools.ietf.org/html/rfc6749#section-4.4), you request a token by posting
to the token endpoint:

```http request
POST /connect/token
CONTENT-TYPE application/x-www-form-urlencoded

    client_id=client1&
    client_secret=secret&
    grant_type=client_credentials&
    scope=scope1
```

In the success case, this will return a JSON response containing the access token:

```http request
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
    "access_token": "2YotnFZFEjr1zCsicMWpAA",
    "token_type": "bearer",
    "expires_in": 3600,
}
```

### .NET Client Library

In .NET you can use the [Duende IdentityModel](../../../identitymodel) client library
to [request](../../../identitymodel/endpoints/token) tokens.

The above token request would look like this in C#:

```csharp
// Program.cs
using Duende.IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",

    ClientId = "m2m",
    ClientSecret = "secret",
    Scope = "api"
});
```

### Automating Token Requests In ASP.NET Core And Worker Applications

The [Duende.AccessTokenManagement](/accesstokenmanagement) library can automate client credential request and token
lifetime management for you.
Using this library, you can enable access token management for an HTTP client provided by `IHttpClientFactory`.

You can add the necessary services to ASP.NET Core's service provider by calling
`AddClientCredentialsTokenManagement()`. One or more named client definitions need to be registered by calling
`AddClient()`.

```csharp
// Program.cs
builder.Services.AddClientCredentialsTokenManagement()
    .AddClient("client", client =>
    {
        client.TokenEndpoint = "https://demo.duendesoftware.com/connect/token";
        
        client.ClientId = "m2m";
        client.ClientSecret = "secret";
        client.Scope = "api";
    });
```

You can then register named HTTP clients with `IHttpClientFactory`. These named clients will automatically use the above
client definitions to request and use access tokens.

```csharp
// Program.cs
builder.Services.AddClientAccessTokenHttpClient("client", configureClient: client =>
{
    client.BaseAddress = new Uri("https://demo.duendesoftware.com/api/");
});
```

In your application code, you can then use the named HTTP client with automatic token management to call the API:

```csharp
// DataController.cs
public class DataController : Controller
{
    IHttpClientFactory _factory;

    public DataController(IHttpClientFactory factory)
    {
        _factory = factory;
    }

    public IActionResult Index()
    {
        var client = _factory.CreateClient("client");

        // rest omitted
    }
}
```

## Interactive Applications

In this scenario, an interactive application like a web application or mobile/desktop app wants to call an API in the
context of an authenticated user (see spec [here](https://openid.net/specs/openid-connect-core-1_0.html#codeflowauth)).

You will receive three tokens - an identity token containing details about the end-user authentication, the access token
to call the API, and a refresh token for access token lifetime management. The access token will also contain some
information about the end-user (e.g. the user ID), so that the API can do authorization based on the user's identity.

In this scenario you typically use the authorization code flow which first involves a call to the authorize endpoint for
all human interactions (e.g. login and/or consent). This returns a code, which you then redeem at the token endpoint to
retrieve identity and access tokens.

Prerequisites are:

* define a [client](/identityserver/fundamentals/clients.md) for the *authorization code* grant type
* define an [identity](/identityserver/fundamentals/resources/identity.md) resource, e.g. `openid`
* define an [API scope](/identityserver/fundamentals/resources/api-scopes.md) (and optionally a resource)
* grant the client access to both scopes via the [`AllowedScopes`](/identityserver/reference/models/client.md#basics)
  property

### Front-channel

The call to the authorize endpoint is done using a redirect in the browser:

```http request
GET /connect/authorize?
    client_id=client1&
    scope=openid api1&
    response_type=code&
    redirect_uri=https://myapp/callback&
```

On success, the browser will ultimately redirect to the callback endpoint transmitting the authorization code (and other
parameters like the granted scopes):

```http request
GET /callback?
    code=abc&
    scope=openid api1
```

### Back-channel

The client then opens a back-channel communication to the token service to retrieve the tokens:

```http request
POST /connect/token
CONTENT-TYPE application/x-www-form-urlencoded

    client_id=client1&
    client_secret=secret&
    grant_type=authorization_code&
    code=abc&
    redirect_uri=https://myapp/callback
```

In this scenario, the token response will contain three tokens:

```http request
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
    "id_token": "...",
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer",
    "expires_in": 3600,
}
```

:::note
See the refresh token section for more information on how to deal with [refresh tokens](/identityserver/tokens/refresh.md).
:::

### .NET Client Library

The most common client library for .NET is the OpenID
Connect [authentication](https://docs.microsoft.com/en-us/aspnet/core/security/authentication) handler for ASP.NET Core.
This library handles the complete front- and back-channel interaction and coordination.

You only need to configure it in your startup code:

```cs
// Program.cs
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "duende";
    })
    .AddCookie("cookie")
    .AddOpenIdConnect("duende", "IdentityServer", options =>
    {
        options.Authority = "https://demo.duendesoftware.com";
        options.ClientId = "interactive.confidential";

        options.ResponseType = "code";
        options.ResponseMode = "query";
        options.SaveTokens = true;

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("api");
        options.Scope.Add("offline_access");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "name",
            RoleClaimType = "role"
        };

        // Disable x-client-SKU and x-client-ver headers 
        options.DisableTelemetry = true;
    });
```

### Automating Token Management In ASP.NET Core

The [Duende.AccessTokenManagement](/accesstokenmanagement/index.mdx) library can also be used to automate token lifetime
management in ASP.NET Core applications for you.
