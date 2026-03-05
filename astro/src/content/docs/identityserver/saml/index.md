---
title: "SAML 2.0 Identity Provider"
description: Overview of IdentityServer's SAML 2.0 Identity Provider support for issuing SAML assertions to enterprise Service Providers.
date: 2026-03-02
sidebar:
  label: Overview
  order: 1
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

:::note
SAML 2.0 Identity Provider support requires a **Duende IdentityServer Enterprise Edition** license
and the `Duende.IdentityServer.Saml` NuGet package.
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

For new integrations, OpenID Connect is recommended. SAML 2.0 support is provided for
interoperability with existing SAML-based systems.

## Prerequisites

1. **Enterprise Edition license** — SAML 2.0 IdP support requires an Enterprise Edition license.
2. **NuGet package** — Install `Duende.IdentityServer.Saml` (included with the `Duende.IdentityServer`
   package for Enterprise Edition builds).

## Quick Setup

### 1. Register SAML Services

Call `AddSaml()` on the IdentityServer builder:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
```

This enables all SAML endpoints except IdP-initiated SSO (which requires explicit opt-in).

### 2. Register Service Providers

Register your SAML Service Providers using the in-memory store (for development/testing) or a
custom `ISamlServiceProviderStore` implementation (for production):

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddInMemorySamlServiceProviders(new[]
    {
        new SamlServiceProvider
        {
            EntityId = "https://sp.example.com",
            DisplayName = "Example SP",
            AssertionConsumerServiceUrls = new[] { new Uri("https://sp.example.com/acs") },
            AssertionConsumerServiceBinding = SamlBinding.HttpPost,
        }
    });
```

### 3. Configure Protocol Type (Optional)

SAML 2.0 uses the protocol type constant `IdentityServerConstants.ProtocolTypes.Saml2p`
(`"saml2p"`). This is used in logging, discovery, and extensibility hooks.

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

See [SAML Endpoints](/identityserver/saml/endpoints/) for full details.

## Further Reading

* [SAML Configuration](/identityserver/saml/configuration/) — `SamlOptions`, `SamlServiceProvider` model, and enums
* [Service Provider Store](/identityserver/saml/service-providers/) — how to register and manage SPs
* [SAML Endpoints](/identityserver/saml/endpoints/) — protocol endpoint details
* [SAML Extensibility](/identityserver/saml/extensibility/) — overridable services and interfaces
