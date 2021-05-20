---
title: "Token Management"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

The token management library does essentially two things:

* stores access and refresh tokens in the current session
* refreshes access tokens automatically at the token service when needed

Both aspects can be customized.

### Token service communication
The token management library uses a named HTTP client from the HTTP client factory for all token service communication. You can provide a customized HTTP client yourself using the well-known name after calling *AddBff*:

```cs
services.AddHttpClient(AccessTokenManagementDefaults.BackChannelHttpClientName, configureClient => { ... });
```

{{% notice note %}}
You can also supply client assertions to the token management library. See this [sample]({{< ref "/samples/basics#mvc-client-with-jar-and-jwt-based-authentication" >}}) for JWT-based client authentication.
{{% /notice %}}

### Custom token storage
We recommend to use the default storage mechanism, as this will automatically be compatible with the Duende.BFF server-side sessions.

If you do not use server-side sessions, then the access and refresh token will be stored in the session cookie. If this is a concern, you can take over token storage completely.

This would involve two steps

* turn off the *SaveTokens* flag on the OpenID Connect handler and handle the relevant events manually to store the tokens in your custom store
* implement and register the *IdentityModel.AspNetCore.AccessTokenManagement.IUserAccessTokenStore* interface

The interface is responsible to storing, retrieving and clearing tokens for the automatic token management:

```cs
public interface IUserAccessTokenStore
{
    /// <summary>
    /// Stores tokens
    /// </summary>
    /// <param name="user">User the tokens belong to</param>
    /// <param name="accessToken">The access token</param>
    /// <param name="expiration">The access token expiration</param>
    /// <param name="refreshToken">The refresh token (optional)</param>
    /// <param name="parameters">Extra optional parameters</param>
    /// <returns></returns>
    Task StoreTokenAsync(ClaimsPrincipal user, string accessToken, DateTimeOffset expiration, string refreshToken = null, UserAccessTokenParameters parameters = null);

    /// <summary>
    /// Retrieves tokens from store
    /// </summary>
    /// <param name="user">User the tokens belong to</param>
    /// <param name="parameters">Extra optional parameters</param>
    /// <returns>access and refresh token and access token expiration</returns>
    Task<UserAccessToken> GetTokenAsync(ClaimsPrincipal user, UserAccessTokenParameters parameters = null);

    /// <summary>
    /// Clears the stored tokens for a given user
    /// </summary>
    /// <param name="user">User the tokens belong to</param>
    /// <param name="parameters">Extra optional parameters</param>
    /// <returns></returns>
    Task ClearTokenAsync(ClaimsPrincipal user, UserAccessTokenParameters parameters = null);
}
```