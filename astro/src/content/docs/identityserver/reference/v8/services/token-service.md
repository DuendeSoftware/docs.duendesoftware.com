---
title: "Token Service"
description: Documentation for the ITokenService interface which is responsible for building the Token model for identity tokens and access tokens before they are signed and serialized.
sidebar:
  label: Token Service
  order: 48
---

#### Duende.IdentityServer.Services.ITokenService

The `ITokenService` is responsible for building the `Token` model for identity tokens and access tokens. This is a higher-level service than `ITokenCreationService`: it assembles the token's claims, lifetime, and signing key information, then delegates serialization to `ITokenCreationService`.

Implement or override this service to customize how token models are constructed before they are signed and serialized.

```csharp
/// <summary>
/// Responsible for building the Token model for identity tokens and access tokens.
/// This is a higher-level service than ITokenCreationService: it assembles the
/// token's claims, lifetime, and signing key information, then delegates serialization to
/// ITokenCreationService.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Creates an identity token.
    /// </summary>
    /// <param name="request">The token creation request.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>An identity token.</returns>
    Task<Token> CreateIdentityTokenAsync(TokenCreationRequest request, CancellationToken ct);

    /// <summary>
    /// Creates an access token.
    /// </summary>
    /// <param name="request">The token creation request.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>An access token.</returns>
    Task<Token> CreateAccessTokenAsync(TokenCreationRequest request, CancellationToken ct);

    /// <summary>
    /// Creates a serialized and protected security token.
    /// </summary>
    /// <param name="token">The token.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>A serialized security token (typically a JWT or reference token handle).</returns>
    Task<string> CreateSecurityTokenAsync(Token token, CancellationToken ct);
}
```

## ITokenService APIs

* **`CreateIdentityTokenAsync(TokenCreationRequest request, CancellationToken ct)`**

  Creates an identity token. The `DefaultTokenService` uses `IClaimsService` to determine which claims to include, applies token lifetime from the client configuration, and selects the appropriate signing credentials.

* **`CreateAccessTokenAsync(TokenCreationRequest request, CancellationToken ct)`**

  Creates an access token. The `DefaultTokenService` uses `IClaimsService` for claim assembly, sets the token lifetime, configures audiences, and applies DPoP or mTLS proof-of-possession confirmation if applicable.

* **`CreateSecurityTokenAsync(Token token, CancellationToken ct)`**

  Serializes and protects a token. For JWT access tokens and identity tokens, this delegates to `ITokenCreationService` to produce a signed JWT. For reference tokens, it stores the token via `IReferenceTokenStore` and returns a handle.

## TokenCreationRequest

The `TokenCreationRequest` class models the data needed to create a token from a validated request.

* **`Subject`** — The `ClaimsPrincipal` representing the authenticated user.
* **`ValidatedResources`** — The validated resources (scopes) requested.
* **`ValidatedRequest`** — The validated protocol request.
* **`IncludeAllIdentityClaims`** — Whether to include all identity claims in the token.
* **`AccessTokenToHash`** — The access token value to hash for the `at_hash` claim in identity tokens.
* **`AuthorizationCodeToHash`** — The authorization code value to hash for the `c_hash` claim.
* **`StateHash`** — A pre-hashed state value for the `s_hash` claim.
* **`Nonce`** — The nonce value from the authorization request.
* **`Description`** — The description the user assigned to the device being authorized.

## Default Implementation

The `DefaultTokenService` orchestrates token creation by coordinating between `IClaimsService`, `IKeyMaterialService`, `IReferenceTokenStore`, and `ITokenCreationService`. Its constructor dependencies reflect this coordination:

```csharp
public DefaultTokenService(
    IClaimsService claimsProvider,
    IReferenceTokenStore referenceTokenStore,
    ITokenCreationService creationService,
    TimeProvider timeProvider,
    IKeyMaterialService keyMaterialService,
    IdentityServerOptions options,
    ILogger<DefaultTokenService> logger)
```

## Relationship to Other Services

| Service | Responsibility |
|---------|---------------|
| `IProfileService` | User-centric profile data (claims source) |
| `IClaimsService` | Determines which claims to include in each token type |
| **`ITokenService`** | **Builds the complete `Token` model** |
| `ITokenCreationService` | Serializes the `Token` model into a JWT |

## Sample Implementation

The following example shows a custom token service that adds custom metadata to all access tokens:

```csharp
public class CustomTokenService : DefaultTokenService
{
    public CustomTokenService(
        IClaimsService claimsProvider,
        IReferenceTokenStore referenceTokenStore,
        ITokenCreationService creationService,
        TimeProvider timeProvider,
        IKeyMaterialService keyMaterialService,
        IdentityServerOptions options,
        ILogger<DefaultTokenService> logger)
        : base(claimsProvider, referenceTokenStore, creationService,
               timeProvider, keyMaterialService, options, logger)
    {
    }

    public override async Task<Token> CreateAccessTokenAsync(
        TokenCreationRequest request, CancellationToken ct)
    {
        var token = await base.CreateAccessTokenAsync(request, ct);

        // Add a custom claim to every access token
        token.Claims.Add(new Claim("token_version", "2.0"));

        return token;
    }
}
```

Register the implementation:

```csharp
builder.Services.AddTransient<ITokenService, CustomTokenService>();
```
