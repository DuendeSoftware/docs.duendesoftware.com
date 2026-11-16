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
| `IsError` | `true` when validation failed. Inherited from `ValidationResult`. `Valid(...)` sets it to `false`. |
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

The default implementation, `AuthnRequestValidator`, runs the following checks in order and stops at the first error. To customize a check, derive from the class and override its `protected virtual` method. Errors use `SamlStatusCodes.Requester` unless noted.

| Step | Checks |
|---|---|
| `ValidateSpAsync` | The request has an issuer, and the SP exists and is enabled. An SP without assertion consumer service URLs fails with `SamlStatusCodes.Responder`. |
| `ValidateSignatureTrust` | The signature is present and trusted, when `SamlServiceProvider.RequireSignedAuthnRequests` (falling back to `SamlOptions.WantAuthnRequestsSigned`) requires one. |
| `ValidateVersion` | The version is 2.0 (`SamlStatusCodes.VersionMismatch` otherwise). |
| `ValidateIssueInstant` | The `IssueInstant` isn't in the future and isn't older than the maximum age, using the SP's `ClockSkew` and `RequestMaxAge` (falling back to `SamlOptions.DefaultClockSkew` and `DefaultRequestMaxAge`). |
| `ValidateDestination` | A signed request has a `Destination`. When present, it matches the single sign-on endpoint URL (case-insensitive). |
| `ValidateAcsUrl` | The requested ACS URL or index is registered for the SP. A request can't contain both. Without either, the default (or first) ACS is used. |
| `ValidateNameIdFormat` | The `NameIDPolicy` format (or the SP's `DefaultNameIdFormat`) is in `SamlOptions.SupportedNameIdFormats`. |
| `ValidateScoping` | The request has no `Scoping` element. Requests with one are rejected. |
| `ValidateResourcesAsync` | Resolves claim types through [`ISamlResourceResolver`](/identityserver/reference/v8/saml/saml-resource-resolver.md). A failure returns `SamlStatusCodes.Responder`. |

## Registration

```csharp
builder.Services.AddScoped<IAuthnRequestValidator, CustomAuthnRequestValidator>();
```
