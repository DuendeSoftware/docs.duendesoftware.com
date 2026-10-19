---
title: Storage Configuration
description: "Choose a database and storage instance for Duende User Management data, and keep its schema migrated."
date: 2026-10-19
sidebar:
  label: Storage Configuration
  order: 4
redirect_from:
  - /identityserver/usermanagement/fundamentals/storage/
---

Duende User Management stores users, authenticators, roles, and groups as documents in
[Duende Storage](/identityserver/data/providers/duende-storage/getting-started.md). Because entities are stored as
complete documents, adding or removing properties on a user profile does not require a schema change. The storage
tables themselves are still created and upgraded by Duende Storage migrations — see
[Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema).
All Duende Storage databases are supported. See
[Databases](/identityserver/data/providers/duende-storage/databases/index.mdx) for the full list.

This page covers **User Management data** — user profiles, authenticators, roles, and groups. It does not govern how
IdentityServer stores its **configuration data** (clients, API scopes, API resources, and identity resources) or
**operational data** (persisted grants, device flow codes, signing keys). IdentityServer configuration continues to
use whichever provider you have configured, such as
[Entity Framework Core](/identityserver/data/providers/entityframework-core.md) with its classic relational tables, or
the [Duende Storage](/identityserver/data/providers/duende-storage/getting-started.md) provider.

## Storage Instances and Data Categories

Duende Storage registers databases as named **storage instances**. Each call to `AddStorage(...)` on the
IdentityServer builder makes one database available under a `StorageInstanceId`. Separately, each product maps its
own data to an instance: User Management maps its data category when you call `AddUserManagement(...)`, and
IdentityServer maps configuration and operational data when you call `AddConfigurationStorage()` and
`AddOperationalStorage()`. A category that is never mapped to a named instance falls back to the default instance
(`StorageInstanceId.Default`).

This split means `AddStorage(...)` only selects a database provider and connection; it does not, by itself, store
anything. You still need to tell each product which instance to use. Selecting a second provider for the same
instance throws an `InvalidOperationException`.

By default, `AddUserManagement(...)` stores its data in `StorageInstanceId.Default`, alongside whatever IdentityServer
data you have routed there:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.Storage.PostgreSql;
using Npgsql;

builder.Services
    .AddSingleton(new NpgsqlDataSourceBuilder(
        builder.Configuration.GetConnectionString("pgsql")!).Build());

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddPostgreSql())
    .AddConfigurationStorage()
    .AddOperationalStorage()
    .AddUserManagement(um => { /* ... */ });
```

Here, clients, API scopes, persisted grants, and User Management's users, profiles, and authenticators all live in
the same PostgreSQL database.

## Using A Dedicated Database For User Management

For larger deployments, or when User Management's write volume (OTP challenges, passkey ceremonies, authentication
attempts) would compete with IdentityServer's configuration and operational workloads, register a second storage
instance and map User Management to it with `StorageInstanceId`:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.Storage;
using Duende.Storage.PostgreSql;
using Npgsql;

var userManagementInstance = StorageInstanceId.Create("user-management");

builder.Services
    .AddSingleton(new NpgsqlDataSourceBuilder(
        builder.Configuration.GetConnectionString("pgsql")!).Build())
    .AddKeyedSingleton(userManagementInstance.Value, (sp, _) =>
        new NpgsqlDataSourceBuilder(
            builder.Configuration.GetConnectionString("pgsql-usermanagement")!).Build());

builder.Services
    .AddIdentityServer()
    // IdentityServer's configuration and operational data use the default instance.
    .AddStorage(storage => storage.AddPostgreSql())
    .AddConfigurationStorage()
    .AddOperationalStorage()
    // User Management uses a dedicated database, registered as its own instance.
    .AddStorage(userManagementInstance, storage => storage.AddPostgreSql(
        sp => sp.GetRequiredKeyedService<NpgsqlDataSource>(userManagementInstance.Value)))
    .AddUserManagement(userManagementInstance, um => { /* ... */ });
```

`AddStorage(storageInstanceId, configure)` only makes a database available under that instance; it does not route any
data to it. `AddUserManagement(storageInstanceId, configure)` is what tells User Management to use it. Because each
instance is a separate database, it is migrated separately — see
[Migrate the User Management Database](#migrate-the-user-management-database) below for migrating multiple instances.
For the general model, including how IdentityServer, User Management and
Spaces data can each be placed in different instances, see
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md).

:::note[Shared instance with IdentityServer]
If you only call `AddUserManagement(configure)` (without a `StorageInstanceId`), User Management uses
`StorageInstanceId.Default`, the same instance IdentityServer uses unless you have mapped IdentityServer's categories
elsewhere. There is no need to call `AddStorage(...)` twice for the same instance: register the provider once with
`AddStorage(...)`, and map as many categories to it as you need with `AddConfigurationStorage()`,
`AddOperationalStorage()`, and `AddUserManagement(...)`.
:::

## Choose a Database

SQL Server, PostgreSQL, and Oracle are production databases for User Management data; pick whichever fits your
infrastructure. SQLite is for local development and automated tests — use `AddSqliteInMemory()` to run tests against
an [in-memory SQLite database](/identityserver/data/providers/duende-storage/databases/sqlite.md#use-an-in-memory-database-for-tests)
with no external dependencies.

* [SQL Server](/identityserver/data/providers/duende-storage/databases/sql-server.md)
* [PostgreSQL](/identityserver/data/providers/duende-storage/databases/postgresql.md)
* [Oracle](/identityserver/data/providers/duende-storage/databases/oracle.md)
* [SQLite](/identityserver/data/providers/duende-storage/databases/sqlite.md)

## Migrate the User Management Database

Call `MigrateAsync` to create or upgrade the schema for the storage instance User Management uses. When User
Management shares the default instance with IdentityServer, migrate that instance:

```csharp title="Program.cs"
using Duende.Storage.Schema;

using var scope = app.Services.CreateScope();
var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
await schema.MigrateAsync(CancellationToken.None);
```

When User Management uses a dedicated storage instance (see
[Using A Dedicated Database For User Management](#using-a-dedicated-database-for-user-management) above), also
migrate that instance by passing its `StorageInstanceId`:

```csharp title="Program.cs"
var schema = await schemaFactory.GetStorageInstanceSchema(userManagementInstance, CancellationToken.None);
await schema.MigrateAsync(CancellationToken.None);
```

Calling `MigrateAsync()` at application startup, as shown above, is convenient for development, but production
deployments should run migrations as a separate step. In production, run migrations as a deployment step with the
[Duende CLI](/identityserver/data/providers/duende-storage/duende-cli.md#storage-migrate), once per connection
string. Run only one migration process at a time against a given database. Running startup migration and the CLI
concurrently against the same connection string is not supported.

