---
title: "SAML 2.0 External Provider"
description: "Guide to registering a SAML 2.0 identity provider as an external authentication scheme in IdentityServer using AddSamlServiceProvider(), covering configuration options, validation, and when to use static vs. dynamic provider registration."
date: 2026-05-15
sidebar:
  label: "SAML 2.0 Provider"
  order: 65
  badge:
    text: v8.0
    variant: tip
---

IdentityServer includes a built-in SAML 2.0 Service Provider (SP) authentication handler that lets you authenticate users against an external SAML 2.0 Identity Provider (IdP). This is useful when you need to federate with enterprise identity systems such as ADFS, Shibboleth, or other SAML-compliant providers.

:::note
This page covers **static** registration of a SAML 2.0 external provider using `AddSamlServiceProvider()`. If you need to manage a large or frequently changing set of SAML providers at runtime, see [Dynamic Providers](/identityserver/ui/login/dynamicproviders.md) instead.
:::

For the general external provider workflow (triggering authentication, handling callbacks, and managing cookies), see [Integrating with External Providers](/identityserver/ui/login/external.md).

## Registering a SAML 2.0 External Provider

Call the `AddSamlServiceProvider()` extension method on the `AuthenticationBuilder`, just as you would register an OpenID Connect or other external provider:

```csharp
// Program.cs
builder.Services.AddIdentityServer();

builder.Services.AddAuthentication()
    .AddSamlServiceProvider(options =>
    {
        options.SpEntityId = "https://my-app.example.com";
        options.IdpEntityId = "https://idp.example.com";
        options.SingleSignOnServiceUrl = "https://idp.example.com/saml2/sso";
        options.SigningCertificatesBase64 = ["<base64-encoded IdP signing certificate>"];
    });
```

This registers a scheme named `Saml2` (the default) that handles SAML 2.0 authentication flows. The scheme appears alongside any other external providers on the login page.

### Custom Scheme Name

To register multiple SAML providers, or to use a custom scheme name, pass the scheme name as the first argument:

```csharp
// Program.cs
builder.Services.AddAuthentication()
    .AddSamlServiceProvider("corporate-idp", options =>
    {
        options.SpEntityId = "https://my-app.example.com";
        options.IdpEntityId = "https://corporate-idp.example.com";
        options.SingleSignOnServiceUrl = "https://corporate-idp.example.com/saml2/sso";
        options.SigningCertificatesBase64 = ["<base64-encoded signing certificate>"];
    });
```

You can call `AddSamlServiceProvider()` multiple times with different scheme names to register several SAML IdPs side by side.

## Configuration Options

The `SamlServiceProviderOptions` class controls how the SP handler communicates with the remote IdP.

### Required Properties

| Property                 | Description                                                                                                                  |
|--------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `SpEntityId`             | The entity ID of your application (the Service Provider). This is the identifier the IdP uses to recognize your application. |
| `IdpEntityId`            | The entity ID of the remote SAML Identity Provider.                                                                          |
| `SingleSignOnServiceUrl` | The URL of the IdP's Single Sign-On endpoint where authentication requests are sent.                                         |

### Optional Properties

| Property                        | Default                        | Description                                                                                                                                      |
|---------------------------------|--------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `BindingType`                   | `SamlBindingType.HttpRedirect` | The SAML binding to use when sending authentication requests. Accepted values are `SamlBindingType.HttpRedirect` and `SamlBindingType.HttpPost`. |
| `SingleLogoutServiceUrl`        | `null`                         | The URL of the IdP's Single Logout endpoint. When not set, outbound logout requests are disabled.                                                |
| `SigningCertificatesBase64`     | empty list                     | Base64-encoded X.509 certificates used to validate signatures from the IdP. You can provide multiple certificates to support key rotation.       |
| `AllowUnsolicitedAuthnResponse` | `false`                        | Whether to allow unsolicited (IdP-initiated) authentication responses.                                                                           |
| `WantAssertionsSigned`          | `true`                         | Whether assertions from the IdP must be signed.                                                                                                  |
| `OutboundSigningAlgorithm`      | RSA-SHA256                     | The XML signature algorithm used for outbound SAML requests.                                                                                     |
| `ModulePath`                    | `"/Saml2"`                     | The application-relative path prefix for the handler's ACS and metadata endpoints.                                                               |
| `SignInScheme`                  | `null`                         | The authentication scheme used to persist the session after SAML authentication. When `null`, the default sign-in scheme is used.                |
| `SignOutScheme`                 | `null`                         | The authentication scheme used when processing logout requests from the IdP. When `null`, the default sign-out scheme is used.                   |

The `BindingType` property accepts values from the `SamlBindingType` enum:

* `SamlBindingType.HttpRedirect`: sends the authentication request as a URL-encoded redirect (the default)
* `SamlBindingType.HttpPost`: sends the authentication request as an HTTP POST form submission

## Validation

The required properties (`SpEntityId`, `IdpEntityId`, and `SingleSignOnServiceUrl`) are validated eagerly at host startup. Any certificates listed in `SigningCertificatesBase64` are also validated to confirm they can be loaded as X.509 certificates. If a required property is missing or a certificate is invalid, the application fails to start with a clear `OptionsValidationException`.

## Static vs. Dynamic Providers

Use this table to decide which registration approach fits your situation:

| Scenario                                                        | Approach                                                                                          |
|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| A small number of known SAML IdPs configured at deployment time | `AddSamlServiceProvider()` (this page)                                                            |
| Many IdPs managed at runtime, loaded from a database            | [Dynamic Providers](/identityserver/ui/login/dynamicproviders.md) with `AddSamlDynamicProvider()` |

Both approaches use the same underlying SAML SP handler. Static registration is simpler when you have a fixed set of providers and do not need runtime management.

For background on the IdP and SP roles in SAML 2.0, see [IdP and SP Concepts](/identityserver/saml/idp-and-sp.md).
