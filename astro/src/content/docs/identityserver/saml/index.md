---
title: "SAML 2.0 Identity Provider"
description: Overview of IdentityServer's SAML 2.0 Identity Provider support for issuing SAML assertions to enterprise Service Providers.
date: 2026-05-15
sidebar:
  label: Overview
  order: 1
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>

:::note
This feature is part of the [Duende IdentityServer Standard (add-on), Advanced, and Custom Edition](https://duendesoftware.com/products/identityserver).
:::

IdentityServer can act as a **SAML 2.0 Identity Provider (IdP)**, issuing SAML assertions to
Service Providers (SPs). This enables integration with enterprise applications and legacy systems
that use the SAML 2.0 protocol rather than OAuth 2.0 / OpenID Connect.

## When to Use SAML 2.0

SAML 2.0 support is useful when:

* You need to integrate with enterprise SaaS applications that require SAML (e.g., Salesforce,
  Workday, ServiceNow)
* You are migrating from a legacy SSO system that uses SAML
* Your organization has compliance or procurement requirements for SAML-based federation

For new integrations, OpenID Connect is the better choice. SAML 2.0 is herefor when you need to work with existing SAML-based systems.

If you are new to SAML 2.0 or want a refresher on the protocol's core building blocks, see [SAML 2.0 Concepts](/identityserver/saml/concepts.md) for an overview of assertions, bindings, metadata, Name Identifiers, and other key concepts before diving into configuration.

## SAML as an External Provider

IdentityServer can also act as a SAML **Service Provider (SP)**, consuming assertions from an external SAML IdP. This lets you use a third-party SAML IdP as an upstream identity source, the same way you might use Google or Entra ID as an external OIDC provider.

For an overview of both roles (IdP and SP) and how they relate, see [IdentityServer as IdP and SP](/identityserver/saml/idp-and-sp.mdx). For step-by-step setup instructions, see [Configuring a SAML external provider](/identityserver/ui/login/saml-provider.md). If you have many SAML IdPs to manage, consider using [dynamic providers](/identityserver/ui/login/dynamicproviders.md#saml-providers) instead of static registration.

The rest of this section covers the IdP role: configuring IdentityServer to issue SAML assertions to your registered Service Providers.

## What's Included

The SAML 2.0 IdP feature covers the full SP-initiated flow, logout, and plenty of extensibility points:

* **SP-initiated SSO**: HTTP-Redirect and HTTP-POST bindings for authentication requests
* **Single Logout (SLO)**: front-channel logout notifications to registered SPs, with session tracking and partial logout responses when not all SPs respond
* **Assertion signing**: per-SP configuration of signing algorithms
* **NameID format support**: email and unspecified formats (persistent planned for a future release)
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
    .AddInMemorySamlServiceProviders(new[]
    {
        new SamlServiceProvider
        {
            EntityId = "https://sp.example.com",
            DisplayName = "Example SP",
            AssertionConsumerServiceUrls = new List<IndexedEndpoint>
            {
                new IndexedEndpoint
                {
                    Location = "https://sp.example.com/acs",
                    Binding = SamlBinding.HttpPost,
                    Index = 0,
                    IsDefault = true
                }
            }
        }
    });
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
