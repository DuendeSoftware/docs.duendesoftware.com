---
title: "Duende Storage Operational Storage"
description: "Persist IdentityServer grants, device codes, server-side sessions and signing keys with the Duende Storage operational provider"
date: 2026-09-01
sidebar:
  label: "Operational Storage"
  order: 20
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

Operational storage holds short-lived and security-sensitive state generated while IdentityServer processes protocol
requests. This includes persisted grants, device codes, pushed authorization requests, server-side sessions, signing
keys and SAML request state.

## Register Duende Storage for Operational Data

First register a database provider as shown in
[Configuration Storage](/identityserver/data/providers/duende-storage/configuration-storage.md#register-duende-storage-for-configuration-data).
`AddStorage` registers the operational adapters together with the configuration adapters in that same call:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.IdentityServer.Configuration;
using Duende.Storage.Sqlite;

builder.Services.Configure<StoragePurgeOptions>(options =>
{
    options.PurgeInterval = TimeSpan.FromMinutes(30); // Default: 60 minutes
    options.BatchSize = 200; // Default: 100
});

builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqliteStore(options =>
            options.ConnectionString =
                builder.Configuration.GetConnectionString("IdentityServer")
                ?? throw new InvalidOperationException(
                    "IdentityServer connection string is missing.")));
```

`AddStorage` registers implementations of:

* `IPersistedGrantStore`
* `IDeviceFlowStore`
* `IPushedAuthorizationRequestStore`
* `IServerSideSessionStore`
* `ISigningKeyStore`
* `ISamlSigninStateStore`
* `ISamlLogoutSessionStore`

Call [`AddServerSideSessions`](/identityserver/ui/server-side-sessions/index.md) separately when you want IdentityServer to
use server-side sessions.

The provider also adds a background purge service. Purging is enabled by default, runs hourly, deletes `100` expired
entities per batch and fuzzes its initial start time to reduce collisions between nodes. Configure `StoragePurgeOptions`
to tune those values or set `EnablePurge` to `false` when an external job owns cleanup.

## Configuration and Operational Storage Share One Registration

`AddStorage` always registers both configuration and operational adapters from the same database provider and schema;
there is no separate operational-only registration step:

```csharp
// Program.cs
var identityServer = builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqliteStore(options =>
            options.ConnectionString =
                builder.Configuration.GetConnectionString("IdentityServer")
                ?? throw new InvalidOperationException(
                    "IdentityServer connection string is missing.")));
```

Deploy the database schema as described in
[Configuration Storage](/identityserver/data/providers/duende-storage/configuration-storage.md#deploy-the-database-schema)
before the application starts serving requests.

Operational records contain tokens, grants, session data and signing material. Restrict database access, encrypt
connections and backups and avoid logging stored payloads or secrets.
