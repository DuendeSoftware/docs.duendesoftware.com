---
title: Web Applications
sidebar:
  order: 20
---


## Overview

This library automates all the tasks around access token lifetime management for user-centric web applications.

While many of the details can be customized, by default the following is assumed:

* ASP.NET Core web application
* cookie authentication handler for session management
* OpenID Connect authentication handler for authentication and access token requests against an OpenID Connect compliant token service
* the token service returns a refresh token

### Setup

By default, the token management library will use the ASP.NET Core default authentication scheme for token storage (this is typically the cookie handler and its authentication session), and the default challenge scheme for deriving token client configuration for refreshing tokens or requesting client credential tokens (this is typically the OpenID Connect handler pointing to your trusted authority).

```cs
// setting up default schemes and handlers
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
    })
    .AddCookie("cookie", options =>
    {
        options.Cookie.Name = "web";

        // automatically revoke refresh token at signout time
        options.Events.OnSigningOut = async e => { await e.HttpContext.RevokeRefreshTokenAsync(); };
    })
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://sts.company.com";

        options.ClientId = "webapp";
        options.ClientSecret = "secret";

        options.ResponseType = "code";
        options.ResponseMode = "query";

        options.Scope.Clear();

        // OIDC related scopes
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("email");

        // API scopes
        options.Scope.Add("invoice");
        options.Scope.Add("customer");

        // requests a refresh token
        options.Scope.Add("offline_access");
        
        options.GetClaimsFromUserInfoEndpoint = true;
        options.MapInboundClaims = false;

        // important! this store the access and refresh token in the authentication session
        // this is needed to the standard token store to manage the artefacts
        options.SaveTokens = true;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "name",
            RoleClaimType = "role"
        };
    });

// adds services for token management
builder.Services.AddOpenIdConnectAccessTokenManagement();

```

#### HTTP client factory

Similar to the worker service support, you can register HTTP clients that automatically send the access token of the current user when making API calls. The message handler plumbing associated with those HTTP clients will try to make sure, the access token is always valid and not expired.

```cs
// registers HTTP client that uses the managed user access token
builder.Services.AddUserAccessTokenHttpClient("invoices",
    configureClient: client => { client.BaseAddress = new Uri("https://api.company.com/invoices/"); });
```

This could be also a typed client:

```cs
// registers a typed HTTP client with token management support
builder.Services.AddHttpClient<InvoiceClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.company.com/invoices/");
    })
    .AddUserAccessTokenHandler();
```

Of course, the ASP.NET Core web application host could also do machine to machine API calls that are independent of a user. In this case all the token client configuration can be inferred from the OpenID Connect handler configuration. The following registers an HTTP client that uses a client credentials token for outgoing calls:

```cs
// registers HTTP client that uses the managed client access token
builder.Services.AddClientAccessTokenHttpClient("masterdata.client",
    configureClient: client => { client.BaseAddress = new Uri("https://api.company.com/masterdata/"); });
```

..and as a typed client:

```cs
builder.Services.AddHttpClient<MasterDataClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.company.com/masterdata/");
    })
    .AddClientAccessTokenHandler();
```

### Usage

There are three ways to interact with the token management service:

* manually
* HTTP context extension methods
* HTTP client factory

#### Manually

You can get the current user and client access token manually by writing code against the `IUserTokenManagementService`.

```cs
public class HomeController : Controller
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IUserTokenManagementService _tokenManagementService;

    public HomeController(IHttpClientFactory httpClientFactory, IUserTokenManagementService tokenManagementService)
    {
        _httpClientFactory = httpClientFactory;
        _tokenManagementService = tokenManagementService;
    }

    public async Task<IActionResult> CallApi()
    {
        var token = await _tokenManagementService.GetAccessTokenAsync(User);
        var client = _httpClientFactory.CreateClient();
        client.SetBearerToken(token.Value);
            
        var response = await client.GetAsync("https://api.company.com/invoices");
        
        // rest omitted
    }
}
```

#### HTTP context extension methods

There are three extension methods on the HTTP context that simplify interaction with the token management service:

* `GetUserAccessTokenAsync` - returns an access token representing the user. If the current access token is expired, it will be refreshed.
* `GetClientAccessTokenAsync` - returns an access token representing the client. If the current access token is expired, a new one will be requested
* `RevokeRefreshTokenAsync` - revokes the refresh token

```cs
public async Task<IActionResult> CallApi()
{
    var token = await HttpContext.GetUserAccessTokenAsync();
    var client = _httpClientFactory.CreateClient();
    client.SetBearerToken(token.Value);
        
    var response = await client.GetAsync("https://api.company.com/invoices");
    
    // rest omitted
}
```

#### HTTP client factory

Last but not least, if you registered clients with the factory, you can simply use them. They will try to make sure that a current access token is always sent along. If that is not possible, ultimately a 401 will be returned to the calling code.

```cs
public async Task<IActionResult> CallApi()
{
    var client = _httpClientFactory.CreateClient("invoices");

    var response = await client.GetAsync("list");
    
    // rest omitted
}
```

...or for a typed client:

```cs
public async Task<IActionResult> CallApi([FromServices] InvoiceClient client)
{
    var response = await client.GetList();
    
    // rest omitted
}
```