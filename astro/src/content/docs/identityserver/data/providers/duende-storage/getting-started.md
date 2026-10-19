---
title: "Getting Started with Duende Storage"
description: "Configure Duende Storage for IdentityServer configuration and operational data"
date: 2026-10-19
sidebar:
  label: "Getting Started"
  order: 10
redirect_from:
  - /identityserver/data/providers/duende-storage/configuration-storage/
  - /identityserver/data/providers/duende-storage/operational-storage/
---

`AddStorage(...)` selects a database provider for a storage instance.
[`AddConfigurationStorage()`](/identityserver/data/configuration.mdx) and
[`AddOperationalStorage()`](/identityserver/data/operational.md) then route IdentityServer's configuration and
operational data to an instance and register the matching stores. By default, all three target the same, default
instance, so a typical application uses one database. See
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md) to route
categories to separate databases.

## Install Duende Storage NuGet Packages

Install the IdentityServer preview and one database provider. This walkthrough uses SQLite, which is suitable for
automated tests and local development only. For production, use SQL Server, PostgreSQL or Oracle; see the
[Databases overview](/identityserver/data/providers/duende-storage/databases/index.mdx) for the provider packages and
registration methods.

```bash
# Terminal
dotnet add package Duende.IdentityServer --prerelease
dotnet add package Duende.Storage.Sqlite --prerelease
```

The packages are available from the
[Duende.IdentityServer](https://www.nuget.org/packages/Duende.IdentityServer) and
[Duende.Storage.Sqlite](https://www.nuget.org/packages/Duende.Storage.Sqlite) NuGet Gallery pages.

## Add a Connection String

Add a connection string for the provider:

```json
// appsettings.json
{
  "ConnectionStrings": {
    "IdentityServer": "Data Source=identityserver.db"
  }
}
```

Keep production credentials out of source control and load them from your deployment platform's secret store.

## Register Duende Storage

Call `AddStorage(...)` on the `IIdentityServerBuilder` to select a database provider for the default storage instance,
then call `AddConfigurationStorage()` and `AddOperationalStorage()` to route configuration and operational data to it:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.Schema;
using Duende.Storage.Sqlite;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqlite(options =>
            options.ConnectionString =
                builder.Configuration.GetConnectionString("IdentityServer")
                ?? throw new InvalidOperationException(
                    "IdentityServer connection string is missing.")))
    .AddConfigurationStorage()
    .AddOperationalStorage();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await app.Services
        .GetRequiredService<IStorageInstanceSchema>()
        .MigrateAsync(CancellationToken.None);
}

app.UseIdentityServer();
app.Run();
```

Do not hide a missing connection string or continue startup after a migration failure.

The example runs migrations from the application only in development. See
[Deploy the Database Schema](#deploy-the-database-schema) for the production approach.

### Configuration Stores

`AddConfigurationStorage()` registers storage-backed implementations of:

- `IClientStore`
- `IResourceStore`
- `IIdentityProviderStore`
- `ISamlServiceProviderStore`
- `ICorsPolicyService`

It also registers the
[configuration administration APIs](/identityserver/data/providers/duende-storage/admin-apis.md).

### Operational Stores

`AddOperationalStorage()` also registers:

- `IPersistedGrantStore`
- `IDeviceFlowStore`
- `IPushedAuthorizationRequestStore`
- `IServerSideSessionStore`
- `ISigningKeyStore`
- `ISamlSigninStateStore`
- `ISamlLogoutSessionStore`

Call [`AddServerSideSessions`](/identityserver/ui/server-side-sessions/index.md) separately when you want IdentityServer to
use server-side sessions.

The provider adds a background purge service that runs against every registered storage instance. Purging is enabled by
default, runs hourly, deletes `100` expired entities per batch and fuzzes its initial start time to reduce collisions
between nodes. Configure `StoragePurgeOptions` before calling `AddOperationalStorage()` to tune those values:

```csharp
// Program.cs
using Duende.IdentityServer.Configuration;

builder.Services.Configure<StoragePurgeOptions>(options =>
{
    options.PurgeInterval = TimeSpan.FromMinutes(30); // Default: 60 minutes
    options.BatchSize = 200; // Default: 100
});
```

Set `EnablePurge` to `false` when an external job owns cleanup.

### Override an Individual Store

Call an explicit store registration after `AddConfigurationStorage()`/`AddOperationalStorage()` to replace only that
store. For example:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqlite(options =>
            options.ConnectionString = connectionString))
    .AddConfigurationStorage()
    .AddOperationalStorage()
    .AddInMemoryClients(clients);
```

This replaces the Duende Storage-backed client store while leaving the operational and other configuration stores in
Duende Storage.

## Deploy the Database Schema

:::caution
Calling `IStorageInstanceSchema.MigrateAsync` from the application at startup, as shown above, is intended for
development purposes only. When several app instances start together, for example during scale-out or a rolling
deployment, they can migrate the same database concurrently: no provider protects against that. A failed migration
also blocks application startup.
:::

In production, run migrations as a single deployment step before application instances start, using the
[Duende CLI](/identityserver/data/providers/duende-storage/duende-cli.md#install-the-duende-cli):

```powershell
# Terminal
dotnet tool install --global Duende.Cli --prerelease

duende storage migrate --provider sqlite --connection-string "Data Source=identityserver.db"
```

See the [Duende CLI reference](/identityserver/data/providers/duende-storage/duende-cli.md#storage-migrate) for the
full command reference, and the [Databases overview](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema)
for the other supported providers. The CLI doesn't support Oracle migrations yet; see the
[Oracle page](/identityserver/data/providers/duende-storage/databases/oracle.md#create-and-upgrade-the-schema-without-the-cli)
for the code-based path.

Run only one migration process at a time. After applying a migration, `MigrateAsync` verifies that the database matches the
expected schema and fails when it finds discrepancies.

## Protect Stored Data

:::caution
Dedicated client and API resource secrets are stored as one-way hashes. Other configuration values that IdentityServer
must recover at runtime, including dynamic identity-provider secrets, are not field-encrypted by Duende Storage. Protect
the database, its connections and its backups. See the
[configuration admin API guidance](/identityserver/data/providers/duende-storage/admin-apis.md#dynamic-identity-provider)
for details.
:::

Operational records contain tokens, grants, session data and signing material. Restrict database access, encrypt
connections and backups and avoid logging stored payloads or secrets.

## Use Duende User Management

[Duende User Management](/identityserver/identity/user-management/index.mdx) uses the same Duende Storage abstractions as
IdentityServer. When `AddStorage(...)` has already registered a provider for the default instance, call
`AddUserManagement(...)` without registering the same provider a second time: it maps the `user-management` data category
to that instance and reuses its database.

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqlite(options =>
            options.ConnectionString = connectionString))
    .AddConfigurationStorage()
    .AddOperationalStorage()
    .AddUserManagement(_ => { });
```

IdentityServer and User Management can share the physical database, connection string and common Duende Storage schema.
Their entities use different entity types within the storage layer.

When [Spaces](/identityserver/spaces/index.mdx) is enabled, User Management repositories use the same space-aware storage
factory as IdentityServer. User profiles, authenticators, roles and groups are therefore stored in the resolved space's
pool by default.

If users must be shared globally across spaces, do not rely on this default routing. Use a deliberately separate host or
storage architecture for the shared user directory. The built-in integration does not provide a per-product switch that
opts only User Management out of the current space pool.

To store IdentityServer and User Management data in separate databases instead of sharing one, see
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md).

## Sample

For a complete, runnable IdentityServer application that stores and administers configuration and operational data with
Duende Storage, see the [Storage sample](/identityserver/samples/storage.mdx).
