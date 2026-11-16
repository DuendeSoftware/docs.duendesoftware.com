---
title: "SAML Logout Session Store"
description: "Reference for ISamlLogoutSessionStore and SamlLogoutSession, which persist state during SAML single logout."
date: 2026-11-16
sidebar:
  label: "SAML Logout Session"
  order: 14
---

#### Duende.IdentityServer.Saml.ISamlLogoutSessionStore

Manages the persistence of SAML logout session tracking state. Implementations track which SPs have been sent `LogoutRequests` and correlate incoming `LogoutResponses` (via `InResponseTo`) to determine whether all SPs successfully logged out. Namespace `Duende.IdentityServer.Saml`, package `Duende.IdentityServer.Storage`.

```csharp
public interface ISamlLogoutSessionStore
{
    Task StoreAsync(SamlLogoutSession session, CancellationToken ct);
    Task<SamlLogoutSession?> GetByLogoutIdAsync(string logoutId, CancellationToken ct);
    Task<bool> TryRecordResponseAsync(string requestId, string issuer, bool success, CancellationToken ct);
    Task RemoveAsync(string logoutId, CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `StoreAsync` | Stores a new logout session. `session` is the session to store and `ct` is the cancellation token. |
| `GetByLogoutIdAsync` | Retrieves a logout session by its logout ID. Returns `null` if not found or expired. `logoutId` is the opaque SAML logout correlation ID, as stored on `SamlLogoutSession.LogoutId`. This is not the protected handle used to reference the `LogoutMessage`. Store implementations may impose their own length or format constraints on this value. |
| `TryRecordResponseAsync` | Records a `LogoutResponse` for a previously stored request. Looks up the session by request ID (secondary index), verifies the issuer matches the expected SP entity ID, and records the response. `requestId` is the `InResponseTo` value from the `LogoutResponse`, `issuer` is the issuer of the `LogoutResponse` (SP entity ID), and `success` is whether the response indicated successful logout. Returns `true` if the response was recorded and `false` if the request ID was not found or the issuer did not match. |
| `RemoveAsync` | Removes a logout session. Idempotent — does not throw if the session does not exist. `logoutId` is the opaque SAML logout correlation ID, as stored on `SamlLogoutSession.LogoutId`. This is not the protected handle used to reference the `LogoutMessage`. |

## SamlLogoutSession

Tracks the state of a SAML logout session, including which SPs are expected to respond and which have already responded.

| Property | Description |
|---|---|
| `LogoutId` | An opaque identifier that correlates this session to the SAML logout flow. This is a server-side correlation ID, distinct from the protected handle used to reference the `LogoutMessage` (e.g. in the logout URL); it is never exposed to or round-tripped through the end user's browser. Store implementations may impose their own length or format constraints. |
| `CreatedUtc` | When this session was created (UTC). |
| `ExpiresAtUtc` | Gets or sets the UTC time at which this session expires. After this time, the session is considered invalid and may be cleaned up. |
| `SkippedSpCount` | The number of SPs that could not be notified (unknown or disabled, no SLO URL, unsupported binding, or request generation failure). The SP that initiated the logout is skipped but not counted. When greater than zero, the best achievable outcome is `PartialLogout`. It's set from `SamlLogoutNotificationResult.SkippedCount`. |
| `ExpectedResponses` | Expected SP logout responses, keyed by the `LogoutRequest` ID sent to each SP. |

`ExpectedResponses` values are `ExpectedSpLogout` instances.

| `ExpectedSpLogout` property | Description |
|---|---|
| `SpEntityId` | The entity ID of the SP that should respond. |
| `Response` | The response received, or `null` if still pending. |

`ExpectedSpLogout` tracks an expected logout response from a specific SP. A received response is a `SamlSpLogoutResponse`, which records the outcome of a single SP's logout response.

| `SamlSpLogoutResponse` property | Description |
|---|---|
| `Success` | Whether the SP reported successful logout. |
| `ReceivedUtc` | When the response was received. |

## Default behavior and lifetime

* `AddIdentityServer()` registers an in-memory store (`InMemorySamlLogoutSessionStore`, the in-memory implementation of `ISamlLogoutSessionStore`) as a singleton.
* The in-memory store holds up to 10,000 sessions, a hard cap on stored sessions to prevent unbounded memory growth (DoS protection). Once it's full, it logs a warning and ignores new sessions. Set `ExpiresAtUtc` when you store a session, otherwise `StoreAsync` throws `ArgumentException`.
* `AddOperationalStore()` registers the EF Core store (`SamlLogoutSessionStore`, transient).
* `SamlOptions.LogoutSessionLifetime` (default 5 minutes) sets the lifetime.
* `TokenCleanupService` removes expired sessions. `IOperationalStoreNotification.SamlLogoutSessionsRemovedAsync` is called after each removed batch.

## Registration

`AddSamlLogoutSessionStore<T>()` registers a custom `ISamlLogoutSessionStore` implementation for persisting SAML logout session tracking state during the single logout flow. Replace the default in-memory store with a durable implementation for production use.

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlLogoutSessionStore<CustomLogoutSessionStore>();
```
