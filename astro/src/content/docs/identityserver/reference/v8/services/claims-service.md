---
title: "Claims Service"
description: Documentation for the IClaimsService interface which is responsible for determining which claims to include in identity tokens and access tokens.
sidebar:
  label: Claims
  order: 45
---

#### Duende.IdentityServer.Services.IClaimsService

The `IClaimsService` is responsible for determining which claims to include in tokens. It is called by the `ITokenService` during token creation and works in conjunction with the `IProfileService` to assemble the final set of claims for both identity tokens and access tokens.

```csharp
/// <summary>
/// The claims service is responsible for determining which claims to include in tokens.
/// </summary>
public interface IClaimsService
{
    /// <summary>
    /// Returns claims for an identity token.
    /// </summary>
    /// <param name="subject">The subject.</param>
    /// <param name="resources">The requested resources.</param>
    /// <param name="includeAllIdentityClaims">Whether to include all identity claims.</param>
    /// <param name="request">The validated request.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>Claims for the identity token.</returns>
    Task<IReadOnlyCollection<Claim>> GetIdentityTokenClaimsAsync(
        ClaimsPrincipal subject,
        ResourceValidationResult resources,
        bool includeAllIdentityClaims,
        ValidatedRequest request,
        CancellationToken ct);

    /// <summary>
    /// Returns claims for an access token.
    /// </summary>
    /// <param name="subject">The subject.</param>
    /// <param name="resources">The requested resources.</param>
    /// <param name="request">The validated request.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>Claims for the access token.</returns>
    Task<IReadOnlyCollection<Claim>> GetAccessTokenClaimsAsync(
        ClaimsPrincipal subject,
        ResourceValidationResult resources,
        ValidatedRequest request,
        CancellationToken ct);
}
```

## IClaimsService APIs

* **`GetIdentityTokenClaimsAsync(ClaimsPrincipal subject, ResourceValidationResult resources, bool includeAllIdentityClaims, ValidatedRequest request, CancellationToken ct)`**

  Returns the claims to include in an identity token. The `includeAllIdentityClaims` parameter indicates whether all identity claims should be included (e.g., when `AlwaysIncludeUserClaimsInIdToken` is set on the client, or when there is no access token being issued).

* **`GetAccessTokenClaimsAsync(ClaimsPrincipal subject, ResourceValidationResult resources, ValidatedRequest request, CancellationToken ct)`**

  Returns the claims to include in an access token.

## Default Implementation

The `DefaultClaimsService` is the built-in implementation. It calls `IProfileService.GetProfileDataAsync` to retrieve claims based on the requested claim types from the relevant identity resources and API scopes.

## Relationship to Other Services

The `IClaimsService` sits within a hierarchy of token-related services:

- **`IProfileService`**: Provides user-centric profile data (claims source)
- **`IClaimsService`**: Determines which claims to include in each token type
- **`ITokenService`**: Builds the complete `Token` model including claims, lifetime, and signing info
- **`ITokenCreationService`**: Serializes the `Token` model into a JWT

For most scenarios, customizing claims is best done through `IProfileService`. Use `IClaimsService` when you need to customize the claim-selection logic itself (e.g., filtering, transforming, or augmenting claims differently for identity tokens vs access tokens).

## Sample Implementation

The following example shows a custom claims service that adds a custom claim to all access tokens:

```csharp
public class CustomClaimsService : DefaultClaimsService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CustomClaimsService(
        IProfileService profile,
        IHttpContextAccessor httpContextAccessor,
        ILogger<DefaultClaimsService> logger)
        : base(profile, logger)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override async Task<IReadOnlyCollection<Claim>> GetAccessTokenClaimsAsync(
        ClaimsPrincipal subject,
        ResourceValidationResult resources,
        ValidatedRequest request,
        CancellationToken ct)
    {
        var claims = await base.GetAccessTokenClaimsAsync(subject, resources, request, ct);

        var mutableClaims = claims.ToList();
        mutableClaims.Add(new Claim("tenant_id", ResolveTenantId()));

        return mutableClaims;
    }

    private string ResolveTenantId()
    {
        // Resolve tenant from the current request context
        var host = _httpContextAccessor.HttpContext?.Request.Host.Value;
        return host?.Split('.').FirstOrDefault() ?? "default";
    }
}
```

Register the implementation:

```csharp
builder.Services.AddTransient<IClaimsService, CustomClaimsService>();
```
