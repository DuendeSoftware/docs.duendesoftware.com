---
title: "Requesting a Token"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

A typical architecture is composed of two application (aka client) [types]({{< ref "/overview/terminology#client" >}}) - machine to machine calls and interactive applications.

## Machine to Machine communication
In this scenario a headless application with no interactive user (e.g. a server daemon, batch job etc.) wants to call an API.

Prerequisites are:

* define a [client]({{< ref "/fundamentals/clients" >}}) for the *client credentials* grant type
* define an [API scope]({{< ref "/fundamentals/resources#apis" >}}) (and optionally a resource)
* grant the client access to the scope via the [*AllowedScopes*]({{< ref "/reference/models/client#basics" >}}) property

According to the OAuth [specification](https://tools.ietf.org/html/rfc6749#section-4.4), you request a token by posting to the token endpoint:

```
POST /connect/token
CONTENT-TYPE application/x-www-form-urlencoded

    client_id=client1&
    client_secret=secret&
    grant_type=client_credentials&
    scope=scope1
```

In the success case, this will return a JSON response containing the access token:

```
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

### .NET client library
On .NET you can leverage the [IdentityModel](https://identitymodel.readthedocs.io/en/latest/) client library to [request](https://identitymodel.readthedocs.io/en/latest/client/token.html) tokens.

The above token request would look like this in C#:

```cs
using IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",

    ClientId = "m2m",
    ClientSecret = "secret",
    Scope = "api"
});
```

### Automating token requests in ASP.NET Core and Worker applications
The [IdentityModel.AspNetCore](https://identitymodel.readthedocs.io/en/latest/aspnetcore/worker.html) library can automate client credential request and token lifetime management for you.

Using this library, you only need to register the token client in DI:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddAccessTokenManagement(options =>
    {
        options.Client.Clients.Add("client", new ClientCredentialsTokenRequest
        {
            Address = "https://demo.duendesoftware.com/connect/token",
            ClientId = "m2m",
            ClientSecret = "secret",
            Scope = "api"
        });
    });
}
```

You can then add token management to an HTTP-factory provided client:

```cs
services.AddClientAccessTokenClient("client", configureClient: client =>
{
    client.BaseAddress = new Uri("https://demo.duendesoftware.com/api/");
});
```

...and finally use the client with automatic token management in your application code:

```cs
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

## Interactive applications
In this scenario, an interactive application like a web application or mobile/desktop app wants to call an API in the context of an authenticated user (see spec [here](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth)).

You will receive three tokens - an identity token containing details about the end-user authentication, the access token to call the API, and a refresh token for access token lifetime management. The access token will also contain some information about the end-user (e.g. the user ID), so that the API can do authorization based on the user's identity.

In this scenario you typically use the authorization code flow which first involves a call to the authorize endpoint for all human interactions (e.g. login and/or consent). This returns a code, which you then redeem at the token endpoint to retrieve identity and access tokens.

Prerequisites are:

* define a [client]({{< ref "/fundamentals/clients" >}}) for the *authorization code* grant type
* define an [identity]({{< ref "/fundamentals/resources#identity-resources" >}}) resource, e.g. *openid*
* define an [API scope]({{< ref "/fundamentals/resources#apis" >}}) (and optionally a resource)
* grant the client access to both scopes via the [*AllowedScopes*]({{< ref "/reference/models/client#basics" >}}) property

### Front-channel
The call to the authorize endpoint is one using a redirect in the browser:

```
GET /connect/authorize?
    client_id=client1&
    scope=openid api1&
    response_type=code&
    redirect_uri=https://myapp/callback&
```

On success, the browser will ultimately redirect to the callback endpoint transmitting the authorization code (and other parameters like the granted scopes):

```
GET /callback?
    code=abc&
    scope=openid api1
```

### Back-channel
The client then opens a back-channel communication to the token service to retrieve the tokens:

```
POST /connect/token
CONTENT-TYPE application/x-www-form-urlencoded

    client_id=client1&
    client_secret=secret&
    grant_type=authorization_code&
    code=abc&
    redirect_uri=https://myapp/callback
```

In this scenario, the token response will contain three tokens:

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
    "id_token": "...",
    "access_token": "...",
    "refresh_token": "..."
    "token_type": "bearer",
    "expires_in": 3600,
}
```

{{% notice note %}}
See the refresh token section for more information on how to deal with refresh tokens. TODO link
{{% /notice %}}

### .NET client library
The most common client library for .NET is the OpenID Connect [authentication](https://docs.microsoft.com/en-us/aspnet/core/security/authentication) handler for ASP.NET Core. This library handles the complete front- and back-channel interaction and coordination.

You only need to configure it in your startup code:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication(options =>
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
        });
}
```

### Automating token management in ASP.NET Core
The [IdentityModel.AspNetCore](https://identitymodel.readthedocs.io/en/latest/aspnetcore/web.html) library can also be used to automate token lifetime management in ASP.NET Core applications for you.