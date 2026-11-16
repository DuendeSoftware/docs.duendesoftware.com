---
title: "SAML SSO Response Generator"
description: "Reference for ISaml2SsoResponseGenerator and the Saml2SSoResponseGenerator class, which generate the SAML Response sent to a service provider."
date: 2026-11-16
sidebar:
  label: "SAML SSO Response"
  order: 3
---

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2SsoResponseGenerator

Generates the SAML `Response` (including the assertion) sent to a service provider after sign-in.

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

`ValidatedAuthnRequest.Saml2Sp` is the `SamlServiceProvider` the response is for.

## Default behavior

The default implementation, `Saml2SSoResponseGenerator`, is a public, non-sealed class. Signing follows the SP's `SigningBehavior`, falling back to `SamlOptions.DefaultSigningBehavior`. IdentityServer doesn't encrypt assertions.

Instead of reimplementing the interface, derive from `Saml2SSoResponseGenerator` and override the `protected virtual` methods you need:

| Method | Purpose |
|---|---|
| `IsSafeError` | Decides whether an error can be returned to the SP. |
| `CreateSaml2ResponseAsync` | Builds the `Response` element. |
| `CreateAssertionAsync` | Builds the assertion. |
| `CreateAuthnStatement` | Builds the `AuthnStatement`. |
| `CreateConditions` | Builds the `Conditions` element. |
| `CreateSubjectNameIdAsync` | Creates the subject `NameID`, using [`ISamlNameIdGenerator`](/identityserver/reference/v8/saml/saml-nameid-generator.md). |
| `CreateSubject` | Builds the `Subject` element. |
| `CreateAttributesAsync` | Builds the attribute statement. |
| `MapClaimsToAttributes` | Maps claims to SAML attributes. |

To contribute attributes without replacing the generator, see [SAML attributes](/identityserver/reference/v8/saml/saml-attribute.md).

## Registration

```csharp
builder.Services.AddScoped<ISaml2SsoResponseGenerator, CustomSsoResponseGenerator>();
```
