---
title: "SAML Service Provider Configuration Validator"
description: "Reference for ISamlServiceProviderConfigurationValidator and its default implementation, which validate SAML service provider configuration at runtime."
date: 2026-11-16
sidebar:
  label: "SAML SP Configuration"
  order: 11
---

#### Duende.IdentityServer.Validation.ISamlServiceProviderConfigurationValidator

Validates the configuration of a SAML service provider (SP) at runtime. It is called by `ValidatingSamlServiceProviderStore<T>`, which wraps your store when you register it with `AddSamlServiceProviderStore<T>()`.

```csharp
public interface ISamlServiceProviderConfigurationValidator
{
    Task ValidateAsync(SamlServiceProviderConfigurationValidationContext context, CancellationToken ct);
}
```

## SamlServiceProviderConfigurationValidationContext

| Member | Description |
|---|---|
| `ServiceProvider` | The `SamlServiceProvider` being validated. |
| `IsValid` | `true` by default. |
| `ErrorMessage` | The error message when invalid. |
| `SetError(string message)` | Sets `IsValid` to `false` and records the message. |

An invalid SP is treated as not found and raises `InvalidSamlServiceProviderConfigurationEvent`.

## DefaultSamlServiceProviderConfigurationValidator

Namespace `Duende.IdentityServer.Validation`. Each method is `protected virtual`, takes only the context (no cancellation token), and validation stops at the first error.

| Method | Checks |
|---|---|
| `ValidateEntityIdAsync` | `EntityId` isn't null or empty. |
| `ValidateAssertionConsumerServiceUrlsAsync` | ACS URLs exist and use HTTP-POST. |
| `ValidateAllowedScopesAsync` | At least one allowed scope is configured. |
| `ValidateLifetimesAsync` | `AssertionLifetime`, `ClockSkew`, and `RequestMaxAge` are valid. |

```csharp
public class CustomSamlServiceProviderConfigurationValidator : DefaultSamlServiceProviderConfigurationValidator
{
    protected override async Task ValidateAllowedScopesAsync(SamlServiceProviderConfigurationValidationContext context)
    {
        await base.ValidateAllowedScopesAsync(context);
        if (!context.IsValid)
        {
            return;
        }

        if (!context.ServiceProvider.AllowedScopes.Contains("openid"))
        {
            context.SetError("AllowedScopes must include 'openid'.");
        }
    }
}
```

## Registration

The default is registered as transient. Register your implementation after `AddIdentityServer()` so it replaces the default:

```csharp
builder.Services.AddScoped<ISamlServiceProviderConfigurationValidator, CustomSamlServiceProviderConfigurationValidator>();
```
