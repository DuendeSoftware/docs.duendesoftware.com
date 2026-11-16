---
title: "SAML Constants and Status Codes"
description: "Reference for SamlStatusCodes and SamlConstants, the constants used when working with SAML extension points."
date: 2026-11-16
sidebar:
  label: "SAML Constants"
  order: 17
---

## Duende.IdentityServer.Saml.Models.SamlStatusCodes

Well-known SAML 2.0 status code URNs as defined in the SAML 2.0 Core specification. Use them in error responses, such as `Saml2InteractionResponse.Error`, `NameIdGenerationResult.Failure`, and `AuthnRequestValidationResult.InValid`.

| Constant | Value | Kind | Description |
|---|---|---|---|
| `Success` | `urn:oasis:names:tc:SAML:2.0:status:Success` | Top-level | The request succeeded. |
| `Requester` | `urn:oasis:names:tc:SAML:2.0:status:Requester` | Top-level | The request could not be performed due to an error on the part of the requester. |
| `Responder` | `urn:oasis:names:tc:SAML:2.0:status:Responder` | Top-level | The request could not be performed due to an error on the part of the SAML responder or SAML authority. |
| `VersionMismatch` | `urn:oasis:names:tc:SAML:2.0:status:VersionMismatch` | Top-level | The SAML responder could not process the request because the version of the request message was incorrect. |
| `NoAuthnContext` | `urn:oasis:names:tc:SAML:2.0:status:NoAuthnContext` | Second-level | The specified authentication context requirements cannot be met by the responder. |
| `AuthnFailed` | `urn:oasis:names:tc:SAML:2.0:status:AuthnFailed` | Second-level | The authentication attempt failed. |
| `InvalidNameIdPolicy` | `urn:oasis:names:tc:SAML:2.0:status:InvalidNameIDPolicy` | Second-level | The responding provider cannot or will not support the requested name identifier policy. |
| `RequestDenied` | `urn:oasis:names:tc:SAML:2.0:status:RequestDenied` | Second-level | The SAML responder or SAML authority is able to process the request but has chosen not to respond. |
| `UnknownPrincipal` | `urn:oasis:names:tc:SAML:2.0:status:UnknownPrincipal` | Second-level | The responding provider does not recognize the principal specified or implied by the request. |
| `UnsupportedBinding` | `urn:oasis:names:tc:SAML:2.0:status:UnsupportedBinding` | Second-level | The SAML responder cannot properly fulfill the request using the protocol binding specified in the request. |
| `NoPassive` | `urn:oasis:names:tc:SAML:2.0:status:NoPassive` | Second-level | The identity provider cannot authenticate the presenter in a manner that satisfies the `IsPassive` constraint of the request. |
| `PartialLogout` | `urn:oasis:names:tc:SAML:2.0:status:PartialLogout` | Second-level | Used with a top-level status code of Success to indicate that not all requested logouts were successful. |

## Duende.IdentityServer.Saml.SamlConstants

Constants for SAML 2.0 values, such as URNs, namespaces, binding names, and default endpoint paths. Groups of constants:

| Group | Members |
|---|---|
| `NameIdentifierFormats` | NameID format URNs: `EmailAddress` (email address format), `Persistent` (persistent format), `Transient` (transient format), `Unspecified` (unspecified format) |
| `Bindings` | SAML protocol binding URNs: `HttpRedirect` (`urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect`, the HTTP-Redirect binding), `HttpPost` (`urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST`, the HTTP-POST binding) |
| `AuthnContextClasses` | Authentication context class URNs: `PasswordProtectedTransport` (password protected transport), `Unspecified` (unspecified) |
| `ClaimTypes` | Claim types that carry SAML-specific information: `AuthnContextClassRef` (`saml:acr`, the authentication context class reference of the authentication) |
| `ContentTypes` | `Metadata` (`application/samlmetadata+xml`, the media type of SAML metadata documents, see [the IANA registration](https://www.iana.org/assignments/media-types/application/samlmetadata+xml)) |
| `Defaults` | Default values. These are the default endpoint paths: `Saml2Path`, `SingleSignOnServicePath`, `SingleSignOnCallbackPath`, `SingleLogoutServicePath`, `SingleLogoutCallbackPath`, `SpLogoutCompletionPath` |

The `Defaults` constants:

| Constant | Value | Description |
|---|---|---|
| `Saml2Path` | `/Saml2` | Default path for SAML2 |
| `SingleSignOnServicePath` | `/Saml2/SSO` | Default path for SSO endpoint |
| `SingleSignOnCallbackPath` | `/Saml2/SSO/Callback` | Default path for SSO callback endpoint (post-login return) |
| `SingleLogoutServicePath` | `/Saml2/SLO` | Default path for SLO endpoint |
| `SingleLogoutCallbackPath` | `/Saml2/SLO/Callback` | Default path for SLO callback endpoint (post-logout return) |
| `SpLogoutCompletionPath` | `/saml/slo/sp-complete` | Default path for SP-side logout completion endpoint |

```csharp
var sp = new SamlServiceProvider
{
    DefaultNameIdFormat = SamlConstants.NameIdentifierFormats.EmailAddress
};
```
