---
title: "SAML AuthnRequest Validator"
description: "Reference for IAuthnRequestValidator and AuthnRequestValidationResult, which validate incoming SAML AuthnRequest messages."
date: 2026-11-16
sidebar:
  label: "SAML AuthnRequest"
  order: 10
---

#### Duende.IdentityServer.Saml.Validation.IAuthnRequestValidator

Validates an incoming SAML `AuthnRequest` early in the sign-in pipeline, before any interaction.

```csharp
public interface IAuthnRequestValidator
{
    Task<AuthnRequestValidationResult> ValidateAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct);
}
```

## AuthnRequestValidationResult

| Member | Description |
|---|---|
| `ValidatedRequest` | The `ValidatedAuthnRequest` the result belongs to. |
| `IsError` | `true` when validation failed. Inherited from `ValidationResult`; `Valid(...)` sets it to `false`. |
| `Error` | The SAML status code of the failure (inherited). |
| `ErrorDescription` | The optional description of the failure (inherited). |
| `Valid(request)` | Creates a valid result. |
| `InValid(request, saml2ErrorCode, errorDescription)` | Creates an invalid result. `saml2ErrorCode` is a SAML status code from [`SamlStatusCodes`](/identityserver/reference/v8/saml/saml-constants.md). `errorDescription` is optional. |

## ValidatedAuthnRequest

Selected members: `AuthnRequest`, `Binding`, `RelayState`, `Saml2Sp` (the nullable `SamlServiceProvider`), `Subject`, `SessionId`, `Saml2IdpEntityId`, `AssertionConsumerService`, `ValidatedResources`, `RequestedClaimTypes`, `IsIdpInitiated`, `SessionIndex`, `RequestId`, `NameIdPolicyFormat`.

```csharp
public async Task<AuthnRequestValidationResult> ValidateAsync(
    ValidatedAuthnRequest request, CancellationToken ct)
{
    var result = await _default.ValidateAsync(request, ct);

    if (request.Saml2Sp?.EntityId == "https://partner.example.com" && DateTime.UtcNow.Hour is < 8 or > 18)
    {
        return AuthnRequestValidationResult.InValid(
            request, SamlStatusCodes.RequestDenied, "Access outside business hours is not permitted.");
    }

    return result;
}
```

## Default behavior

The default implementation, `AuthnRequestValidator`, is a public class. It checks:

* the signature, when `SamlServiceProvider.RequireSignedAuthnRequests` (falling back to `SamlOptions.WantAuthnRequestsSigned`) requires one;
* the request age, using `ClockSkew` and `RequestMaxAge` (falling back to `DefaultClockSkew` and `DefaultRequestMaxAge`);
* that the `NameIDPolicy` format is in `SamlOptions.SupportedNameIdFormats`.

## Registration

```csharp
builder.Services.AddScoped<IAuthnRequestValidator, CustomAuthnRequestValidator>();
```
