---
title: "SAML Resource Resolver"
description: "Reference for ISamlResourceResolver and SamlResourceResolutionResult, which resolve the claim types a SAML service provider may receive."
date: 2026-11-16
sidebar:
  label: "SAML Resource Resolver"
  order: 9
---

#### Duende.IdentityServer.Saml.Services.ISamlResourceResolver

Resolves the claim types a service provider (SP) may receive, based on its `AllowedScopes` and `RequestedClaimTypes`.

```csharp
public interface ISamlResourceResolver
{
    Task<SamlResourceResolutionResult> ResolveRequestedClaimTypesAsync(
        SamlServiceProvider sp,
        CancellationToken ct);
}
```

## SamlResourceResolutionResult

| Member | Description |
|---|---|
| `Succeeded` | `true` when resolution succeeded. |
| `ClaimTypes` | The resolved claim types. |
| `Error` | The error when resolution failed. |
| `ValidatedResources` | The resolved resources. |
| `Success(...)` / `Failure(...)` | Factory methods. |

## Default behavior

`AllowedScopes` must contain only enabled identity resources; API scopes aren't supported for SAML SPs. The default implementation, `DefaultSamlResourceResolver`, fails when:

* `AllowedScopes` is empty,
* a scope isn't an enabled identity resource, or
* `RequestedClaimTypes` contains a claim type that isn't in the resolved identity resources.

Each failure returns the generic error `Service provider configuration error`; the details are logged.

On success, the claim set is `RequestedClaimTypes` if it isn't empty, otherwise all `UserClaims` of the resolved resources.

## Registration

```csharp
builder.Services.AddScoped<ISamlResourceResolver, CustomResourceResolver>();
```
