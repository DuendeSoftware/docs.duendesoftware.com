---
title: "SAML Sign-in State Store"
description: "Reference for ISamlSigninStateStore, ISamlSigninStateSerializer, and SamlAuthenticationState, which persist SAML sign-in request state."
date: 2026-11-16
sidebar:
  label: "SAML Sign-in State"
  order: 13
---

#### Duende.IdentityServer.Saml.ISamlSigninStateStore

Manages the persistence of SAML signin request state. It persists the state between the initial SSO request and the callback after the user authenticates.

State lifecycle is primarily managed through TTL-based expiry configured on the store implementation. The callback endpoint intentionally retains state after a successful response to allow retries (e.g., browser reload if the response doesn't reach the SP). Explicit removal via `RemoveSigninRequestStateAsync` is available for scenarios that require immediate cleanup but is not called in the default flow.

Namespace `Duende.IdentityServer.Saml`, package `Duende.IdentityServer.Storage`.

```csharp
public interface ISamlSigninStateStore
{
    Task<Guid> StoreSigninRequestStateAsync(SamlAuthenticationState state, CancellationToken ct = default);
    Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default);
    Task UpdateSigninRequestStateAsync(Guid stateId, SamlAuthenticationState state, CancellationToken ct = default);
    Task RemoveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default);
}
```

| Method | Description |
|---|---|
| `StoreSigninRequestStateAsync` | Stores SAML signin request state and returns a unique identifier for later retrieval. |
| `RetrieveSigninRequestStateAsync` | Retrieves stored SAML signin request state without removing it. Returns `null` if not found or expired. |
| `UpdateSigninRequestStateAsync` | Updates previously stored SAML signin request state in place. The state entry identified by `stateId` must already exist. Used to write denial information back to the state so the callback endpoint can generate an error response. |
| `RemoveSigninRequestStateAsync` | Removes previously stored SAML signin request state. Idempotent — does not throw if the state has already been removed or does not exist. This method is not called in the default callback flow, which relies on TTL-based expiry. It is provided for custom implementations that need immediate cleanup. |

## SamlAuthenticationState

Represents the stored context for a SAML authentication flow.

| Property | Description |
|---|---|
| `AuthnRequestData` | Gets or sets the stored `AuthnRequest` data. Will be null for IdP-initiated SSO flows. It's a `StoredAuthnRequestData`, described below. |
| `ServiceProviderEntityId` | Gets or sets the entity ID of the service provider that initiated the request. |
| `RelayState` | Gets or sets the `RelayState` parameter from the original request. For IdP-initiated SSO, this typically contains the target URL at the SP. |
| `IsIdpInitiated` | Gets or sets a value indicating whether this is an IdP-initiated SSO flow. If true, there was no `AuthnRequest` and the response will be unsolicited. |
| `AssertionConsumerService` | Gets or sets the assertion consumer service endpoint where the SAML response will be sent. |
| `RequestedClaimTypes` | Gets or sets the claim types to include in the SAML assertion. Determined during validation from the SP's `AllowedScopes` and `RequestedClaimTypes` configuration. |
| `CreatedUtc` | Gets or sets the timestamp when this context was created. |
| `ExpiresAtUtc` | Gets or sets the UTC time at which this state entry expires. After this time, the state is considered invalid and may be cleaned up. The in-memory store throws `ArgumentException` if it isn't set. |
| `DenialError` | Gets or sets the interaction error when the user has denied or cancelled authentication. When set, the callback endpoint will generate a SAML error response instead of an assertion. It's set when the login UI denies the request with `DenyAuthenticationAsync`. |
| `DenialErrorDescription` | Gets or sets an optional human-readable description of the denial error. |

`StoredAuthnRequestData` is a flat representation of the relevant fields from an `AuthnRequest`, suitable for storage. Only the fields consumed after the login redirect are preserved here. The full `AuthnRequest` remains available on the SSO endpoint path via `ValidatedAuthnRequest.AuthnRequest`.

| `StoredAuthnRequestData` property | Description |
|---|---|
| `RequestId` | The original request ID (used for `InResponseTo`). |
| `ForceAuthn` | Whether force re-authentication was requested. |
| `IsPassive` | Whether passive authentication was requested. |
| `NameIdPolicyFormat` | The `NameIdPolicy` Format from the original request. |
| `SubjectNameIdValue` | The Subject NameID value (login hint). |
| `IdpHintProviderId` | The IdP hint provider ID extracted from `Scoping`/`IDPList`. Only populated when the `IDPList` contains exactly one entry. |
| `RequestedAuthnContext` | The requested authentication context, if present. |

`StoredRequestedAuthnContext` is a flat representation of a `RequestedAuthnContext` suitable for storage.

| `StoredRequestedAuthnContext` property | Description |
|---|---|
| `Comparison` | The comparison method (exact, minimum, maximum, better). Null if not specified. |
| `AuthnContextClassRef` | Authentication context class references. |
| `AuthnContextDeclRef` | Authentication context declaration references. |

## ISamlSigninStateSerializer

```csharp
public interface ISamlSigninStateSerializer
{
    string Serialize(SamlAuthenticationState state);
    SamlAuthenticationState? Deserialize(string serializedState);
}
```

Handles serialization and deserialization of `SamlAuthenticationState` for Entity Framework storage. Replace the default implementation to customize how SAML authentication state is persisted (for example, to change the serialization format). `Serialize` serializes a `SamlAuthenticationState` to a string for storage and returns the serialized string representation. `Deserialize` deserializes a `SamlAuthenticationState` from its stored string representation and returns the deserialized SAML authentication state, or `null` if deserialization fails. The default, `DefaultSamlSigninStateSerializer` (a sealed class in the `Duende.IdentityServer.EntityFramework.Mappers` namespace), uses System.Text.Json for serializing `SamlAuthenticationState`. No custom converters are needed because the state graph contains only simple types that System.Text.Json handles natively. It is registered by `AddOperationalStore()`. The core package registers no serializer.

## Default behavior and lifetime

* `AddSaml()` registers an in-memory store (`InMemorySamlSigninStateStore`, the in-memory implementation of `ISamlSigninStateStore`) as a singleton, which loses its state on restart and isn't shared across instances.
* `AddOperationalStore()` registers the EF Core store (`SamlSigninStateStore`, transient).
* `SamlOptions.SigninStateLifetime` (default 15 minutes) sets `ExpiresAtUtc`.
* `TokenCleanupService` removes expired entries from the EF store. `IOperationalStoreNotification.SamlSigninStatesRemovedAsync` is called after each removed batch.

## Registration

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlSigninStateStore<CustomSigninStateStore>();
```

You can also register `ISamlSigninStateStore` directly with `AddScoped` before `AddSaml()`.
