---
title: "Duende.Storage Operational Storage"
description: "Configure the preview Duende.Storage provider for IdentityServer grants, sessions, keys, and runtime state"
date: 2026-09-01
sidebar:
  label: "Operational Storage"
  order: 20
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende.Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

Operational storage holds short-lived and security-sensitive state generated while IdentityServer processes protocol
requests. This includes persisted grants, device codes, pushed authorization requests, server-side sessions, signing
keys, and SAML request state.

## Register Operational Storage

First register a database provider as shown in
[Configuration Storage](/identityserver/data/providers/duende-storage/configuration-storage.md#register-the-provider-and-stores).
Then add the operational adapters:

```csharp
// Program.cs
using Duende.IdentityServer.Configuration;

builder.Services.Configure<StoragePurgeOptions>(options =>
{
    options.PurgeInterval = TimeSpan.FromMinutes(30);
    options.BatchSize = 200;
});

builder.Services
    .AddIdentityServer()
    .AddOperationalStorage();
```

`AddOperationalStorage` registers implementations of:

- `IPersistedGrantStore`
- `IDeviceFlowStore`
- `IPushedAuthorizationRequestStore`
- `IServerSideSessionStore`
- `ISigningKeyStore`
- `ISamlSigninStateStore`
- `ISamlLogoutSessionStore`

Call [`AddServerSideSessions`](/identityserver/ui/server-side-sessions/index.md) separately when you want IdentityServer to
use server-side sessions.

The provider also adds a background purge service. Purging is enabled by default, runs hourly, deletes `100` expired
entities per batch, and fuzzes its initial start time to reduce collisions between nodes. Configure `StoragePurgeOptions`
to tune those values, or set `EnablePurge` to `false` when an external job owns cleanup.

## Use Configuration And Operational Storage Together

Both adapters can share one database provider:

```csharp
// Program.cs
var identityServer = builder.Services
    .AddIdentityServer()
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

Run the `IDatabaseSchema` migration described in the
[configuration setup](/identityserver/data/providers/duende-storage/configuration-storage.md#register-the-provider-and-stores)
before the application starts serving requests.

Operational records contain tokens, grants, session data, and signing material. Restrict database access, encrypt
connections and backups, and avoid logging stored payloads or secrets.
