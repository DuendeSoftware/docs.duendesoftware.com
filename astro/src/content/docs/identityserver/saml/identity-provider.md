---
title: "SAML 2.0 Identity Provider"
description: Overview of IdentityServer's SAML 2.0 Identity Provider support for issuing SAML assertions to enterprise Service Providers.
date: 2026-05-15
sidebar:
  label: Identity Provider
  order: 20
---

IdentityServer can act as a **SAML 2.0 Identity Provider (IdP)**, issuing SAML assertions to
Service Providers (SPs). This enables integration with enterprise applications and legacy systems
that use the SAML 2.0 protocol rather than OAuth 2.0 / OpenID Connect.

## What's Included

The SAML 2.0 IdP feature covers the full SP-initiated flow, logout, and plenty of extensibility points:

* **SP-initiated SSO**: HTTP Redirect and HTTP POST bindings for authentication requests
* **Single Logout (SLO)**: front-channel logout notifications to registered SPs, with session tracking and partial logout responses when not all SPs respond
* **Assertion signing**: per-SP configuration of signing algorithms
* **NameID format support**: email and using IdentityServer's `sub` (unspecified format) out of the box, with extensibility for custom formats
* **AuthnContext class mapping**: maps OIDC `acr`/`amr` values to SAML AuthnContext class URIs
* **Per-SP claim mappings**: transform and filter claims before they are included in assertions
* **Extensibility interfaces**: customize NameID generation, response generation, metadata, and more

## Quick Setup

The following steps show the minimum configuration to get SAML 2.0 working. For a full reference of all options, see the other pages in this section.

### 1. Register SAML Services

Call `AddSaml()` on the IdentityServer builder to enable all SAML endpoints:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
```

### 2. Register Service Providers

Register Service Providers using the in-memory store for development, the EF Core store for production, or implement a custom `ISamlServiceProviderStore`:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddInMemorySamlServiceProviders(
    [
        new()
        {
            EntityId = "https://sp.example.com",
            DisplayName = "Example SP",
            AssertionConsumerServiceUrls =
            [
                new()
                {
                    Location = "https://sp.example.com/acs",
                    Binding = SamlBinding.HttpPost,
                    Index = 0,
                    IsDefault = true
                }
            ]
        }
    ]);
```

For production, use the EF Core store from `Duende.IdentityServer.EntityFramework.Stores` to persist SP configuration in your database. See [Service Providers](/identityserver/saml/service-providers.md) for all storage options.

## Login Page Compatibility

When a SAML `AuthnRequest` arrives, IdentityServer processes it and redirects to your login page with a `returnUrl`, just as it does for OIDC authorization requests. Your login page authenticates the user and redirects back. The framework handles the rest, regardless of whether the original request was OIDC or SAML.

However, your login page does need one update for SAML support: the non-success path. If the user clicks "Cancel" or authentication is denied for another reason, your login page needs to call `DenyAuthenticationAsync` on `IIdentityServerInteractionService` so that IdentityServer can return the correct SAML error response to the SP. Without this, cancellation won't work for SAML flows. See [Denying Authentication](/identityserver/ui/login/context.md#denying-authentication) for implementation details.

For advanced scenarios where your login UI needs access to SAML-specific request details (such as `RequestedAuthnContext` requirements), call `GetAuthenticationContextAsync` on `IIdentityServerInteractionService` and pattern-match on the result to access `SamlAuthenticationContext`. See [Extensibility](/identityserver/saml/extensibility.md) for details.

## Protocol Endpoints

SAML 2.0 endpoints are registered under the `/Saml2` path prefix:

| Endpoint          | Path                    |
| ----------------- | ----------------------- |
| Metadata          | `/Saml2`                |
| Sign-in           | `/Saml2/SSO`            |
| Sign-in Callback  | `/Saml2/SSO/Callback`   |
| Logout            | `/Saml2/SLO`            |
| Logout Callback   | `/Saml2/SLO/Callback`   |

See [SAML Endpoints](/identityserver/saml/endpoints.md) for full details.

## Samples

For working end-to-end examples of SAML in IdentityServer, see the [SAML samples](/identityserver/samples/saml.mdx).
