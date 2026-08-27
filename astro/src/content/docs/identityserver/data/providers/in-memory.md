---
title: "In-Memory Stores"
description: "Documentation for using in-memory stores with IdentityServer for development, testing, and simple production scenarios"
sidebar:
  label: "In-Memory"
  order: 80
---

In-memory stores keep all IdentityServer data in the application's memory. They require no database setup, making them ideal for development, testing, and simple scenarios. They are not suitable for production deployments with multiple server instances, because data is not shared across instances and is lost when the application restarts.

## Configuration Data

The in-memory configuration APIs allow you to configure IdentityServer from in-memory lists of configuration objects. These collections can be hard-coded in the hosting application, or loaded dynamically from a configuration file or a database at startup.

Use these APIs when prototyping, developing, or testing where it is not necessary to consult a database at runtime for configuration data. This style of configuration may also be appropriate for production scenarios where configuration rarely changes, or where restarting the application when configuration changes is acceptable.

Register in-memory configuration stores using the builder extension methods in `Program.cs`:

```csharp
builder.Services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryApiResources(Config.ApiResources);
```

If you use [SAML](/identityserver/saml/index.mdx), `AddInMemorySamlServiceProviders` registers [SAML Service Provider](/identityserver/saml/service-providers.md) configuration the same way:

```csharp
builder.Services.AddIdentityServer()
    .AddInMemorySamlServiceProviders(Config.SamlServiceProviders);
```

See [Configuration Data](/identityserver/data/configuration.mdx) for the full details of what configuration data models and what each store is responsible for.

## Operational Data

For operational data (tokens, authorization codes, user consent, refresh tokens), IdentityServer includes `InMemoryPersistedGrantStore`. This implementation persists grants in memory and is intended for demos, tests, and other situations where durable storage is not required.

`InMemoryPersistedGrantStore` is registered automatically when no other `IPersistedGrantStore` is configured. You can register it explicitly:

```csharp
builder.Services.AddIdentityServer()
    .AddInMemoryPersistedGrants();
```

If you use [Pushed Authorization Requests (PAR)](/identityserver/tokens/par.md), `AddInMemoryPushedAuthorizationRequests` provides an in-memory `IPushedAuthorizationRequestStore`:

```csharp
builder.Services.AddIdentityServer()
    .AddInMemoryPushedAuthorizationRequests();
```

See the [Persisted Grant Store reference](/identityserver/reference/v8/stores/persisted-grant-store.md) for the full `IPersistedGrantStore` interface documentation and the available implementations.

See [Operational Data](/identityserver/data/operational.md) for the full details of what operational data models and what each store is responsible for.

## Limitations

- **Not durable**: All data is lost when the application restarts.
- **Not shared**: Each application instance has its own isolated copy of the data; unsuitable for multi-node or load-balanced deployments.
- **Not for production operational data**: Tokens and grants in production should be stored durably. Use the [Entity Framework Core](/identityserver/data/providers/entityframework-core.md) provider or a [custom implementation](/identityserver/data/providers/custom.md) instead.
