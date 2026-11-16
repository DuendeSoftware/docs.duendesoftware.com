---
title: "SAML Service Provider Configuration Validator"
description: "Reference for ISamlServiceProviderConfigurationValidator and its default implementation, which validate SAML service provider configuration at runtime."
date: 2026-11-16
sidebar:
  label: "SAML SP Configuration"
  order: 11
---

#### Duende.IdentityServer.Validation.ISamlServiceProviderConfigurationValidator

Validator for SAML service provider configuration. It validates the configuration of a SAML service provider (SP) at runtime. It is called by `ValidatingSamlServiceProviderStore<T>`, the SAML service provider store decorator for running runtime configuration validation checks, which wraps your store when you register it with `AddSamlServiceProviderStore<T>()`.

```csharp
public interface ISamlServiceProviderConfigurationValidator
{
    Task ValidateAsync(SamlServiceProviderConfigurationValidationContext context, CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `ValidateAsync` | Determines whether the configuration of a SAML service provider is valid. `context` is the context and `ct` is the cancellation token. The task completes when validation is finished, and errors are reported through the context. |

## SamlServiceProviderConfigurationValidationContext

Context for SAML service provider configuration validation.

| Member | Description |
|---|---|
| `ServiceProvider` | Gets the service provider being validated. It's the `SamlServiceProvider`. |
| `IsValid` | Returns true if the service provider configuration is valid. It's `true` by default. |
| `ErrorMessage` | Gets or sets the error message. |
| `SetError(string message)` | Sets a validation error. It sets `IsValid` to `false` and records the message. `message` is the message. |

`ValidatingSamlServiceProviderStore<T>` finds a SAML service provider by entity ID (and runs the validation logic). It returns the service provider, or null if not found or invalid. An invalid SP is treated as not found and raises `InvalidSamlServiceProviderConfigurationEvent`, the event for invalid SAML service provider configuration.

## DefaultSamlServiceProviderConfigurationValidator

Default SAML service provider configuration validator. Namespace `Duende.IdentityServer.Validation`. Derive from the default validator and override any of these methods to change a check (each is `protected virtual` and takes only the context, with no cancellation token). Validation stops at the first error.

| Method | Checks |
|---|---|
| `ValidateEntityIdAsync` | Validates that the `EntityId` is not null, empty, or whitespace. |
| `ValidateAssertionConsumerServiceUrlsAsync` | Validates that at least one Assertion Consumer Service URL is configured and that every Assertion Consumer Service URL uses the HTTP-POST binding. |
| `ValidateAllowedScopesAsync` | Validates that at least one allowed scope is configured. |
| `ValidateLifetimesAsync` | Validates lifetime-related configuration settings. When set, `AssertionLifetime` and `RequestMaxAge` must be positive and `ClockSkew` can't be negative. |

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

`AddSaml()` and `AddSamlServiceProviderStore<T>()` register the default validator. Register your own before or after them to replace it:

```csharp
builder.Services.AddScoped<ISamlServiceProviderConfigurationValidator, CustomSamlServiceProviderConfigurationValidator>();
```
