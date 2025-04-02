---
title: Blazor Server
sidebar:
  order: 4
---

Blazor Server applications have the same token management requirements as a regular ASP.NET Core web application. Because Blazor Server streams content to the application over a websocket, there often is no HTTP request or response to interact with during the execution of a Blazor Server application. You therefore cannot use *HttpContext* in a Blazor Server application as you would in a traditional ASP.NET Core web application.

This means:

* you cannot use `HttpContext` extension methods
* you cannot use the ASP.NET authentication session to store tokens
* the normal mechanism used to automatically attach tokens to Http Clients making API calls won't work

Fortunately, Duende.AccessTokenManagement provides a straightforward solution to these problems. Also see the [*BlazorServer* sample](https://github.com/DuendeSoftware/foss/tree/main/access-token-management/samples/BlazorServer) for source code of a full example.

## Token storage

Since the tokens cannot be managed in the authentication session, you need to store them somewhere else. The options include an in-memory data structure, a distributed cache like redis, or a database. Duende.AccessTokenManagement describes this store for tokens with the *IUserTokenStore* interface. In non-blazor scenarios, the default implementation that stores the tokens in the session is used. In your Blazor server application, you'll need to decide where you want to store the tokens and implement the store interface.

The store interface is very simple. `StoreTokenAsync` adds a token to the store for a particular user, `GetTokenAsync` retrieves the user's token, and *ClearTokenAsync* clears the tokens stored for a particular user. A sample implementation that stores the tokens in memory can be found in the *ServerSideTokenStore* in the [*BlazorServer* sample](https://github.com/DuendeSoftware/foss/tree/main/access-token-management/samples/BlazorServer).

Register your token store in the DI container and tell Duende.AccessTokenManagement to integrate with Blazor by calling `AddBlazorServerAccessTokenManagement<TTokenStore>`:

```cs
builder.Services.AddOpenIdConnectAccessTokenManagement()
    .AddBlazorServerAccessTokenManagement<ServerSideTokenStore>();
```

Once you've registered your token store, you need to use it. You initialize the token store with the `TokenValidated` event in the OpenID Connect handler:

```cs
public class OidcEvents : OpenIdConnectEvents
{
    private readonly IUserTokenStore _store;

    public OidcEvents(IUserTokenStore store)
    {
        _store = store;
    }

    public override async Task TokenValidated(TokenValidatedContext context)
    {
        var exp = DateTimeOffset.UtcNow.AddSeconds(Double.Parse(context.TokenEndpointResponse!.ExpiresIn));

        await _store.StoreTokenAsync(context.Principal!, new UserToken
        {
            AccessToken = context.TokenEndpointResponse.AccessToken,
            AccessTokenType = context.TokenEndpointResponse.TokenType,
            Expiration = exp,
            RefreshToken = context.TokenEndpointResponse.RefreshToken,
            Scope = context.TokenEndpointResponse.Scope
        });

        await base.TokenValidated(context);
    }
}
```

Once registered and initialized, Duende.AccessTokenManagement will keep the store up to date automatically as tokens are refreshed.

## Retrieving and using tokens

If you've registered your token store with `AddBlazorServerAccessTokenManagement`, Duende.AccessTokenManagement will register the services necessary to attach tokens to outgoing HTTP requests automatically, using the same API as a non-blazor application. You inject an HTTP client factory and resolve named HTTP clients where ever you need to make HTTP requests, and you register the HTTP client's that use access tokens in the DI system with our extension method:

```cs
builder.Services.AddUserAccessTokenHttpClient("demoApiClient", configureClient: client =>
{
    client.BaseAddress = new Uri("https://demo.duendesoftware.com/api/");
});
```
