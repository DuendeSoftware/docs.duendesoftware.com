---
title: "SAML 2.0 Identity Provider"
description: Overview of IdentityServer's SAML 2.0 Identity Provider support for issuing SAML assertions to enterprise Service Providers.
date: 2026-03-02
sidebar:
  label: Overview
  order: 1
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

<!--
:::note
SAML 2.0 Identity Provider support requires a **Duende IdentityServer Enterprise Edition** license.
:::
-->

IdentityServer can act as a **SAML 2.0 Identity Provider (IdP)**, issuing SAML assertions to
Service Providers (SPs). This enables integration with enterprise applications and legacy systems
that use the SAML 2.0 protocol rather than OAuth 2.0 / OpenID Connect.

## When to Use SAML 2.0

SAML 2.0 support is useful when:

* You need to integrate with enterprise SaaS applications that require SAML (e.g., Salesforce,
  Workday, ServiceNow)
* You are migrating from a legacy SSO system that uses SAML
* Your organization has compliance or procurement requirements for SAML-based federation

For new integrations, OpenID Connect is recommended. SAML 2.0 support is provided for
interoperability with existing SAML-based systems.

If you are new to SAML 2.0 or want a refresher on the protocol's core building blocks, see [SAML 2.0 Concepts](/identityserver/saml/concepts.md) for an overview of assertions, bindings, metadata, Name Identifiers, and other key concepts before diving into configuration.

## What's Included

The SAML 2.0 IdP feature is a comprehensive implementation covering the full SP-initiated and IdP-initiated SSO flows, logout, and a range of extensibility points. Key capabilities include:

- **SP-initiated SSO**: HTTP-Redirect and HTTP-POST bindings for authentication requests
- **IdP-initiated SSO**: opt-in support for portal or launcher pages that push assertions to SPs without a prior request
- **Single Logout (SLO)**: front-channel logout notifications to registered SPs
- **Assertion signing and encryption**: per-SP configuration of signing algorithms and optional assertion encryption
- **NameID format support**: email, persistent, transient, and unspecified formats
- **AuthnContext class mapping**: maps OIDC `acr`/`amr` values to SAML AuthnContext class URIs
- **Per-SP claim mappings**: transform and filter claims before they are included in assertions
- **Runtime SP management**: register and update Service Providers dynamically via the admin API (`ISamlServiceProviderAdmin`)
- **Extensibility interfaces**: customize NameID generation, response generation, metadata, and more

## Quick Setup

The following steps show the minimum configuration needed to get SAML 2.0 working. For a full reference of all options, see the pages in this section.

### 1. Register SAML Services

Call `AddSaml()` on the IdentityServer builder to enable all SAML endpoints (IdP-initiated SSO requires explicit opt-in):

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
```

### 2. Register Service Providers

Service Providers can be registered in-memory for development and testing, or managed dynamically via the admin API for production deployments.

**Option A: In-memory (development/testing)**

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddInMemorySamlServiceProviders(new[]
    {
        new SamlServiceProvider
        {
            EntityId = ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture),
            DisplayName = "Example SP",
            AssertionConsumerServiceUrls = new List<IndexedEndpoint>
            {
                new IndexedEndpoint
                {
                    Location = new Uri("https://sp.example.com/acs"),
                    Binding = SamlBinding.HttpPost,
                    Index = 0,
                    IsDefault = true
                }
            }
        }
    });
```

**Option B: Admin API (production/dynamic)**

For production deployments, use `ISamlServiceProviderAdmin` to register SPs dynamically from an admin UI or startup routine:

```csharp
// Inject ISamlServiceProviderAdmin and call CreateAsync at startup or from an admin UI
var admin = serviceProvider.GetRequiredService<ISamlServiceProviderAdmin>();
await admin.CreateAsync(new SamlServiceProviderDto { ... }, ct);
```

See [Service Providers](/identityserver/saml/service-providers.md) for the full set of SP configuration options and admin API usage.

## Login Page Compatibility

Your existing IdentityServer login pages work with SAML without modification. IdentityServer uses a protocol-agnostic interaction model: when a SAML AuthnRequest arrives, it is translated into the same `IAuthenticationContext` interface that OIDC authorization requests use. Your login page receives a `returnUrl`, authenticates the user, and redirects back. The framework handles the rest, regardless of whether the original request was OIDC or SAML.

No SAML-specific code is needed in your login, consent, or logout pages for standard flows.

For advanced scenarios where your login UI needs access to SAML-specific request details (such as `RequestedAuthnContext` requirements), inject `ISamlInteractionService`. See [Extensibility](/identityserver/saml/extensibility.md) for details.

## Protocol Endpoints

SAML 2.0 endpoints are registered under the `/saml` path prefix:

| Endpoint          | Path                    |
| ----------------- | ----------------------- |
| Metadata          | `/saml/metadata`        |
| Sign-in           | `/saml/signin`          |
| Sign-in Callback  | `/saml/signin_callback` |
| IdP-initiated SSO | `/saml/idp-initiated`   |
| Logout            | `/saml/logout`          |
| Logout Callback   | `/saml/logout_callback` |

See [SAML Endpoints](/identityserver/saml/endpoints.md) for full details.
