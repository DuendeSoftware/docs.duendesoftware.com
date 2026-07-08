---
title: OidcClientOptions Reference
description: Complete reference for all OidcClientOptions configuration properties
sidebar:
  label: Options Reference
  order: 9
---

This page provides a complete reference for all `OidcClientOptions` properties. For a quick start, see [Automatic Mode](/identitymodel-oidcclient/automatic/) or [Manual Mode](/identitymodel-oidcclient/manual/).

## Required Properties

These properties must be configured for basic operation:

| Property | Type | Description |
|----------|------|-------------|
| `Authority` | `string` | The OpenID Connect provider URL (e.g., `https://demo.duendesoftware.com`) |
| `ClientId` | `string` | The OAuth client identifier registered with the provider |
| `RedirectUri` | `string` | The URI where the browser redirects after authentication |
| `Scope` | `string` | Space-separated list of scopes to request (must include `openid`) |

```csharp
var options = new OidcClientOptions
{
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native",
    RedirectUri = "app://callback",
    Scope = "openid profile email offline_access"
};
```

## Browser Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `Browser` | `IBrowser` | `null` | Browser implementation for user interaction |
| `BrowserTimeout` | `TimeSpan` | 5 min | Timeout for browser-based operations |

## Client Authentication

| Property | Type | Description |
|----------|------|-------------|
| `ClientSecret` | `string` | Client secret for confidential clients |
| `ClientAssertion` | `ClientAssertion` | Client assertion for JWT client authentication |
| `GetClientAssertionAsync` | `Func<Task<ClientAssertion>>` | Callback for dynamic client assertion |
| `TokenClientCredentialStyle` | `ClientCredentialStyle` | How credentials are sent (default: POST body) |

```csharp
// Confidential client with secret
options.ClientSecret = "secret";

// Or with client assertion (e.g., private_key_jwt)
options.ClientAssertion = new ClientAssertion
{
    Type = OidcConstants.ClientAssertionTypes.JwtBearer,
    Value = GenerateClientAssertion()
};
```

## Token Handling

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `LoadProfile` | `bool` | `true` | Load claims from userinfo endpoint |
| `FilterClaims` | `bool` | `true` | Filter protocol claims from user claims |
| `FilteredClaims` | `ICollection<string>` | (various) | Claim types to filter out |
| `ClockSkew` | `TimeSpan` | 5 min | Clock skew tolerance for token validation |

## Discovery

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ProviderInformation` | `ProviderInformation` | `null` | Manual provider configuration (skips discovery) |
| `RefreshDiscoveryDocumentForLogin` | `bool` | `false` | Re-fetch discovery on each login |
| `RefreshDiscoveryOnSignatureFailure` | `bool` | `true` | Re-fetch discovery when signature validation fails |

### Manual Provider Configuration

For offline scenarios or providers without discovery:

```csharp
options.ProviderInformation = new ProviderInformation
{
    IssuerName = "https://idp.example.com",
    AuthorizeEndpoint = "https://idp.example.com/authorize",
    TokenEndpoint = "https://idp.example.com/token",
    UserInfoEndpoint = "https://idp.example.com/userinfo",
    EndSessionEndpoint = "https://idp.example.com/endsession",
    KeySet = loadedKeySet
};
```

## Logout

| Property | Type | Description |
|----------|------|-------------|
| `PostLogoutRedirectUri` | `string` | URI for redirect after logout |

## HTTP Configuration

| Property | Type | Description |
|----------|------|-------------|
| `BackchannelHandler` | `HttpMessageHandler` | Custom handler for back-channel requests |
| `BackchannelTimeout` | `TimeSpan` | Timeout for token/userinfo requests |
| `RefreshTokenInnerHttpHandler` | `HttpMessageHandler` | Inner handler for refresh token handler |
| `HttpClientFactory` | `Func<OidcClientOptions, HttpClient>` | Factory for creating HttpClient instances |

```csharp
// Custom handler for debugging or proxying
options.BackchannelHandler = new HttpClientHandler
{
    Proxy = new WebProxy("http://localhost:8888")
};

options.BackchannelTimeout = TimeSpan.FromSeconds(30);
```

## Pushed Authorization Requests (PAR)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `DisablePushedAuthorization` | `bool` | `false` | Disable PAR even if supported |

PAR is automatically used when the provider supports it unless disabled.

## Resource Indicators

| Property | Type | Description |
|----------|------|-------------|
| `Resource` | `ICollection<string>` | Resource indicators for token requests |

```csharp
options.Resource = new[] { "urn:api:resource1", "urn:api:resource2" };
```

## State Management

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `StateLength` | `int` | 64 | Length of generated state parameter |

## Logging

| Property | Type | Description |
|----------|------|-------------|
| `LoggerFactory` | `ILoggerFactory` | Logger factory for diagnostic logging |

See [Logging](/identitymodel-oidcclient/logging/) for details.

## Validation Policy

| Property | Type | Description |
|----------|------|-------------|
| `Policy` | `Policy` | Validation policy settings |
| `IdentityTokenValidator` | `IIdentityTokenValidator` | Custom token validator |

### Policy Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `Discovery` | `DiscoveryPolicy` | (default) | Discovery document validation settings |
| `RequireAccessTokenHash` | `bool` | `false` | Require `at_hash` claim in ID token |
| `RequireIdentityTokenOnRefreshTokenResponse` | `bool` | `false` | Require ID token on refresh |
| `RequireIdentityTokenSignature` | `bool` | `true` | Require signed ID tokens |
| `ValidateTokenIssuerName` | `bool` | `true` | Validate issuer matches |
| `ValidSignatureAlgorithms` | `ICollection<string>` | (asymmetric) | Allowed signing algorithms |

```csharp
options.Policy = new Policy
{
    RequireAccessTokenHash = true,
    ValidSignatureAlgorithms = new[] { "RS256", "ES256" }
};
```

## Complete Example

```csharp
var options = new OidcClientOptions
{
    // Required
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native",
    RedirectUri = "app://callback",
    Scope = "openid profile email offline_access api",

    // Logout
    PostLogoutRedirectUri = "app://logout",

    // Browser
    Browser = new SystemBrowser(),
    BrowserTimeout = TimeSpan.FromMinutes(2),

    // Claims
    LoadProfile = true,
    FilterClaims = true,

    // Validation
    ClockSkew = TimeSpan.FromMinutes(5),

    // Logging
    LoggerFactory = loggerFactory,

    // HTTP
    BackchannelTimeout = TimeSpan.FromSeconds(30)
};

var client = new OidcClient(options);
```
