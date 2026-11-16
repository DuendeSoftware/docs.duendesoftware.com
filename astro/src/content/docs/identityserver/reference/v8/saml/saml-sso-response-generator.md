---
title: "SAML SSO Response Generator"
description: "Reference for ISaml2SsoResponseGenerator and the Saml2SSoResponseGenerator class, which generate the SAML Response sent to a service provider."
date: 2026-11-16
sidebar:
  label: "SAML SSO Response"
  order: 3
---

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2SsoResponseGenerator

Response generator for SAML2 Single Sign On. It generates the SAML `Response` (including the assertion) sent to a service provider after sign-in.

```csharp
public interface ISaml2SsoResponseGenerator
{
    Task<Saml2FrontChannelResult> CreateResponse(
        ValidatedAuthnRequest validatedAuthnRequest,
        CancellationToken ct);

    Task<Saml2FrontChannelResult> CreateErrorResponse(
        ValidatedAuthnRequest validatedAuthnRequest,
        Saml2InteractionResponse interactionResponse,
        CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `CreateResponse` | Create a response for validated `AuthnRequest`. `validatedAuthnRequest` is the validated `AuthnRequest` and `ct` is the cancellation token. Returns the Saml2 front channel response. |
| `CreateErrorResponse` | Create an error response for a validated `AuthnRequest`. If the error is safe to send back to the SP (as determined by the response generator implementation), returns a SAML error `<Response>` via the binding. Otherwise returns an error page redirect. `interactionResponse` is the interaction error response containing SAML status codes. |

`ValidatedAuthnRequest.Saml2Sp` is the `SamlServiceProvider` the response is for.

## Default behavior

The default implementation is `Saml2SSoResponseGenerator`, the Response Generator for SAML2 Single Sign On. It is a public, non-sealed class. Signing follows the SP's `SigningBehavior`, falling back to `SamlOptions.DefaultSigningBehavior`. IdentityServer doesn't encrypt assertions.

Instead of reimplementing the interface, derive from `Saml2SSoResponseGenerator` and override the `protected virtual` methods you need:

| Method | Purpose |
|---|---|
| `IsSafeError` | Determines whether an interaction error is safe to send back to the SP as a SAML error response. When `true`, a SAML error `<Response>` is sent to the SP's ACS URL. When `false`, the user is redirected to the error page instead. The default implementation returns `true` for all interaction errors, since they occur after full `AuthnRequest` validation. Override to suppress specific errors from being sent back to the SP. |
| `CreateSaml2ResponseAsync` | Create the Saml2 response. |
| `CreateAssertionAsync` | Create the Assertion |
| `CreateAuthnStatement` | Create the `AuthnStatement`. Resolves the `AuthnContextClassRef` by looking up the user's `acr` claim, then `amr` claim(s), against the configured mappings. Falls back to `SamlConstants.AuthnContextClasses.Unspecified` if no match is found. |
| `CreateConditions` | Create the Conditions |
| `CreateSubjectNameIdAsync` | Generate the NameID for the subject using the configured [`ISamlNameIdGenerator`](/identityserver/reference/v8/saml/saml-nameid-generator.md). |
| `CreateSubject` | Create the Subject |
| `CreateAttributesAsync` | Create Attributes |
| `MapClaimsToAttributes` | Maps OIDC claims to SAML attribute. If a service provider specific mapping exists, that will be used. If one does not exist, the global mapping on `SamlOptions` will be used. If a claim does not have a mapping, it will be passed through as-is. |

To contribute attributes without replacing the generator, see [SAML attributes](/identityserver/reference/v8/saml/saml-attribute.md).

## Registration

```csharp
builder.Services.AddScoped<ISaml2SsoResponseGenerator, CustomSsoResponseGenerator>();
```
