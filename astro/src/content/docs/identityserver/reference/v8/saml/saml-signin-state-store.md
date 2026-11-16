---
title: "SAML Sign-in State Store"
description: "Reference for ISamlSigninStateStore, ISamlSigninStateSerializer, and SamlAuthenticationState, which persist SAML sign-in request state."
date: 2026-11-16
sidebar:
  label: "SAML Sign-in State"
  order: 13
---

#### Duende.IdentityServer.Saml.ISamlSigninStateStore

Persists SAML sign-in request state between the initial SSO request and the callback after the user authenticates. Namespace `Duende.IdentityServer.Saml`, package `Duende.IdentityServer.Storage`.

```csharp
public interface ISamlSigninStateStore
{
    Task<Guid> StoreSigninRequestStateAsync(SamlAuthenticationState state, CancellationToken ct = default);
    Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default);
    Task UpdateSigninRequestStateAsync(Guid stateId, SamlAuthenticationState state, CancellationToken ct = default);
    Task RemoveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default);
}
```

## SamlAuthenticationState

| Property | Description |
|---|---|
| `AuthnRequestData` | The `StoredAuthnRequestData`: `RequestId`, `ForceAuthn`, `IsPassive`, `NameIdPolicyFormat`, `SubjectNameIdValue`, `IdpHintProviderId`, `RequestedAuthnContext`. |
| `ServiceProviderEntityId` | The SP entity ID. |
| `RelayState` | The relay state. |
| `IsIdpInitiated` | Whether the flow is IdP-initiated. |
| `AssertionConsumerService` | The ACS endpoint. |
| `RequestedClaimTypes` | The requested claim types. |
| `CreatedUtc` | `DateTimeOffset`. |
| `ExpiresAtUtc` | `DateTime`. Controls when the entry is eligible for cleanup. |
| `DenialError`, `DenialErrorDescription` | Set when the login UI denies the request with `DenyAuthenticationAsync`. |

`StoredRequestedAuthnContext` has `Comparison` (`string`), `AuthnContextClassRef` (`List<string>`), and `AuthnContextDeclRef` (`List<string>`).

## ISamlSigninStateSerializer

```csharp
public interface ISamlSigninStateSerializer
{
    string Serialize(SamlAuthenticationState state);
    SamlAuthenticationState? Deserialize(string serializedState);
}
```

`Deserialize` returns `null` when the input isn't valid. The default, `DefaultSamlSigninStateSerializer` in `Duende.IdentityServer.EntityFramework`, uses `System.Text.Json` and is registered by `AddOperationalStore()`. The core package registers no serializer.

## Default behavior and lifetime

* `AddSaml()` registers an in-memory store as a singleton, which isn't shared across instances and loses state on restart.
* `AddOperationalStore()` registers the EF Core store (`SamlSigninStateStore`, transient).
* `SamlOptions.SigninStateLifetime` (default 15 minutes) sets `ExpiresAtUtc`.
* `TokenCleanupService` removes expired entries from the EF store. `IOperationalStoreNotification.SamlSigninStatesRemovedAsync` is called after each removed batch.

## Registration

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlSigninStateStore<CustomSigninStateStore>();
```

Registering `ISamlSigninStateStore` directly with `AddScoped` before `AddSaml()` also works, because the default is added with `TryAdd`.
