---
title: "PostgreSQL"
description: "Install, register and configure Duende Storage with PostgreSQL"
date: 2026-10-19
sidebar:
  label: "PostgreSQL"
  order: 20
---

## Install the Package

```bash
# Terminal
dotnet add package Duende.Storage.PostgreSql --prerelease
```

The package is available from the
[Duende.Storage.PostgreSql](https://www.nuget.org/packages/Duende.Storage.PostgreSql) NuGet Gallery page.

## Register the Provider

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.PostgreSql;

var connectionString = builder.Configuration.GetConnectionString("IdentityServer")!;

builder.Services.AddNpgsqlDataSource(connectionString);

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddPostgreSql())
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

`AddNpgsqlDataSource` comes from `Npgsql.DependencyInjection`, which `Duende.Storage.PostgreSql` depends on directly,
so it compiles with no extra package reference once you've installed `Duende.Storage.PostgreSql`.

The `NpgsqlDataSource` it registers is app-owned: Duende Storage resolves it from dependency injection but never
disposes it. Because you own it, you can configure it however your environment needs, for example with an
`NpgsqlDataSourceBuilder` to attach a periodic password provider for a cloud identity service, before registering it.

`AddPostgreSql()` with no arguments works for the default storage instance only, where it resolves `NpgsqlDataSource`
unkeyed from dependency injection.

A storage instance uses exactly one provider: registering a second provider for the same instance throws an
`InvalidOperationException`. Your application owns the `NpgsqlDataSource` you register above; Duende Storage never
disposes it. The overload shown here resolves it unkeyed from dependency injection and only works for the default
storage instance. Named instances use the resolver overload instead, as shown in
[Named Storage Instances](#named-storage-instances).

## Named Storage Instances

For a named instance, register the data source as a keyed service and use the resolver overload instead:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage;
using Duende.Storage.PostgreSql;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

var operationalInstanceId = StorageInstanceId.Create("operational");
var operationalConnectionString = builder.Configuration.GetConnectionString("IdentityServerOperational")!;

builder.Services.AddNpgsqlDataSource(operationalConnectionString, serviceKey: "operational");

builder.Services
    .AddIdentityServer()
    .AddStorage(operationalInstanceId, storage =>
        storage.AddPostgreSql(
            sp => sp.GetRequiredKeyedService<NpgsqlDataSource>("operational"),
            options => options.SchemaName = "operational"))
    .AddOperationalStorage(operationalInstanceId);
```

`AddNpgsqlDataSource` accepts a `serviceKey:` parameter, so you can register more than one data source in the same
container. The options-only overload, `AddPostgreSql(Action<PostgreSqlStorageEngineOptions> configure)`, works for the
default storage instance only. Calling it for a named instance throws an `InvalidOperationException` immediately,
telling you to use the resolver overload instead. See
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md) for more on
registering and migrating more than one instance.

## Connection Strings

### Development With a Container

```text
Host=localhost;Port=5432;Database=identityserver;Username=postgres;Password=<dev-password>
```

### Production

With certificate validation turned on and a password supplied through a secret store:

```text
Host=db.example.com;Database=identityserver;Username=identityserver_app;Password=<from-secret-store>;SSL Mode=VerifyFull;Timeout=30
```

### Connection String Keywords

A few keywords worth knowing:

* `Host` / `Port`: the server and, if it isn't the default `5432`, the port.
* `Database`: the database name.
* `Username` / `Password`: the login. Prefer a secret store or a passwordless option in production; see below.
* `SSL Mode`: `VerifyFull` validates the server certificate and hostname. Use it in production.
* `Timeout`: the connection timeout, in seconds.
* `Minimum Pool Size` / `Maximum Pool Size`: connection pool sizing.

See [Keep Connection Strings Secret](/identityserver/data/providers/duende-storage/databases/index.mdx#keep-connection-strings-secret)
for how to keep the connection string itself out of source control.

## Use a Custom Schema

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddPostgreSql(options => options.SchemaName = "identity"))
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

`PostgreSqlStorageEngineOptions.SchemaName` defaults to `public`, allows up to 63 characters, and accepts letters,
digits, and the characters `_`, `-`, `#`, and `@`. `MigrateAsync` creates the schema if it doesn't already exist. To
migrate a custom schema with the Duende CLI, pass `--schema identity`.

Using a dedicated schema rather than `public` is worth considering for two reasons: Duende Storage stores the schema
version as a comment on the schema itself (`COMMENT ON SCHEMA`), which needs ownership of that schema, and on
PostgreSQL 15 and later only the schema's owner can create objects in `public` by default. A dedicated schema, owned
by the role that runs migrations, avoids both issues.

## Create and Upgrade the Schema

Run the schema migration as its own deployment step, using an identity that has write access to the target schema:

```powershell
# Terminal
$env:DUENDE_STORAGE_CONNECTION_STRING = "Host=db.example.com;Database=identityserver;Username=identityserver_migrator;Password=...;SSL Mode=VerifyFull"
duende storage migrate --provider postgresql --schema identity --dry-run
```

Review the SQL the dry run prints, then run it again without `--dry-run` to apply it:

```powershell
# Terminal
duende storage migrate --provider postgresql --schema identity
```

See [`storage migrate`](/identityserver/data/providers/duende-storage/duende-cli.md#storage-migrate) for the full
command reference, and
[Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema)
for the schema APIs behind it.

## Provider Notes

* Duende Storage requires PostgreSQL 13 or later.
* Documents are stored as `jsonb` columns.
* There's no migration lock on PostgreSQL. Don't run migrations concurrently against the same database; run exactly
  one migration process at a time, as described in
  [Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema).
