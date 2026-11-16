---
title: "SAML SSO Interaction Response Generator"
description: "Reference for ISaml2SsoInteractionResponseGenerator and Saml2InteractionResponse, which decide whether a SAML sign-in request needs a login, an error, or no interaction."
date: 2026-11-16
sidebar:
  label: "SAML SSO Interaction"
  order: 2
---

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2SsoInteractionResponseGenerator

Interaction response generator for SAML2 `AuthnRequests`. It processes a validated `AuthnRequest` and decides what/if interaction is required: a login, a SAML error returned to the service provider (SP), or no interaction.

```csharp
public interface ISaml2SsoInteractionResponseGenerator
{
    Task<Saml2InteractionResponse> ProcessInteractionAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct);
}
```

## Saml2InteractionResponse

`Saml2InteractionResponse` represents the result of processing a SAML `AuthnRequest` interaction check. It is a sealed record created with factory methods:

| Factory | Description |
|---|---|
| `Login()` | Creates a response indicating the user must log in. The user is redirected to the login page. |
| `NoInteraction()` | Creates a response indicating no interaction is required. IdentityServer continues directly to assertion generation. |
| `Error(statusCode, subStatusCode)` | Creates an error response with SAML status and sub-status codes. `statusCode` is the top-level SAML status code and `subStatusCode` is the nested SAML sub-status code. IdentityServer returns a SAML error response to the SP. |
| `Error(statusCode, subStatusCode, message)` | Creates an error response with SAML status codes and a human-readable message. `message` is a human-readable error message. |

| Property | Description |
|---|---|
| `IsLogin` | Gets a value indicating whether the user must log in. |
| `IsError` | Gets a value indicating whether this is an error response. |
| `StatusCode` | Gets the top-level SAML status code (e.g., `urn:oasis:names:tc:SAML:2.0:status:Responder`). Only set when `IsError` is `true`. |
| `SubStatusCode` | Gets the nested SAML sub-status code (e.g., `urn:oasis:names:tc:SAML:2.0:status:NoPassive`). Only set when `IsError` is `true`. |
| `Message` | Gets the human-readable error message. Only set when `IsError` is `true`. |

Use the constants in [`SamlStatusCodes`](/identityserver/reference/v8/saml/saml-constants.md) for status codes.

## Default behavior

The default implementation, `Saml2SsoInteractionResponseGenerator`, determines whether user interaction (login) is required for a SAML SSO request. This generator is only invoked on the SSO endpoint path (initial `AuthnRequest` processing), where `ValidatedAuthnRequest.AuthnRequest` is always populated from the parsed XML. It is never called on the callback path after login. The class is sealed:

* No authenticated user: returns `Login()`, or an error with `SamlStatusCodes.NoPassive` if the request has `IsPassive` set.
* The user is authenticated but `IProfileService.IsActiveAsync` returns `false`: same as above.
* `ForceAuthn` is set: returns `Login()` (or the `NoPassive` error if `IsPassive` is also set).
* Otherwise: returns `NoInteraction()`.

The default implementation ignores `RequestedAuthnContext`. The class is sealed, so decorate it instead of inheriting from it.

## Registration

```csharp
builder.Services.AddScoped<ISaml2SsoInteractionResponseGenerator, CustomSamlSsoInteractionGenerator>();
```

Your registration replaces the default.
