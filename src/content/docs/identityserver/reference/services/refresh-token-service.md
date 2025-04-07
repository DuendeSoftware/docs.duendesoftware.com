---
title: "Refresh Token Service"
sidebar:
  order: 50
redirect_from:
  - /identityserver/v5/reference/services/refresh_token_service/
  - /identityserver/v6/reference/services/refresh_token_service/
  - /identityserver/v7/reference/services/refresh_token_service/
---

#### Duende.IdentityServer.Services.IRefreshTokenService

All refresh token handling is implemented in the `DefaultRefreshTokenService` (which is the default implementation of
the `IRefreshTokenService` interface):

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

The behavior of the refresh token service is complex. We don't recommend
implementing the interface from scratch, unless you know exactly know what you
are doing. If you want to customize how refresh tokens are handled, we
recommended that you create a class that derives from the default implementation
and override its virtual methods, calling the methods in the base class before
adding your own custom logic.

The most common customizations to the refresh token service involve how to
handle consumed tokens. In these situations, the token usage has been set to
one-time only, but the same token gets sent more than once. This could either
point to a replay attack of the refresh token, bugs in the client code, or
transient network failures.

When one-time use refresh tokens are used, they are not necessarily deleted from
the database. The `DeleteOneTimeOnlyRefreshTokensOnUse` configuration flag,
added in version 6.3, controls if such tokens are immediately deleted or
consumed. If configured for consumption instead of deletion, then when the token
is used, the `ConsumedTime` property will be set. If a token is received that
has already been consumed, the default service will call the
`AcceptConsumedTokenAsync` virtual method. The purpose of
`AcceptConsumedTokenAsync` is to determine if a consumed token should be allowed
to be used to produce new tokens. The default implementation of
`AcceptConsumedTokenAsync` rejects all consumed tokens, causing the protocol
request to fail with the "invalid_grant" error. Your customized implementation
could instead add a grace period to allow recovery after network failures or
could treat this as a replay attack and take steps to notify the user and/or
revoke their access.

See also: [Refreshing a token](/identityserver/v7/tokens/refresh)
