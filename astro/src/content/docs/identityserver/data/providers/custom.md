---
title: "Custom Store Implementation"
description: "Guide to implementing custom store interfaces in Duende IdentityServer to use any database or storage backend"
sidebar:
  label: "Custom"
  order: 90
---

IdentityServer abstracts all data access behind store interfaces. You can implement any of these interfaces yourself to use any database, storage backend, or data access technology, rather than being limited to the built-in [Entity Framework Core](/identityserver/data/providers/entityframework-core.md) or [in-memory](/identityserver/data/providers/in-memory.md) providers.

Register your custom store implementations in `Program.cs` using the standard ASP.NET Core DI methods or the IdentityServer builder extension methods.

## Configuration Stores

These interfaces back [configuration data](/identityserver/data/configuration.mdx): the clients, resources, and identity providers that define what your IdentityServer instance supports.

| Interface                    | Responsibility                                                                                                     |
|------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `IClientStore`               | Retrieve client configuration                                                                                      |
| `IResourceStore`             | Retrieve identity resources, API resources, and API scopes                                                         |
| `IIdentityProviderStore`     | Retrieve dynamic external identity providers                                                                       |
| `ICorsPolicyService`         | Determine allowed CORS origins                                                                                     |
| `IConnectedApplicationStore` | Read-only unified access to all registered applications across protocols (OIDC clients and SAML service providers) |
| `ISamlServiceProviderStore`  | Retrieve [SAML Service Provider](/identityserver/saml/service-providers.md) configuration by entity ID                |

Register custom configuration stores with the IdentityServer builder:

```csharp
builder.Services.AddIdentityServer()
    .AddClientStore<MyClientStore>()
    .AddResourceStore<MyResourceStore>()
    .AddIdentityProviderStore<MyIdentityProviderStore>();
```

See the [stores reference](/identityserver/reference/v8/stores/index.md) for the full interface contracts.

## Operational Stores

These interfaces back [operational data](/identityserver/data/operational.md): the runtime state that IdentityServer generates and consumes during authentication flows.

There are quite a few operational store interfaces in the `Duende.IdentityServer.Stores` namespace. The most commonly implemented ones are listed below, but explore the namespace (or the [stores reference](/identityserver/reference/v8/stores/index.md)) for the full set. Note that several higher-level interfaces (`IAuthorizationCodeStore`, `IRefreshTokenStore`, `IReferenceTokenStore`, `IUserConsentStore`) are backed by `IPersistedGrantStore` by default. Replacing `IPersistedGrantStore` is usually sufficient, but you can also replace the higher-level interfaces individually if you need finer-grained control.

| Interface                                | Responsibility                                                                             |
|------------------------------------------|--------------------------------------------------------------------------------------------|
| `IPersistedGrantStore`                   | Store and retrieve authorization codes, refresh tokens, user consent, and reference tokens |
| `ISigningKeyStore`                       | Persist automatically managed signing keys                                                 |
| `IServerSideSessionStore`                | Store server-side user sessions                                                            |
| `IDeviceFlowStore`                       | Store device authorization grant data                                                      |
| `IBackChannelAuthenticationRequestStore` | Store CIBA authentication requests                                                         |
| `IPushedAuthorizationRequestStore`       | Store Pushed Authorization Requests (PAR)                                                  |

Register custom operational stores with the IdentityServer builder:

```csharp
builder.Services.AddIdentityServer()
    .AddPersistedGrantStore<MyPersistedGrantStore>()
    .AddSigningKeyStore<MySigningKeyStore>()
    .AddServerSideSessionStore<MyServerSideSessionStore>();
```

See the [stores reference](/identityserver/reference/v8/stores/index.md) for the full interface contracts, and the [DI reference](/identityserver/reference/v8/di.md) for all available builder extension methods.
