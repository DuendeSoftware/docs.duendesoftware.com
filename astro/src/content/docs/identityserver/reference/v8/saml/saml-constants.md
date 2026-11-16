---
title: "SAML Constants and Status Codes"
description: "Reference for SamlStatusCodes and SamlConstants, the constants used when working with SAML extension points."
date: 2026-11-16
sidebar:
  label: "SAML Constants"
  order: 17
---

## Duende.IdentityServer.Saml.Models.SamlStatusCodes

SAML status code constants for error responses, such as `Saml2InteractionResponse.Error`, `NameIdGenerationResult.Failure`, and `AuthnRequestValidationResult.InValid`.

| Constant | Value | Kind |
|---|---|---|
| `Success` | `urn:oasis:names:tc:SAML:2.0:status:Success` | Top-level |
| `Requester` | `urn:oasis:names:tc:SAML:2.0:status:Requester` | Top-level |
| `Responder` | `urn:oasis:names:tc:SAML:2.0:status:Responder` | Top-level |
| `VersionMismatch` | `urn:oasis:names:tc:SAML:2.0:status:VersionMismatch` | Top-level |
| `NoAuthnContext` | `urn:oasis:names:tc:SAML:2.0:status:NoAuthnContext` | Second-level |
| `AuthnFailed` | `urn:oasis:names:tc:SAML:2.0:status:AuthnFailed` | Second-level |
| `InvalidNameIdPolicy` | `urn:oasis:names:tc:SAML:2.0:status:InvalidNameIDPolicy` | Second-level |
| `RequestDenied` | `urn:oasis:names:tc:SAML:2.0:status:RequestDenied` | Second-level |
| `UnknownPrincipal` | `urn:oasis:names:tc:SAML:2.0:status:UnknownPrincipal` | Second-level |
| `UnsupportedBinding` | `urn:oasis:names:tc:SAML:2.0:status:UnsupportedBinding` | Second-level |
| `NoPassive` | `urn:oasis:names:tc:SAML:2.0:status:NoPassive` | Second-level |
| `PartialLogout` | `urn:oasis:names:tc:SAML:2.0:status:PartialLogout` | Second-level |

## Duende.IdentityServer.Saml.SamlConstants

Groups of constants:

| Group | Members |
|---|---|
| `NameIdentifierFormats` | `EmailAddress`, `Persistent`, `Transient`, `Unspecified` |
| `Bindings` | `HttpRedirect` (`urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect`), `HttpPost` (`urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST`) |
| `AuthnContextClasses` | `PasswordProtectedTransport`, `Unspecified` |
| `ClaimTypes` | `AuthnContextClassRef` (`saml:acr`) |
| `ContentTypes` | `Metadata` (`application/samlmetadata+xml`) |
| `Defaults` | The default endpoint paths: `Saml2Path` (`/Saml2`), `SingleSignOnServicePath` (`/Saml2/SSO`), `SingleSignOnCallbackPath` (`/Saml2/SSO/Callback`), `SingleLogoutServicePath` (`/Saml2/SLO`), `SingleLogoutCallbackPath` (`/Saml2/SLO/Callback`), `SpLogoutCompletionPath` (`/saml/slo/sp-complete`) |

```csharp
var sp = new SamlServiceProvider
{
    DefaultNameIdFormat = SamlConstants.NameIdentifierFormats.EmailAddress
};
```
