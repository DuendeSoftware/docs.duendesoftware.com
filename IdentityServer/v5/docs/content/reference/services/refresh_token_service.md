---
title: "Refresh Token Service"
weight: 50
---

#### Duende.IdentityServer.Services.IRefreshTokenService

All refresh token handling is implemented in the *DefaultRefreshTokenService* (which is the default implementation of the *IRefreshTokenService* interface):

```cs
public interface IRefreshTokenService
{
    /// <summary>
    /// Validates a refresh token.
    /// </summary>
    Task<TokenValidationResult> ValidateRefreshTokenAsync(string token, Client client);
    
    /// <summary>
    /// Creates the refresh token.
    /// </summary>
    Task<string> CreateRefreshTokenAsync(ClaimsPrincipal subject, Token accessToken, Client client);

    /// <summary>
    /// Updates the refresh token.
    /// </summary>
    Task<string> UpdateRefreshTokenAsync(string handle, RefreshToken refreshToken, Client client);
}
```

The logic around refresh token handling is pretty involved, and we don't recommend implementing the interface from scratch,
unless you exactly know what you are doing.
If you want to customize certain behavior, it is more recommended to derive from the default implementation and call the base checks first.

The most common customization that you probably want to do is how to deal with refresh token replays.
This is for situations where the token usage has been set to one-time only, but the same token gets sent more than once.
This could either point to a replay attack of the refresh token, or to faulty client code like logic bugs or race conditions.

It is important to note, that a refresh token is never deleted in the database. 
Once it has been used, the *ConsumedTime* property will be set.
If a token is received that has already been consumed, the default service will call a virtual method called *AcceptConsumedTokenAsync*.

The default implementation will reject the request, but here you can implement custom logic like grace periods, 
or revoking additional refresh or access tokens.