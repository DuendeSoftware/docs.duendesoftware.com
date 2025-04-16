---
title: "Token Management"
description: Learn how to customize token storage and management in the BFF framework, including HTTP client configuration and per-route token retrieval
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: "Token Management"
  order: 30
redirect_from:
  - /bff/v2/extensibility/tokens/
  - /bff/v3/extensibility/tokens/
  - /identityserver/v5/bff/extensibility/tokens/
  - /identityserver/v6/bff/extensibility/tokens/
  - /identityserver/v7/bff/extensibility/tokens/
---

The token management library does essentially two things:

* stores access and refresh tokens in the current session
* refreshes access tokens automatically at the token service when needed

Both aspects can be customized.

### Token service communication
The token management library uses a named HTTP client from the HTTP client factory for all token service communication. You can provide a customized HTTP client yourself using the well-known name after calling *AddBff*:

```cs
builder.Services.AddHttpClient(
        AccessTokenManagementDefaults.BackChannelHttpClientName,
        configureClient => { ... }
    );
```

:::note
You can also supply client assertions to the token management library. See this [sample](/bff/samples) for JWT-based client authentication.
:::

### Custom Token Storage
We recommend that you use the default storage mechanism, as this will automatically be compatible with the Duende.BFF server-side sessions.

If you do not use server-side sessions, then the access and refresh token will be stored in the protected session cookie. If you want to change this, you can take over token storage completely.

This would involve two steps

* turn off the *SaveTokens* flag on the OpenID Connect handler and handle the relevant events manually to store the tokens in your custom store
* implement and register the *Duende.AccessTokenManagement.IUserTokenStore* interface

The interface is responsible to storing, retrieving and clearing tokens for the automatic token management:

```cs
public interface IUserTokenStore
{
    /// <summary>
    /// Stores tokens
    /// </summary>
    /// <param name="user">User the tokens belong to</param>
    /// <param name="token"></param>
    /// <param name="parameters">Extra optional parameters</param>
    /// <returns></returns>
    Task StoreTokenAsync(
        ClaimsPrincipal user,
        UserToken token,
        UserTokenRequestParameters? parameters = null);

    /// <summary>
    /// Retrieves tokens from store
    /// </summary>
    /// <param name="user">User the tokens belong to</param>
    /// <param name="parameters">Extra optional parameters</param>
    /// <returns>access and refresh token and access token expiration</returns>
    Task<UserToken> GetTokenAsync(
        ClaimsPrincipal user, 
        UserTokenRequestParameters? parameters = null);

    /// <summary>
    /// Clears the stored tokens for a given user
    /// </summary>
    /// <param name="user">User the tokens belong to</param>
    /// <param name="parameters">Extra optional parameters</param>
    /// <returns></returns>
    Task ClearTokenAsync(
        ClaimsPrincipal user, 
        UserTokenRequestParameters? parameters = null);
}
```

### Per-route Customized Token Retrieval
The token store defines how tokens are retrieved globally. However, you can add custom logic that changes the way that access tokens are retrieved on a per-route basis. For example, you might need to exchange a token to perform delegation or impersonation for some API calls, depending on the remote API. The interface that describes this extension point is the *IAccessTokenRetriever*.


```cs
/// <summary>
/// Retrieves access tokens
/// </summary>
public interface IAccessTokenRetriever
{
    /// <summary>
    /// Asynchronously gets the access token.
    /// </summary>
    /// <param name="context">Context used to retrieve the token.</param>
    /// <returns>A task that contains the access token result, which is an
    /// object model that can represent various types of tokens (bearer, dpop),
    /// the absence of an optional token, or an error. </returns>
    Task<AccessTokenResult> GetAccessToken(AccessTokenRetrievalContext context);
}
```

You can implement this interface yourself or extend the *DefaultAccessTokenRetriever*. The *AccessTokenResult* class represents the result of this operation. It is an abstract class with concrete implementations that represent successfully retrieving a bearer token (*BearerTokenResult*), successfully retrieving a DPoP token (*DPoPTokenResult*), failing to find an optional token (*NoAccessTokenResult*), which is not an error, and failure to retrieve a token (*AccessTokenRetrievalError*). Your implementation of GetAccessToken should return one of those types.

Implementations of the *IAccessTokenRetriever* can be added to endpoints when they are mapped using the *WithAccessTokenRetriever* extension method:

```cs
app.MapRemoteBffApiEndpoint(
        "/API/impersonation", 
        "https://API.example.com/endpoint/requiring/impersonation"
    ).RequireAccessToken(TokenType.User)
     .WithAccessTokenRetriever<ImpersonationAccessTokenRetriever>();
```

The *GetAccessToken* method will be invoked on every call to APIs that use the access token retriever. If retrieving the token is an expensive operation, you may need to cache it. It is up to your retriever code to perform caching.