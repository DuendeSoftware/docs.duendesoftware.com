---
title: "SAML Resource Resolver"
description: "Reference for ISamlResourceResolver and SamlResourceResolutionResult, which resolve the claim types a SAML service provider may receive."
date: 2026-11-16
sidebar:
  label: "SAML Resource Resolver"
  order: 9
---

#### Duende.IdentityServer.Saml.Services.ISamlResourceResolver

Resolves the claim types that a SAML service provider (SP) is allowed to receive, based on its `AllowedScopes` and `RequestedClaimTypes` configuration. `AllowedScopes` must contain only identity resource names — API resource scopes are not supported for SAML service providers.

```csharp
public interface ISamlResourceResolver
{
    Task<SamlResourceResolutionResult> ResolveRequestedClaimTypesAsync(
        SamlServiceProvider sp,
        CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `ResolveRequestedClaimTypesAsync` | Resolves the claim types for the given service provider. `sp` is the service provider to resolve claim types for and `ct` is the cancellation token. Returns a result indicating success with the resolved claim types, or failure with an error reason. |

## SamlResourceResolutionResult

The result of resolving claim types for a SAML service provider.

| Member | Description |
|---|---|
| `Succeeded` | Gets whether the resolution succeeded. |
| `ClaimTypes` | Gets the resolved claim types. Only populated when `Succeeded` is true. |
| `Error` | Gets the error description. Only populated when `Succeeded` is false. |
| `ValidatedResources` | Gets the validated resources. Only populated when `Succeeded` is true. |
| `Success(IReadOnlyList<string> claimTypes, ResourceValidationResult validatedResources)` | Creates a successful result. |
| `Failure(string error)` | Creates a failed result. |

## Default behavior

The default implementation, `DefaultSamlResourceResolver`, is the default implementation of `ISamlResourceResolver` that resolves claim types from the SP's `AllowedScopes` via the resource store. `AllowedScopes` must contain only enabled identity resources. It fails when:

* `AllowedScopes` is empty,
* a scope isn't an enabled identity resource, or
* `RequestedClaimTypes` contains a claim type that isn't in the resolved identity resources.

On failure, IdentityServer logs the details and returns the generic error `Service provider configuration error`.

On success, the claim set is `RequestedClaimTypes` if it isn't empty, otherwise all `UserClaims` of the resolved resources.

## Registration

```csharp
builder.Services.AddScoped<ISamlResourceResolver, CustomResourceResolver>();
```
