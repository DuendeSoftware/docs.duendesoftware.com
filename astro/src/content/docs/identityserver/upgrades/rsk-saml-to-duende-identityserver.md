---
title: "Rock Solid Knowledge SAML to Duende IdentityServer SAML"
description: "Step-by-step guide to migrate from Rock Solid Knowledge (RSK) SAML (Rsk.Saml.DuendeIdentityServer) to Duende IdentityServer v8+ built-in SAML 2.0 Identity Provider support."
sidebar:
  order: 138
  label: RSK SAML → Duende SAML
---

:::note
This guide covers migrating from Rock Solid Knowledge (RSK) SAML (`Rsk.Saml.DuendeIdentityServer`) to Duende IdentityServer's built-in SAML 2.0 Identity Provider support. SAML requires the [Standard Edition (with SAML add-on), Advanced, or Custom Edition](https://duendesoftware.com/products/identityserver). SAML is not available in Community Edition or Lite.
:::

This guide walks through migrating from **Rock Solid Knowledge (RSK) SAML** (`Rsk.Saml.DuendeIdentityServer`) to **Duende IdentityServer v8+** with built-in SAML support.

## What Changed

| Aspect       | RSK SAML                                   | Duende SAML (v8+)                                |
|--------------|--------------------------------------------|--------------------------------------------------|
| Package      | `Rsk.Saml.DuendeIdentityServer` (separate) | Built into `Duende.IdentityServer`               |
| .NET Version | .NET 8 (v11.x), .NET 10 (v12.x)            | .NET 10+ required                                |
| License      | Separate RSK SAML license                  | Included in Advanced/Custom; add-on for Standard |
| Registration | `.AddSamlPlugin()`                         | `.AddSaml()`                                     |
| Middleware   | `.UseIdentityServerSamlPlugin()` required  | Not needed                                       |
| SSO Endpoint | `/saml/sso`                                | `/Saml2/SSO`                                     |
| SLO Endpoint | `/saml/slo`                                | `/Saml2/SLO`                                     |
| Metadata     | `/saml/metadata`                           | `/Saml2`                                         |

## Why Migrate?

- **Unified licensing**: One Duende license covers all features; SAML included in Advanced/Custom or available as Standard add-on
- **Built-in support**: No separate package dependency to manage
- **Consistent updates**: SAML features ship with core IdentityServer releases
- **Better integration**: Tighter coupling with IdentityServer's core services

## Migration Guide

### Prerequisites

Before migrating, ensure:

1. **Duende License with SAML**: SAML is included in Advanced and Custom editions, or available as a [Standard Edition add-on](https://duendesoftware.com/products/identityserver)
2. **.NET 10 SDK**: Duende v8+ requires .NET 10
3. **Backup**: Export your current SAML Service Provider (SP) configurations
4. **Test Environment**: Set up a test environment before production migration

### Step 1: Update Target Framework

Duende IdentityServer v8+ requires .NET 10:

```diff lang="xml" title=".csproj"
- <TargetFramework>net8.0</TargetFramework>
+ <TargetFramework>net10.0</TargetFramework>
```

### Step 2: Replace NuGet Packages

```diff lang="xml" title=".csproj"
- <PackageReference Include="Duende.IdentityServer" Version="7.4.3" />
- <PackageReference Include="Rsk.Saml.DuendeIdentityServer" Version="11.0.0" />
+ <PackageReference Include="Duende.IdentityServer" Version="8.0.0" />
+ <!-- No separate SAML package needed! -->
```

### Step 3: Update Namespaces

```diff lang="csharp" title="*.cs"
- using Rsk.Saml;
- using Rsk.Saml.Configuration;
- using Rsk.Saml.Models;
- using Rsk.Saml.Services;
+ using Duende.IdentityServer;
+ using Duende.IdentityServer.Models;
+ using Duende.IdentityServer.Saml;
+ using Duende.IdentityServer.Saml.Models;
```

### Step 4: Update Service Registration

**Before (RSK):**

```csharp title="Program.cs"
builder.Services.AddIdentityServer()
    .AddSamlPlugin(options =>
    {
        options.Licensee = "Your Licensee";
        options.LicenseKey = "Your License Key";
        options.WantAuthenticationRequestsSigned = false;
    });
```

**After (Duende):**

```csharp title="Program.cs"
builder.Services.AddIdentityServer()
    .AddSaml(saml =>
    {
        saml.WantAuthnRequestsSigned = false;
        saml.DefaultSigningBehavior = SamlSigningBehavior.SignAssertion;
        saml.DefaultClockSkew = TimeSpan.FromMinutes(5);
        saml.DefaultAssertionLifetime = TimeSpan.FromMinutes(5);
        
        // Metadata configuration
        saml.Metadata.CacheDuration = TimeSpan.FromHours(12);
        saml.Metadata.ExpiryDuration = TimeSpan.FromDays(5);
    });
```

### Step 5: Remove SAML Middleware

```diff lang="csharp" title="Program.cs"
- app.UseIdentityServer()
-     .UseIdentityServerSamlPlugin();
+ app.UseIdentityServer();
```

Forgetting to remove `.UseIdentityServerSamlPlugin()` will cause a compilation error.

### Step 6: Migrate Service Provider Configuration

This is the most complex part. See [Service Provider Configuration Changes](#service-provider-configuration) for the full before/after comparison.

### Step 7: Migrate Data (if using database stores)

:::note[Database Migration]
If your Service Provider configurations are stored in a database, you will need to migrate that data to Duende's new SAML tables. The [v7.4 to v8.0 upgrade guide](/identityserver/upgrades/v7_4-to-v8_0.md#step-3-update-database-schema) documents the new table schemas. Plan your data migration strategy accordingly.
:::

## API Mapping Reference

### Extension Methods

| RSK SAML                         | Duende SAML             |
|----------------------------------|-------------------------|
| `.AddSamlPlugin(options => { })` | `.AddSaml(saml => { })` |
| `.UseIdentityServerSamlPlugin()` | Not needed              |

### SAML Options

| RSK (`SamlIdpOptions`)             | Duende (`SamlOptions`)                       |
|------------------------------------|----------------------------------------------|
| `WantAuthenticationRequestsSigned` | `WantAuthnRequestsSigned`                    |
| `Licensee`                         | N/A (use `IdentityServerOptions.LicenseKey`) |
| `LicenseKey`                       | N/A (use `IdentityServerOptions.LicenseKey`) |
| —                                  | `DefaultAssertionLifetime` (NEW)             |
| —                                  | `Metadata.CacheDuration` (NEW)               |
| —                                  | `Metadata.ExpiryDuration` (NEW)              |

### Service Provider Model

| RSK (`ServiceProvider`)               | Duende (`SamlServiceProvider`)  |
|---------------------------------------|---------------------------------|
| `EntityId`                            | `EntityId`                      |
| `AssertionConsumerServices`           | `AssertionConsumerServiceUrls`  |
| `SingleLogoutServices`                | `SingleLogoutServiceUrls`       |
| `ClaimsMapping`                       | `ClaimMappings`                 |
| `SignAssertions` (bool)               | `SigningBehavior` (enum)        |
| `EncryptAssertions`                   | `EncryptAssertions`             |
| `RequireAuthenticationRequestsSigned` | `RequireSignedAuthnRequests`    |
| `AllowIdpInitiatedSso`                | `AllowIdpInitiated`             |
| —                                     | `AllowedScopes` (NEW, required) |
| —                                     | `Enabled` (NEW)                 |
| —                                     | `DisplayName` (NEW)             |

### Endpoint Classes

| RSK                                       | Duende                                                      |
|-------------------------------------------|-------------------------------------------------------------|
| `Service(binding, url)`                   | `IndexedEndpoint` (for ACS) or `SamlEndpointType` (for SLO) |
| `SamlConstants.BindingTypes.HttpPost`     | `SamlBinding.HttpPost`                                      |
| `SamlConstants.BindingTypes.HttpRedirect` | `SamlBinding.HttpRedirect`                                  |

Duende uses two different endpoint types:
- **`IndexedEndpoint`**: For ACS endpoints. Includes `Index` and `IsDefault` properties for SAML endpoint indexing.
- **`SamlEndpointType`**: For SLO endpoints. A simpler type with just `Location` and `Binding`.

## Service Provider Configuration

### RSK Service Provider (Before)

```csharp
using Rsk.Saml;
using Rsk.Saml.Models;

public static IEnumerable<ServiceProvider> ServiceProviders =>
[
    new Rsk.Saml.Models.ServiceProvider
    {
        EntityId = "https://sp.example.com/saml",
        
        AssertionConsumerServices =
        [
            new Service(SamlConstants.BindingTypes.HttpPost, "https://sp.example.com/Saml2/Acs")
        ],
        
        SingleLogoutServices =
        [
            new Service(SamlConstants.BindingTypes.HttpPost, "https://sp.example.com/Saml2/Logout")
        ],
        
        ClaimsMapping = new Dictionary<string, string>
        {
            [ClaimTypes.Name] = ClaimTypes.Name,
            [ClaimTypes.Email] = ClaimTypes.Email,
        },
        
        SignAssertions = true,
        EncryptAssertions = false,
        RequireAuthenticationRequestsSigned = false,
        AllowIdpInitiatedSso = true
    }
];
```

### Duende Service Provider (After)

```csharp
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Saml;
using Duende.IdentityServer.Saml.Models;

public static IEnumerable<SamlServiceProvider> SamlServiceProviders =>
[
    new SamlServiceProvider
    {
        EntityId = "https://sp.example.com/saml",
        DisplayName = "Example Service Provider",
        Enabled = true,
        
        AssertionConsumerServiceUrls =
        [
            new IndexedEndpoint
            {
                Location = "https://sp.example.com/Saml2/Acs",
                Binding = SamlBinding.HttpPost,
                Index = 0,
                IsDefault = true
            }
        ],
        
        SingleLogoutServiceUrls =
        [
            new SamlEndpointType
            {
                Location = "https://sp.example.com/Saml2/Logout",
                Binding = SamlBinding.HttpRedirect // Note: Only HttpRedirect is supported for SLO
            }
        ],
        
        ClaimMappings = new Dictionary<string, string>
        {
            [ClaimTypes.Name] = ClaimTypes.Name,
            [ClaimTypes.Email] = ClaimTypes.Email,
        },
        
        SigningBehavior = SamlSigningBehavior.SignAssertion,
        EncryptAssertions = false,
        RequireSignedAuthnRequests = false,
        AllowIdpInitiated = true,
        
        // NEW: Required for Duende
        AllowedScopes = ["openid", "profile", "email"]
    }
];
```

## Breaking Changes

### `AllowedScopes` is Required

Duende requires `AllowedScopes` to be set on each SAML Service Provider (SP). Without it, the Service Provider will fail runtime validation.

```csharp
// REQUIRED - will fail validation without this
AllowedScopes = ["openid", "profile", "email"]
```

`AllowedScopes` determines which claims can be included in SAML assertions. Include the identity resource names that contain the claim types your Service Provider needs:

| If SP needs these claims            | Include this scope                 |
|-------------------------------------|------------------------------------|
| `sub` (subject identifier)          | `openid`                           |
| `name`, `family_name`, `given_name` | `profile`                          |
| `email`, `email_verified`           | `email`                            |
| Custom claims                       | Your custom identity resource name |

### ACS Binding Must Be HttpPost

All `AssertionConsumerServiceUrls` must use `SamlBinding.HttpPost`. HTTP-Redirect is not supported for SAML Response delivery because SAML responses containing signed assertions are typically too large for URL-based transport.

Duende IdentityServer enforces this at runtime via `DefaultSamlServiceProviderConfigurationValidator`. If you configure an ACS endpoint with any other binding, the Service Provider will fail validation and be rejected with an error like:

> Assertion Consumer Service at index 0 uses an unsupported binding 'HttpRedirect'. Only HTTP-POST is supported for SAML Response delivery.

```csharp
// ✅ CORRECT
new IndexedEndpoint
{
    Binding = SamlBinding.HttpPost,
    Location = "https://sp.example.com/Saml2/Acs",
    Index = 0,
    IsDefault = true
}

// ❌ WRONG - will fail runtime validation
new IndexedEndpoint
{
    Binding = SamlBinding.HttpRedirect, // Not supported for ACS
    Location = "https://sp.example.com/Saml2/Acs",
    Index = 0,
    IsDefault = true
}
```

### SLO Only Supports HttpRedirect

Single Logout (SLO) endpoints only support `SamlBinding.HttpRedirect`. Unlike ACS binding validation, this is **not checked at configuration time**. If you configure `HttpPost` for SLO, the configuration will load successfully, but SLO notifications will be **silently skipped** for that Service Provider at runtime.

This happens because the SLO notification service specifically looks for an `HttpRedirect` endpoint. If none is found, it logs a debug message ("UnsupportedBinding") and skips the Service Provider without throwing an error.

If your RSK configuration used `HttpPost` for SLO, change it to `HttpRedirect`:

```diff lang="csharp"
- new Service(SamlConstants.BindingTypes.HttpPost, "https://sp.example.com/Saml2/Logout")
+ new SamlEndpointType
+ {
+     Location = "https://sp.example.com/Saml2/Logout",
+     Binding = SamlBinding.HttpRedirect
+ }
```

### Endpoint URL Paths Changed

| RSK Path         | Duende Path  |
|------------------|--------------|
| `/saml/sso`      | `/Saml2/SSO` |
| `/saml/slo`      | `/Saml2/SLO` |
| `/saml/metadata` | `/Saml2`     |

Update any Service Providers that have hardcoded these URLs.

### Signing Behavior Changed from Bool to Enum

```diff lang="csharp"
- SignAssertions = true,
- SignResponse = false,
+ SigningBehavior = SamlSigningBehavior.SignAssertion
```

Available values: `SignAssertion`, `SignResponse`, `SignBoth`, `DoNotSign`

### License Configuration Changed

RSK SAML had its own license. Duende uses a single license key:

```diff lang="csharp" title="Program.cs"
- .AddSamlPlugin(options =>
- {
-     options.Licensee = "...";
-     options.LicenseKey = "...";
- })
+ builder.Services.AddIdentityServer(options =>
+ {
+     options.LicenseKey = "your-duende-license-key";
+ });
```

### Property Naming Changes

Watch for subtle naming differences:

- `ClaimsMapping` → `ClaimMappings` (plural)
- `AllowIdpInitiatedSso` → `AllowIdpInitiated` (shorter)
- `RequireAuthenticationRequestsSigned` → `RequireSignedAuthnRequests` (reordered)

## Testing Checklist

After migration, verify:

- [ ] Solution builds without errors
- [ ] `/Saml2` returns valid SAML metadata XML
- [ ] Metadata contains correct entity ID
- [ ] Metadata contains correct ACS and SLO endpoints
- [ ] Service Provider-initiated SSO flow works (SP → IdP → authenticate → SP)
- [ ] Claims are correctly mapped in SAML assertions
- [ ] Single Logout works (if configured)
- [ ] IdP-initiated SSO works (if enabled)
- [ ] Existing SAML integrations with live Service Providers still work
- [ ] No license warnings in logs (valid SAML-enabled license active)

### Quick Metadata Test

```bash title="Terminal"
curl -k https://localhost:5001/Saml2
```

## Troubleshooting

### "Service Provider not found" Error

The Service Provider's `EntityId` doesn't match what's registered. Check:

1. Case sensitivity - entity IDs are case-sensitive
2. Trailing slashes - `https://sp.example.com` ≠ `https://sp.example.com/`
3. The Service Provider is registered with `Enabled = true`

### "AllowedScopes is required" Error

Add `AllowedScopes` to your Service Provider configuration:

```csharp
AllowedScopes = ["openid", "profile", "email"]
```

### "Unsupported binding" Error for ACS

If you see an error like:

> Assertion Consumer Service at index 0 uses an unsupported binding 'HttpRedirect'. Only HTTP-POST is supported for SAML Response delivery.

Change your ACS endpoint binding to `SamlBinding.HttpPost`. HTTP-Redirect cannot be used for ACS because SAML responses with signed assertions exceed URL length limits.

### Missing Claims in Assertion

1. Check `ClaimMappings` dictionary
2. Ensure claims exist on the user
3. Verify `AllowedScopes` includes the relevant identity resources

### SSO Works but SLO Fails

1. Verify `SingleLogoutServiceUrls` is configured
2. Ensure SLO binding is `SamlBinding.HttpRedirect` — if you configured `HttpPost`, SLO notifications will be silently skipped (check debug logs for "UnsupportedBinding")
3. Check that the Service Provider and IdP agree on the binding
4. Ensure session management is properly configured

## Related Resources

- [SAML 2.0 Identity Provider Documentation](/identityserver/saml/)
- [SAML Service Provider Configuration](/identityserver/saml/service-providers.md)
- [SAML Endpoints Reference](/identityserver/saml/endpoints.md)
- [v7.4 to v8.0 Upgrade Guide](/identityserver/upgrades/v7_4-to-v8_0.md)
