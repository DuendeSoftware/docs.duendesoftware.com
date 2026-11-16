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

| Method | Description |
|---|---|
| `ValidateAsync` | Validate an `AuthnRequest`. `request` is the `AuthnRequest` validation context and `ct` is the cancellation token. Returns the validation result. |

## AuthnRequestValidationResult

Result of validating an `AuthnRequest`.

| Member | Description |
|---|---|
| `ValidatedRequest` | The validated request. |
| `IsError` | `true` when validation failed. Inherited from `ValidationResult`. `Valid(...)` sets it to `false`. |
| `Error` | Gets or sets the error. For this result, it's the SAML status code of the failure (inherited). |
| `ErrorDescription` | Gets or sets the error description. It's optional for this result (inherited). |
| `Valid(validatedAuthnRequest)` | Creates a valid validation result. |
| `InValid(validatedAuthnRequest, saml2ErrorCode, errorDescription)` | Creates an invalid validation result. `saml2ErrorCode` is the error code (a Saml2 status code), for example one from [`SamlStatusCodes`](/identityserver/reference/v8/saml/saml-constants.md). `errorDescription` is the error description and is optional. |

## ValidatedAuthnRequest

Validated `AuthnRequest`. Selected members:

| Member | Description |
|---|---|
| `AuthnRequest` | The `AuthnRequest`. Null for IdP-initiated SSO flows. |
| `Binding` | Identifier of binding used to read the `AuthnRequest` |
| `RelayState` | The `RelayState` parameter from the original SAML request. Stored separately so it is available on both the SSO endpoint path (from the binding) and the callback path (from persisted state) without requiring the full `Saml2Message`. |
| `Saml2Sp` | The Saml2 SP. It's a nullable `SamlServiceProvider`. |
| `Subject` | The current user |
| `SessionId` | The current `SessionId` |
| `Saml2IdpEntityId` | The Saml2 identifier for IdentityServer |
| `AssertionConsumerService` | `AssertionConsumerService` to respond to, set once we have enough validation to be able to trust it and return error responses to it. |
| `ValidatedResources` | Resource "validation" results. Used to get list of claims to include in response. |
| `RequestedClaimTypes` | The claim types to request from the profile service for this assertion. Set during resource validation based on the SP's configuration. |
| `IsIdpInitiated` | Indicates whether this request originates from an IdP-initiated SSO flow. When true, the SAML response MUST NOT include an `InResponseTo` attribute per SAML 2.0 Profiles §4.1.4.5. |
| `SessionIndex` | The session index to include in the `AuthnStatement`. This value is used by the SP to correlate the assertion with a specific session for single logout. |
| `RequestId` | The `AuthnRequest` ID, used for `InResponseTo` in the SAML response. On the SSO endpoint path, populated from the parsed `AuthnRequest`. On the callback path, rehydrated from persisted state. |
| `NameIdPolicyFormat` | The `NameIdPolicy` Format requested by the SP. On the SSO endpoint path, populated from the parsed `AuthnRequest`. On the callback path, rehydrated from persisted state. |

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
| `ValidateSpAsync` | Validate the SP/Client. The request has an issuer, and the SP exists and is enabled. An SP without assertion consumer service URLs fails with `SamlStatusCodes.Responder`. |
| `ValidateSignatureTrust` | Validates that the `AuthnRequest` meets the SP's signature trust requirements. The signature is present and trusted when `SamlServiceProvider.RequireSignedAuthnRequests` (falling back to `SamlOptions.WantAuthnRequestsSigned`) requires one. |
| `ValidateVersion` | Validates that the `AuthnRequest` uses SAML version 2.0. Other versions fail with `SamlStatusCodes.VersionMismatch`. |
| `ValidateIssueInstant` | Validates that the `AuthnRequest` `IssueInstant` is not in the future (beyond clock skew) and not expired (beyond max age). It uses the SP's `ClockSkew` and `RequestMaxAge`, falling back to `SamlOptions.DefaultClockSkew` and `DefaultRequestMaxAge`. |
| `ValidateDestination` | Validates that the `AuthnRequest` Destination matches the expected SSO endpoint URL. Signed requests must include a Destination per SAML Bindings 2.0 §3.4.5.2/§3.5.5.2. Unsigned requests may omit the Destination. The comparison is case-insensitive. |
| `ValidateAcsUrl` | Validates and resolves the Assertion Consumer Service endpoint for the SAML response. When the request specifies an ACS URL, all registered endpoints at that location are considered. If a `ProtocolBinding` is also specified, it is used to disambiguate; otherwise the default or first matching endpoint is selected. If an ACS index is specified, it must match a registered endpoint. If neither is specified, the default ACS endpoint is used. A request can't contain both an ACS URL and an index. |
| `ValidateNameIdFormat` | Validates that the requested NameID format is supported by this IdP. The `NameIDPolicy` format (or the SP's `DefaultNameIdFormat`) must be in `SamlOptions.SupportedNameIdFormats`. |
| `ValidateScoping` | Validates that the `AuthnRequest` does not contain a `Scoping` element. `Scoping` is not currently supported. Override this method to allow or implement custom scoping behavior. |
| `ValidateResourcesAsync` | Validates that the service provider's `AllowedScopes` resolve to valid identity resources, that `RequestedClaimTypes` are within the allowed claim types, and populates `ValidatedAuthnRequest.ValidatedResources` with the result. Claim types are resolved through [`ISamlResourceResolver`](/identityserver/reference/v8/saml/saml-resource-resolver.md). A failure returns `SamlStatusCodes.Responder`. SAML service providers must configure `AllowedScopes` to declare which identity resources (and their associated claim types) the SP is allowed to receive. This is the authorization ceiling — analogous to `AllowedScopes` on an OIDC Client. `RequestedClaimTypes` narrows which claim types are included in assertions. Each entry must resolve to a claim type defined by one of the identity resources in `AllowedScopes`. This method sets `ValidatedAuthnRequest.ValidatedResources` and `ValidatedAuthnRequest.RequestedClaimTypes` on the `request`. Overriders must ensure both properties are populated on success. |

## Registration

```csharp
builder.Services.AddScoped<IAuthnRequestValidator, CustomAuthnRequestValidator>();
```
