---
title: Stores
description: An overview of IdentityServer's persistence layer abstractions that manage configuration and operational data for authentication and authorization processes.
date: 2020-09-10T08:20:20+02:00
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /identityserver/v5/reference/stores/
  - /identityserver/v6/reference/stores/
  - /identityserver/reference/stores/
---

Stores in IdentityServer are the persistence layer abstractions responsible for managing various types of data needed
for the authentication and authorization processes. They provide interfaces to store and retrieve configuration and
operational data.

## Configuration Stores

Configuration stores manage the relatively static data that defines how IdentityServer behaves:

| Store | Purpose |
|-------|---------|
| [IClientStore](/identityserver/reference/v8/stores/client-store.md) | Client application registrations |
| [IResourceStore](/identityserver/reference/v8/stores/resource-store.md) | API resources, API scopes, and identity resources |
| [IIdentityProviderStore](/identityserver/reference/v8/stores/idp-store.md) | Dynamic external identity providers |
| [ICorsPolicyService](/identityserver/reference/v8/stores/cors-policy-service.md) | CORS origin validation for clients |

## Operational Stores

Operational stores manage transient, runtime data that supports active authentication flows:

| Store | Purpose |
|-------|---------|
| [IPersistedGrantStore](/identityserver/reference/v8/stores/persisted-grant-store.md) | Authorization codes, refresh tokens, reference tokens, and user consent |
| [IDeviceFlowStore](/identityserver/reference/v8/stores/device-flow-store.md) | Device authorization grant data |
| [IBackChannelAuthenticationRequestStore](/identityserver/reference/v8/stores/backchannel-auth-request-store.md) | CIBA authentication requests |
| [IPushedAuthorizationRequestStore](/identityserver/reference/v8/stores/pushed-authorization-request-store.md) | Pushed Authorization Requests (PAR) |
| [IServerSideSessionStore](/identityserver/reference/v8/stores/server-side-sessions.md) | Server-side user sessions |
| [ISigningKeyStore](/identityserver/reference/v8/stores/signing-key-store.md) | Automatic key management signing keys |

## Key Management Stores

These stores provide signing and validation keys to the runtime:

| Store | Purpose |
|-------|---------|
| `ISigningCredentialStore` | Provides the active signing credential for token signing |
| `IValidationKeysStore` | Provides all public keys for token validation (published via JWKS) |

## In-Memory Implementations

IdentityServer provides default in-memory implementations suitable for development and testing. These are registered via the DI extension methods:

```csharp
builder.Services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryIdentityResources(Config.IdentityResources);
```

For production environments, use the [Entity Framework Core integration](/identityserver/data/ef.md) or implement custom stores using your preferred database technology.
