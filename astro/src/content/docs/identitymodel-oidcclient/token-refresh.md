---
title: OIDC Client Token Refresh
description: Learn how to refresh access tokens using OidcClient, including manual refresh and automatic refresh handlers
sidebar:
  label: Token Refresh
  order: 7
---

Access tokens have limited lifetimes for security. When using refresh tokens (obtained by requesting the `offline_access` scope), you can obtain new access tokens without requiring user interaction.

## Manual Token Refresh

Use `RefreshTokenAsync` to manually refresh tokens:

```csharp
var result = await client.RefreshTokenAsync(refreshToken);

if (result.IsError)
{
    Console.WriteLine($"Refresh error: {result.Error}");
    // Handle refresh failure - may need to re-authenticate
    return;
}

// Use the new tokens
var newAccessToken = result.AccessToken;
var newRefreshToken = result.RefreshToken; // May be rotated
```

### RefreshTokenResult Properties

| Property | Type | Description |
|----------|------|-------------|
| `AccessToken` | `string` | The new access token |
| `IdentityToken` | `string` | New identity token (if issued) |
| `RefreshToken` | `string` | New refresh token (if rotated) |
| `ExpiresIn` | `int` | Token lifetime in seconds |
| `AccessTokenExpiration` | `DateTimeOffset` | When the access token expires |
| `IsError` | `bool` | Whether the refresh failed |
| `Error` | `string` | Error code if failed |
| `ErrorDescription` | `string` | Error description if failed |

:::caution[Refresh Token Rotation]
Many identity providers rotate refresh tokens. Always store the latest `RefreshToken` from the result, as the previous one may be invalidated.
:::

## Automatic Token Refresh with RefreshTokenDelegatingHandler

For seamless API calls, use the `RefreshTokenDelegatingHandler` which automatically refreshes tokens before they expire:

```csharp
// After login, create an HttpClient with automatic refresh
var loginResult = await client.LoginAsync();

var handler = new RefreshTokenDelegatingHandler(
    client,
    loginResult.AccessToken,
    loginResult.RefreshToken
);

var apiClient = new HttpClient(handler)
{
    BaseAddress = new Uri("https://api.example.com")
};

// Tokens are refreshed automatically when needed
var response = await apiClient.GetAsync("/protected-resource");
```

### Using the Handler from LoginResult

The `LoginResult` includes a pre-configured handler:

```csharp
var loginResult = await client.LoginAsync();

if (!result.IsError && loginResult.RefreshTokenHandler != null)
{
    var apiClient = new HttpClient(loginResult.RefreshTokenHandler);
    // Use apiClient for API calls with automatic refresh
}
```

### Handling Token Refresh Events

Subscribe to the `TokenRefreshed` event to be notified when tokens are refreshed:

```csharp
var handler = new RefreshTokenDelegatingHandler(
    client,
    loginResult.AccessToken,
    loginResult.RefreshToken
);

handler.TokenRefreshed += (sender, args) =>
{
    // Persist the new tokens
    SaveTokens(args.AccessToken, args.RefreshToken);
    
    Console.WriteLine($"Tokens refreshed, new expiry in {args.ExpiresIn} seconds");
};
```

#### TokenRefreshedEventArgs Properties

| Property | Type | Description |
|----------|------|-------------|
| `AccessToken` | `string` | The new access token |
| `RefreshToken` | `string` | The new refresh token |
| `IdentityToken` | `string` | New identity token (if issued) |
| `ExpiresIn` | `int` | Token lifetime in seconds |

### Handler Configuration

The handler exposes configuration properties:

```csharp
var handler = new RefreshTokenDelegatingHandler(
    client,
    accessToken,
    refreshToken,
    tokenType: "Bearer",          // Token type (default: Bearer)
    innerHandler: new HttpClientHandler()  // Custom inner handler
);

handler.Timeout = TimeSpan.FromSeconds(30);  // Request timeout
```

| Property | Type | Description |
|----------|------|-------------|
| `AccessToken` | `string` | Current access token (read-only) |
| `RefreshToken` | `string` | Current refresh token (read-only) |
| `Timeout` | `TimeSpan` | HTTP request timeout |

## Best Practices

1. **Store tokens securely** - Use platform-specific secure storage (Keychain, Credential Manager, etc.)
2. **Handle refresh failures** - Prompt for re-authentication when refresh fails
3. **Use automatic refresh** - The `RefreshTokenDelegatingHandler` simplifies token management
4. **Persist rotated tokens** - Subscribe to `TokenRefreshed` to save new tokens immediately
