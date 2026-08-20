---
title: OIDC Client Logout
description: Learn how to implement logout flows with OidcClient including automatic and manual modes
sidebar:
  label: Logout
  order: 6
---

The `OidcClient` library supports OpenID Connect logout, allowing you to end the user's session at the identity provider. Like login, logout can be performed in automatic or manual mode.

## Automatic Mode Logout

If you've configured an `IBrowser` implementation, you can use `LogoutAsync` for automatic logout:

```csharp
var result = await client.LogoutAsync();

if (result.IsError)
{
    Console.WriteLine($"Logout error: {result.Error}");
}
```

### Customizing the Logout Request

You can pass a `LogoutRequest` to customize the logout behavior:

```csharp
var result = await client.LogoutAsync(new LogoutRequest
{
    IdTokenHint = loginResult.IdentityToken,
    BrowserDisplayMode = DisplayMode.Hidden,
    BrowserTimeout = 30
});
```

#### LogoutRequest Properties

| Property | Type | Description |
|----------|------|-------------|
| `IdTokenHint` | `string` | The identity token to hint to the IdP which session to end |
| `State` | `string` | Optional state parameter for the logout request |
| `BrowserDisplayMode` | `DisplayMode` | Controls browser visibility (`Visible` or `Hidden`) |
| `BrowserTimeout` | `int` | Timeout in seconds for the browser interaction |

:::tip[Include the Identity Token]
Always pass the `IdTokenHint` when possible. This allows the identity provider to identify which session to end without prompting the user for confirmation.
:::

## Manual Mode Logout

For manual mode, use `PrepareLogoutAsync` to generate the logout URL:

```csharp
var logoutUrl = await client.PrepareLogoutAsync(new LogoutRequest
{
    IdTokenHint = loginResult.IdentityToken
});

// Navigate the browser to logoutUrl manually
// Handle the callback at PostLogoutRedirectUri
```

The method returns the fully-formed end session endpoint URL. After navigating the browser to this URL, the identity provider will end the session and redirect back to your configured `PostLogoutRedirectUri`.

## LogoutResult

The `LogoutResult` class inherits from `Result` and provides:

| Property | Type | Description |
|----------|------|-------------|
| `IsError` | `bool` | Whether the logout resulted in an error |
| `Error` | `string` | The error code if an error occurred |
| `ErrorDescription` | `string` | Human-readable error description |
| `Response` | `string` | The raw response from the logout endpoint |

## Configuration

Ensure your `OidcClientOptions` includes the post-logout redirect URI:

```csharp
var options = new OidcClientOptions
{
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native",
    RedirectUri = "app://callback",
    PostLogoutRedirectUri = "app://logout-callback",
    Scope = "openid profile",
    Browser = new SystemBrowser()
};
```
