---
title: "Getting Started with Duende Storage"
description: "Configure Duende Storage for IdentityServer configuration and operational data"
date: 2026-09-08
sidebar:
  label: "Getting Started"
  order: 10
redirect_from:
  - /identityserver/data/providers/duende-storage/configuration-storage/
  - /identityserver/data/providers/duende-storage/operational-storage/
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

`AddStorage(...)` registers Duende Storage for both
[configuration data](/identityserver/data/configuration.mdx) and
[operational data](/identityserver/data/operational.md). Both store families use the same database provider and schema.

## Install Duende Storage NuGet Packages

Install the IdentityServer preview and one database provider. This example uses SQLite:

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

This SQLite connection string is suitable for local development. Keep production credentials out of source control and
load them from your deployment platform's secret store.

## Register Duende Storage

Call `AddStorage(...)` on the `IIdentityServerBuilder` and register one database provider:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.Schema;
using Duende.Storage.Sqlite;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqliteStore(options =>
            options.ConnectionString =
                builder.Configuration.GetConnectionString("IdentityServer")
                ?? throw new InvalidOperationException(
                    "IdentityServer connection string is missing.")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await app.Services
        .GetRequiredService<IDatabaseSchema>()
        .MigrateAsync(CancellationToken.None);
}

app.UseIdentityServer();
app.Run();
```

Do not hide a missing connection string or continue startup after a migration failure.

The example runs migrations from the application only in development. Do not give the production application schema
creation permissions unless application-managed migrations are an intentional deployment choice.

### Configuration Stores

`AddStorage(...)` registers storage-backed implementations of:

- `IClientStore`
- `IResourceStore`
- `IIdentityProviderStore`
- `ISamlServiceProviderStore`
- `ICorsPolicyService`

It also registers the
[configuration administration APIs](/identityserver/data/providers/duende-storage/admin-apis.md).

### Operational Stores

`AddStorage(...)` also registers:

- `IPersistedGrantStore`
- `IDeviceFlowStore`
- `IPushedAuthorizationRequestStore`
- `IServerSideSessionStore`
- `ISigningKeyStore`
- `ISamlSigninStateStore`
- `ISamlLogoutSessionStore`

Call [`AddServerSideSessions`](/identityserver/ui/server-side-sessions/index.md) separately when you want IdentityServer to
use server-side sessions.

The provider adds a background purge service. Purging is enabled by default, runs hourly, deletes `100` expired entities
per batch and fuzzes its initial start time to reduce collisions between nodes. Configure `StoragePurgeOptions` before
calling `AddStorage(...)` to tune those values:

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

Call an explicit store registration after `AddStorage(...)` to replace only that store. For example:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqliteStore(options =>
            options.ConnectionString = connectionString))
    .AddInMemoryClients(clients);
```

This replaces the Duende Storage-backed client store while leaving the operational and other configuration stores in
Duende Storage.

## Deploy the Database Schema

`IDatabaseSchema.MigrateAsync` creates or upgrades the common Duende Storage schema. It requires permissions to create and
alter database objects. In production, run migrations as a controlled deployment step before application instances start.
The runtime application identity can then use narrower data access permissions.

The preview [Duende CLI](https://www.nuget.org/packages/Duende.Cli) can inspect the current schema, generate migration SQL
or apply pending migrations for SQL Server, PostgreSQL and SQLite. Install it and run it from a restored project that
references Duende Storage so it detects the matching plugin version:

```powershell
# Terminal
dotnet tool install --global Duende.Cli --prerelease
$env:DUENDE_STORAGE_CONNECTION_STRING = "<deployment-connection-string>"

duende storage migrate --provider mssql --dry-run
duende storage migrate --provider mssql
```

Use `postgresql` or `sqlite` for the other supported CLI providers. Add `--schema` when you use a non-default SQL Server or
PostgreSQL schema. The `--dry-run` output can be reviewed and applied by a database administrator instead of granting DDL
permissions to the application.

On first use, the CLI downloads the matching `Duende.Storage.CliPlugin` package from NuGet and caches it. Pre-populate the
package cache when a deployment agent cannot access NuGet.

The preview CLI does not currently support Oracle migrations. For Oracle, use `IDatabaseSchema.BuildMigrationScript` from
a restricted deployment utility to generate SQL for review and application by your database administrator.

Run only one migration process at a time. After applying a migration, `MigrateAsync` verifies that the database matches the
expected schema and fails when it finds discrepancies.

## Supported Databases

The [Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx#supported-databases) lists the
published database packages and registration methods. Replace the SQLite package and `AddSqliteStore` call with the
provider for your database.

SQL Server, PostgreSQL and Oracle use their provider-native connection factory or data source registrations. Keep
credentials outside source control and use your deployment platform's secret store.

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
IdentityServer. When `AddStorage(...)` has already registered the provider, call `AddUserManagement(...)` without
registering the same provider a second time:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqliteStore(options =>
            options.ConnectionString = connectionString))
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
