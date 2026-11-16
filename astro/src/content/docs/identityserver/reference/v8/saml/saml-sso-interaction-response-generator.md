---
title: "SAML SSO Interaction Response Generator"
description: "Reference for ISaml2SsoInteractionResponseGenerator and Saml2InteractionResponse, which decide whether a SAML sign-in request needs a login, an error, or no interaction."
date: 2026-11-16
sidebar:
  label: "SAML SSO Interaction"
  order: 2
---

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2SsoInteractionResponseGenerator

Determines which interaction a validated SAML `AuthnRequest` needs: a login, a SAML error returned to the service provider (SP), or no interaction.

```csharp
public interface ISaml2SsoInteractionResponseGenerator
{
    Task<Saml2InteractionResponse> ProcessInteractionAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct);
}
```

## Saml2InteractionResponse

`Saml2InteractionResponse` is a sealed record created with factory methods:

| Factory | Description |
|---|---|
| `Login()` | Redirect the user to the login page. |
| `NoInteraction()` | Continue directly to assertion generation. |
| `Error(statusCode, subStatusCode)` | Return a SAML error response to the SP. |
| `Error(statusCode, subStatusCode, message)` | Same, with a human-readable message. |

Properties: `IsLogin`, `IsError`, `StatusCode`, `SubStatusCode`, `Message`. Use the constants in [`SamlStatusCodes`](/identityserver/reference/v8/saml/saml-constants.md) for status codes.

## Default behavior

The default implementation, `Saml2SsoInteractionResponseGenerator`, is sealed:

* No authenticated user: returns `Login()`, or an error with `SamlStatusCodes.NoPassive` if the request has `IsPassive` set.
* The user is authenticated but `IProfileService.IsActiveAsync` returns `false`: same as above.
* `ForceAuthn` is set: returns `Login()` (or the `NoPassive` error if `IsPassive` is also set).
* Otherwise: returns `NoInteraction()`.

The default implementation doesn't evaluate `RequestedAuthnContext`. Because the class is sealed, wrap it (decorate it) instead of inheriting from it.

## Registration

```csharp
builder.Services.AddScoped<ISaml2SsoInteractionResponseGenerator, CustomSamlSsoInteractionGenerator>();
```

The default is registered with `TryAdd`, so a custom registration takes precedence.
