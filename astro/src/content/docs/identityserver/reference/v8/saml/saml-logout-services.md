---
title: "SAML Logout Services"
description: "Reference for the services that take part in SAML single logout: ISamlLogoutNotificationService, ISaml2FrontChannelLogoutRequestBuilder, ISaml2SloResponseGenerator, and ILogoutRequestValidator."
date: 2026-11-16
sidebar:
  label: "SAML Logout Services"
  order: 7
---

Four extensibility points take part in a single logout (SLO) flow. `ILogoutRequestValidator` validates a `LogoutRequest` that a service provider (SP) sends to IdentityServer. `ISamlLogoutNotificationService` decides which other SPs to notify, and calls `ISaml2FrontChannelLogoutRequestBuilder` to build one outbound `LogoutRequest` per SP. When all SPs have been handled, `ISaml2SloResponseGenerator` creates the `LogoutResponse` that goes back to the SP that started the logout. The state of the flow is kept in [`ISamlLogoutSessionStore`](/identityserver/reference/v8/saml/saml-logout-session-store.md).

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

### LogoutRequestValidationResult

| Member | Description |
|---|---|
| `ValidatedRequest` | The `ValidatedLogoutRequest` the result belongs to. |
| `IsError` | `true` when validation failed. Inherited from `ValidationResult`; `Valid(...)` sets it to `false`. |
| `Error` | The SAML status code of the failure (inherited). |
| `ErrorDescription` | The optional description of the failure (inherited). |
| `SessionFound` | Indicates whether a session was found. |
| `Valid(request)` | Creates a valid result. |
| `InValid(request, saml2ErrorCode, errorDescription)` | Creates an invalid result with a SAML status code. |

### ValidatedLogoutRequest

Members: `LogoutRequest`, `Binding`, `RelayState`, `Saml2Sp`, `Subject`, `SessionId`, `Saml2IdpEntityId`.

### Default behavior

The default implementation, `LogoutRequestValidator`, is a public class with `protected virtual` steps. It runs them in this order and stops at the first error. Errors use `SamlStatusCodes.Requester` unless noted.

| Step | Checks |
|---|---|
| `ValidateSpAsync` | The request has an issuer, the SP exists and is enabled, and it has at least one single logout URL. |
| `ValidateSignatureTrust` | The request signature is present and trusted. |
| `ValidateVersion` | The version is 2.0 (`SamlStatusCodes.VersionMismatch` otherwise). |
| `ValidateDestination` | A signed request has a `Destination`, and it matches the single logout endpoint URL (case-insensitive). |
| `ValidateNotOnOrAfter` | When `NotOnOrAfter` is present, it hasn't expired, allowing for the SP's `ClockSkew` (or `SamlOptions.DefaultClockSkew`). |
| `ValidateSessionAsync` | When the user is signed in, the request has a `NameID` that matches an active SAML session for the SP, and the `SessionIndex` (when present) matches. |

If no user is signed in, no SAML session exists for the SP, or the `SessionIndex` doesn't match, the result is valid with `SessionFound` set to `false`. IdentityServer then responds with success without ending the user's session. The default doesn't do replay protection for logout requests.

### Registration

```csharp
builder.Services.AddScoped<ILogoutRequestValidator, CustomLogoutRequestValidator>();
```

The default is registered by `AddSaml()` with `TryAddTransient`.

## ISamlLogoutNotificationService

#### Duende.IdentityServer.Saml.ISamlLogoutNotificationService

Builds the front-channel `LogoutRequest` messages IdentityServer sends to SAML service providers when a user logs out.

```csharp
public interface ISamlLogoutNotificationService
{
    Task<SamlLogoutNotificationResult> GetSamlFrontChannelLogoutsAsync(
        LogoutNotificationContext context,
        CancellationToken ct);
}
```

### SamlLogoutNotificationResult

| Property | Type | Description |
|---|---|---|
| `Messages` | `IReadOnlyCollection<SamlLogoutRequestContext>` | One entry per SP to notify. |
| `SkippedCount` | `int` | The number of SPs that couldn't be notified. |

### SamlLogoutRequestContext

Namespace `Duende.IdentityServer.Saml.Services`.

| Property | Type | Description |
|---|---|---|
| `Message` | `OutboundSaml2Message` | The outbound message. |
| `RequestId` | `string` | The `ID` of the `LogoutRequest`. The SP's `LogoutResponse` references it in `InResponseTo`. |
| `SpEntityId` | `string` | The entity ID of the destination SP. |

### Default behavior

The default implementation, `Saml2LogoutNotificationService`, is sealed. It builds a request for each SP session using [`ISaml2FrontChannelLogoutRequestBuilder`](#isaml2frontchannellogoutrequestbuilder). It skips, and counts in `SkippedCount`, the initiating SP, SPs that are unknown or disabled, SPs without a single logout URL or without an HTTP-Redirect logout endpoint, and SPs for which building the request fails. Only HTTP-Redirect is supported for outbound logout requests.

### Registration

`AddSaml()` registers this service with `Replace`, so a registration made before `AddSaml()` is overwritten. Register your implementation after `AddSaml()`:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml();

builder.Services.AddScoped<ISamlLogoutNotificationService, CustomSamlLogoutNotificationService>();
```

## ISaml2FrontChannelLogoutRequestBuilder

#### Duende.IdentityServer.Saml.Services.ISaml2FrontChannelLogoutRequestBuilder

Builds the outbound `LogoutRequest` for one service provider. It is called once per SP by the [logout notification service](#isamllogoutnotificationservice).

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

The returned `SamlLogoutRequestContext` carries the outbound message, the request ID, and the SP entity ID used to correlate the SP's response.

### Default behavior

The default implementation (`Saml2FrontChannelLogoutRequestBuilder`) is a public sealed class. It signs the request with the certificate from [`ISamlSigningService`](/identityserver/reference/v8/saml/saml-signing-service.md) and uses the HTTP-Redirect binding. It throws `InvalidOperationException` if the SP has no single logout URL or no HTTP-Redirect logout endpoint.

### Registration

```csharp
builder.Services.AddScoped<ISaml2FrontChannelLogoutRequestBuilder, CustomLogoutRequestBuilder>();
```

## ISaml2SloResponseGenerator

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2SloResponseGenerator

Creates the `LogoutResponse` returned to the service provider that initiated single logout.

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

`Saml2FrontChannelResult` (namespace `Duende.IdentityServer.Saml.Endpoints.Results`) has these properties: `Message` (the `OutboundSaml2Message`), `Error`, `SpEntityId`, and `GeneratedNameId`. When `Error` is set, IdentityServer redirects to the error page instead of sending `Message`.

| Method | Description |
|---|---|
| `CreateSuccessResponse` | Creates a success `LogoutResponse`. |
| `CreatePartialLogoutResponse` | Creates a `LogoutResponse` that reports a partial logout (`SamlStatusCodes.PartialLogout`). |

### Default behavior

Both methods build a `LogoutResponse` with `InResponseTo` set to the request ID, the IdP entity ID from [`ISaml2IssuerNameService`](/identityserver/reference/v8/saml/saml-metadata-services.md#isaml2issuernameservice) as issuer, and sign it with the certificate from [`ISamlSigningService`](/identityserver/reference/v8/saml/saml-signing-service.md). The destination is the SP's HTTP-Redirect single logout URL, falling back to the request's issuer; the method throws `InvalidOperationException` if neither is available. `CreateSuccessResponse` uses the status `SamlStatusCodes.Success`. `CreatePartialLogoutResponse` uses `SamlStatusCodes.Success` with a nested `SamlStatusCodes.PartialLogout` status. The response's `RelayState` and binding are copied from the request.

IdentityServer calls `CreateSuccessResponse` only when every notified SP responded with success and `SkippedSpCount` of the logout session is `0`. In all other cases, including when the logout session can't be found, it calls `CreatePartialLogoutResponse`. The logout session is removed afterward.

The interface controls response generation only. Logout state is stored by [`ISamlLogoutSessionStore`](/identityserver/reference/v8/saml/saml-logout-session-store.md).

### Registration

```csharp
builder.Services.AddScoped<ISaml2SloResponseGenerator, CustomSloResponseGenerator>();
```

The default (`Saml2SloResponseGenerator`) is a public, non-sealed class registered by IdentityServer core (not by `AddSaml()`) with `TryAdd`.
