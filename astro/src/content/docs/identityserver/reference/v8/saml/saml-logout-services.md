---
title: "SAML Logout Services"
description: "Reference for the services that take part in SAML single logout: ISamlLogoutNotificationService, ISaml2FrontChannelLogoutRequestBuilder, ISaml2SloResponseGenerator, and ILogoutRequestValidator."
date: 2026-11-16
sidebar:
  label: "SAML Logout Services"
  order: 7
---

Single logout (SLO) involves several extensibility points. `ILogoutRequestValidator` validates a `LogoutRequest` that a service provider (SP) sends to IdentityServer. `ISamlLogoutNotificationService` decides which other SPs to notify, and calls `ISaml2FrontChannelLogoutRequestBuilder` to build one outbound `LogoutRequest` per SP. When all SPs have been handled, `ISaml2SloResponseGenerator` creates the `LogoutResponse` that goes back to the SP that started the logout. The state of the flow is kept in [`ISamlLogoutSessionStore`](/identityserver/reference/v8/saml/saml-logout-session-store.md).

## ILogoutRequestValidator

#### Duende.IdentityServer.Saml.Validation.ILogoutRequestValidator

Validates an incoming SAML `LogoutRequest` early in the SLO pipeline, before other service providers are notified.

```csharp
public interface ILogoutRequestValidator
{
    Task<LogoutRequestValidationResult> ValidateAsync(
        ValidatedLogoutRequest request,
        CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `ValidateAsync` | Validate a `LogoutRequest`. `request` is the `LogoutRequest` validation context and `ct` is the cancellation token. Returns the validation result. |

### LogoutRequestValidationResult

Result of `LogoutRequest` validation

| Member | Description |
|---|---|
| `ValidatedRequest` | The `ValidatedLogoutRequest` the result belongs to. |
| `IsError` | `true` when validation failed. Inherited from `ValidationResult`. `Valid(...)` sets it to `false`. |
| `Error` | Gets or sets the error. For this result, it's the SAML status code of the failure (inherited). |
| `ErrorDescription` | Gets or sets the error description. It's optional for this result (inherited). |
| `SessionFound` | Indicates whether a matching SAML session was found for the requesting SP. When `false`, the IdP should respond with Success without terminating the user's IdP session (per SAML 2.0 Profiles §4.4). |
| `Valid(validatedLogoutRequest)` | Creates a valid validation result |
| `InValid(validatedLogoutRequest, saml2ErrorCode, errorDescription)` | Creates an invalid validation result. `saml2ErrorCode` is the error code (a Saml2 status code) and `errorDescription` is the error description. |

### ValidatedLogoutRequest

Validated `LogoutRequest` context

| Member | Description |
|---|---|
| `LogoutRequest` | The parsed `LogoutRequest` |
| `Binding` | Identifier of binding used to receive the `LogoutRequest` |
| `Saml2Message` | The raw inbound SAML message from the binding layer. Null when the request is reconstructed from stored state (e.g., in the callback endpoint). |
| `RelayState` | The relay state to include in the response. When `Saml2Message` is present, this defaults to `Saml2Message.RelayState`. |
| `Saml2Sp` | The resolved SAML Service Provider |
| `Subject` | The current user |
| `SessionId` | The current session ID |
| `Saml2IdpEntityId` | The SAML entity ID of this IdP |

### Default behavior

`LogoutRequest` validator. The default implementation, `LogoutRequestValidator`, runs the following checks in order and stops at the first error. To customize a check, derive from the class and override its `protected virtual` method. Errors use `SamlStatusCodes.Requester` unless noted.

| Step | Checks |
|---|---|
| `ValidateSpAsync` | Validates the SP from the Issuer entity ID. The request has an issuer, the SP exists and is enabled, and it has at least one single logout URL. |
| `ValidateSignatureTrust` | Validates that the `LogoutRequest` is signed (required per SAML spec). The request signature must be present and trusted. |
| `ValidateVersion` | Validates that the `LogoutRequest` uses SAML version 2.0. Other versions fail with `SamlStatusCodes.VersionMismatch`. |
| `ValidateDestination` | Validates that the Destination matches the SLO endpoint URL. Signed requests must include a Destination per SAML Bindings 2.0. The comparison is case-insensitive. |
| `ValidateNotOnOrAfter` | Validates that the `NotOnOrAfter` has not expired. It's checked when present, allowing for the SP's `ClockSkew` (or `SamlOptions.DefaultClockSkew`). |
| `ValidateSessionAsync` | Validates that the `LogoutRequest`'s NameID and `SessionIndex` match an active SAML session for the requesting SP. Per SAML 2.0 Core §3.7.1, the NameID identifies the principal and the `SessionIndex` identifies the specific session to terminate. This check applies when the user is signed in. The request needs a `NameID` that matches an active SAML session for the SP, and the `SessionIndex` (when present) must match. |

If no user is signed in at IdentityServer, `ValidateSessionAsync` returns a valid result. If a user is signed in but no SAML session exists for the SP, or the `SessionIndex` doesn't match, the result is valid with `SessionFound` set to `false`. In both cases IdentityServer responds with success and leaves the user's session alone, without showing the logout page. The default validator has no replay protection for logout requests.

### Registration

```csharp
builder.Services.AddScoped<ILogoutRequestValidator, CustomLogoutRequestValidator>();
```

`AddSaml()` registers the default validator, so you only need to register your own to replace it.

## ISamlLogoutNotificationService

#### Duende.IdentityServer.Saml.ISamlLogoutNotificationService

Service for building SAML front-channel logout notifications. It builds the front-channel `LogoutRequest` messages IdentityServer sends to SAML service providers when a user logs out.

```csharp
public interface ISamlLogoutNotificationService
{
    Task<SamlLogoutNotificationResult> GetSamlFrontChannelLogoutsAsync(
        LogoutNotificationContext context,
        CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `GetSamlFrontChannelLogoutsAsync` | Builds the SAML messages needed for front-channel logout notification. `context` is the context for the logout notification and `ct` is the cancellation token. Returns the logout request messages that were generated and the number of service providers that were skipped. |

### SamlLogoutNotificationResult

Result of generating SAML front-channel logout notifications.

| Property | Type | Description |
|---|---|---|
| `Messages` | `IReadOnlyCollection<SamlLogoutRequestContext>` | The successfully generated logout request contexts. There is one entry per SP to notify. |
| `SkippedCount` | `int` | The number of SPs that could not be notified. |

### SamlLogoutRequestContext

Encapsulates the result of building a SAML `LogoutRequest`, including the binding-layer message and application-level metadata needed for response correlation. Namespace `Duende.IdentityServer.Saml.Services`.

| Property | Type | Description |
|---|---|---|
| `Message` | `OutboundSaml2Message` | The binding-layer message ready to be sent to the SP. |
| `RequestId` | `string` | The SAML request ID (from the `ID` attribute) for correlating responses via `InResponseTo`. |
| `SpEntityId` | `string` | The entity ID of the SP this request is destined for. |

### Default behavior

Default implementation of `ISamlLogoutNotificationService` that uses the new `ISaml2FrontChannelLogoutRequestBuilder` to build outbound `LogoutRequest` messages. The default implementation, `Saml2LogoutNotificationService`, builds a request for each SP session using [`ISaml2FrontChannelLogoutRequestBuilder`](#isaml2frontchannellogoutrequestbuilder). It skips the initiating SP, SPs that are unknown or disabled, SPs without a single logout URL or without an HTTP-Redirect logout endpoint, and SPs for which building the request fails. Skipped SPs are counted in `SkippedCount`. Outbound logout requests support only HTTP-Redirect.

### Registration

`AddSaml()` replaces any registration made before it, so register your implementation after `AddSaml()`:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml();

builder.Services.AddScoped<ISamlLogoutNotificationService, CustomSamlLogoutNotificationService>();
```

## ISaml2FrontChannelLogoutRequestBuilder

#### Duende.IdentityServer.Saml.Services.ISaml2FrontChannelLogoutRequestBuilder

Builds outbound SAML 2.0 `LogoutRequest` messages for front-channel logout notifications. It builds the outbound `LogoutRequest` for one service provider and is called once per SP by the [logout notification service](#isamllogoutnotificationservice).

```csharp
public interface ISaml2FrontChannelLogoutRequestBuilder
{
    Task<SamlLogoutRequestContext> BuildLogoutRequestAsync(
        SamlServiceProvider serviceProvider,
        string nameId,
        string? nameIdFormat,
        string sessionIndex,
        string issuer,
        CancellationToken ct);
}
```

| Parameter | Description |
|---|---|
| `serviceProvider` | The SP to notify. |
| `nameId` | The NameID value for the subject being logged out. |
| `nameIdFormat` | Optional NameID format URI. |
| `sessionIndex` | The session index to include in the request. |
| `issuer` | The IdP entity ID (issuer). |
| `ct` | Cancellation token. |

`BuildLogoutRequestAsync` builds a front-channel logout request for the given service provider. It returns a `SamlLogoutRequestContext` containing the message and correlation metadata.

### Default behavior

The default builder, `Saml2FrontChannelLogoutRequestBuilder`, signs requests with the certificate from [`ISamlSigningService`](/identityserver/reference/v8/saml/saml-signing-service.md) and sends them using HTTP-Redirect. It throws `InvalidOperationException` if the SP has no single logout URL or no HTTP-Redirect logout endpoint.

### Registration

```csharp
builder.Services.AddScoped<ISaml2FrontChannelLogoutRequestBuilder, CustomLogoutRequestBuilder>();
```

## ISaml2SloResponseGenerator

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2SloResponseGenerator

Response generator for SAML 2.0 Single Logout. It creates the `LogoutResponse` returned to the service provider that initiated single logout.

```csharp
public interface ISaml2SloResponseGenerator
{
    Task<Saml2FrontChannelResult> CreateSuccessResponse(
        ValidatedLogoutRequest request,
        CancellationToken ct);

    Task<Saml2FrontChannelResult> CreatePartialLogoutResponse(
        ValidatedLogoutRequest request,
        CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `CreateSuccessResponse` | Create a success `LogoutResponse` for a validated `LogoutRequest`. `request` is the validated logout request context and `ct` is the cancellation token. Returns the Saml2 front channel result containing the `LogoutResponse`. |
| `CreatePartialLogoutResponse` | Create a partial logout `LogoutResponse` indicating not all SPs successfully logged out. It reports a partial logout (`SamlStatusCodes.PartialLogout`). `request` is the validated logout request context and `ct` is the cancellation token. Returns the Saml2 front channel result containing the `LogoutResponse` with partial logout status. |

`Saml2FrontChannelResult` (namespace `Duende.IdentityServer.Saml.Endpoints.Results`) is the result from a Saml2 endpoint that wraps a Saml2 message and should be handled by a front channel binding.

| Property | Description |
|---|---|
| `Message` | Contained Saml2 Message. It's the `OutboundSaml2Message`. |
| `Error` | Error message if this result is an error. When it's set, IdentityServer redirects to the error page instead of sending `Message`. |
| `SpEntityId` | Entity Id of Sp as received in incoming message, may not be validated. |
| `GeneratedNameId` | The NameID that was generated for the subject in this response. Null when the result is an error. |

### Default behavior

Both methods create a `LogoutResponse`, set `InResponseTo` to the request ID, use the IdP entity ID from [`ISaml2IssuerNameService`](/identityserver/reference/v8/saml/saml-metadata-services.md#isaml2issuernameservice) as the issuer, and sign the response with the certificate from [`ISamlSigningService`](/identityserver/reference/v8/saml/saml-signing-service.md). The destination is the SP's HTTP-Redirect single logout URL, falling back to the request's issuer. If neither is available, they throw `InvalidOperationException`. `CreateSuccessResponse` uses the status `SamlStatusCodes.Success`. `CreatePartialLogoutResponse` uses `SamlStatusCodes.Success` with a nested `SamlStatusCodes.PartialLogout` status. The response's `RelayState` and binding are copied from the request.

IdentityServer calls `CreateSuccessResponse` only when every notified SP responded with success and `SkippedSpCount` of the logout session is `0`. In all other cases, including when the logout session can't be found, it calls `CreatePartialLogoutResponse`. The logout session is removed afterward.

The interface controls response generation only. Logout state is stored by [`ISamlLogoutSessionStore`](/identityserver/reference/v8/saml/saml-logout-session-store.md).

### Registration

```csharp
builder.Services.AddScoped<ISaml2SloResponseGenerator, CustomSloResponseGenerator>();
```

`AddIdentityServer()` registers the default `Saml2SloResponseGenerator`, so you only need to register your own if you want to replace it. To customize both response methods at once, derive from the default class and override their shared `CreateResponseAsync(ValidatedLogoutRequest, string statusCode, string? subStatusCode, string? statusMessage, CancellationToken)` method, which builds a `LogoutResponse` and wraps it in a `Saml2FrontChannelResult`.
