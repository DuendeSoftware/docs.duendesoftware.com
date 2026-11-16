---
title: "SAML Logout Session Store"
description: "Reference for ISamlLogoutSessionStore and SamlLogoutSession, which persist state during SAML single logout."
date: 2026-11-16
sidebar:
  label: "SAML Logout Session"
  order: 14
---

#### Duende.IdentityServer.Saml.ISamlLogoutSessionStore

Persists single logout (SLO) state: which service providers (SPs) are expected to respond, and the responses as they arrive. Namespace `Duende.IdentityServer.Saml`, package `Duende.IdentityServer.Storage`.

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
| `StoreAsync` | Stores a new session. |
| `GetByLogoutIdAsync` | Returns the session, or `null` if it's not found or expired. |
| `TryRecordResponseAsync` | Records a `LogoutResponse` by request ID (`InResponseTo`). Returns `false` if the request ID isn't found or the issuer doesn't match. |
| `RemoveAsync` | Removes a session. It doesn't throw if the session doesn't exist. |

## SamlLogoutSession

| Property | Description |
|---|---|
| `LogoutId` | The logout identifier. |
| `CreatedUtc` | Creation time. |
| `ExpiresAtUtc` | `DateTime`. Entries past this time are expired. |
| `SkippedSpCount` | `int`. The number of SPs that couldn't be notified, set from `SamlLogoutNotificationResult.SkippedCount`. |
| `ExpectedResponses` | `Dictionary<string, ExpectedSpLogout>`, keyed by outbound `LogoutRequest` ID. |

`ExpectedSpLogout(SpEntityId, SamlSpLogoutResponse?)` holds the SP's entity ID and, once the SP responds, a `SamlSpLogoutResponse(Success, ReceivedUtc)`.

## Default behavior and lifetime

* `AddIdentityServer()` registers an in-memory store as a singleton.
* `AddOperationalStore()` registers the EF Core store (`SamlLogoutSessionStore`, transient).
* `SamlOptions.LogoutSessionLifetime` (default 5 minutes) sets the lifetime.
* `TokenCleanupService` removes expired sessions. `IOperationalStoreNotification.SamlLogoutSessionsRemovedAsync` is called after each removed batch.

## Registration

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlLogoutSessionStore<CustomLogoutSessionStore>();
```
