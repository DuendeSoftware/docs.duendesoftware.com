---
title: "SQL Server"
description: "Install, register and configure Duende Storage with SQL Server"
date: 2026-10-19
sidebar:
  label: "SQL Server"
  order: 10
---

## Install the Package

```bash
# Terminal
dotnet add package Duende.Storage.MsSql --prerelease
```

The package is available from the
[Duende.Storage.MsSql](https://www.nuget.org/packages/Duende.Storage.MsSql) NuGet Gallery page.

## Register the Provider

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.MsSql;
using Microsoft.Data.SqlClient;

var connectionString = builder.Configuration.GetConnectionString("IdentityServer")!;

builder.Services.AddSingleton<CreateSqlConnection>(() => new SqlConnection(connectionString));

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddMsSql(_ => { }))
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

`CreateSqlConnection` is a delegate, `public delegate SqlConnection CreateSqlConnection()`. The delegate you register
must return a **new, unopened** `SqlConnection` every time it's called. Duende Storage opens and disposes the
connection itself for each operation; it never reuses or holds open the connection you return. Register the delegate
as a singleton, not the connection itself.

There's no parameterless `AddMsSql()` overload. Call `AddMsSql(_ => { })` even when you don't need to set any
options, so Duende Storage knows to use the SQL Server provider for this instance.

A storage instance uses exactly one provider: registering a second provider for the same instance throws an
`InvalidOperationException`. Your application owns the connection factory you register above; Duende Storage never
disposes it. The overload shown here resolves it unkeyed from dependency injection and only works for the default
storage instance. Named instances use the resolver overload instead, as shown in
[Named Storage Instances](#named-storage-instances).

## Named Storage Instances

For a named instance, register the delegate as a keyed service and use the resolver overload instead:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage;
using Duende.Storage.MsSql;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;

var operationalInstanceId = StorageInstanceId.Create("operational");
var operationalConnectionString = builder.Configuration.GetConnectionString("IdentityServerOperational")!;

builder.Services.AddKeyedSingleton<CreateSqlConnection>(
    "operational",
    (_, _) => () => new SqlConnection(operationalConnectionString));

builder.Services
    .AddIdentityServer()
    .AddStorage(operationalInstanceId, storage =>
        storage.AddMsSql(sp => sp.GetRequiredKeyedService<CreateSqlConnection>("operational")))
    .AddOperationalStorage(operationalInstanceId);
```

The options-only overload, `AddMsSql(Action<MsSqlStorageEngineOptions> configure)`, works for the default storage
instance only. Calling it for a named instance throws an `InvalidOperationException` immediately, telling you to use
the resolver overload instead. See
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md) for more on
registering and migrating more than one instance.

## Connection Strings

### Development With a Container

```text
Server=localhost,1433;Database=IdentityServer;User Id=sa;Password=<dev-password>;TrustServerCertificate=True
```

### Development With LocalDB

```text
Server=(localdb)\MSSQLLocalDB;Database=IdentityServer;Integrated Security=True
```

### Windows Authentication

Against a named instance:

```text
Server=sql-server\InstanceName;Database=IdentityServer;Integrated Security=True
```

### Production

With certificate validation turned on and a password supplied through a secret store:

```text
Server=sql.example.com;Database=IdentityServer;User Id=identityserver_app;Password=<from-secret-store>;Encrypt=True;TrustServerCertificate=False
```

Don't set `TrustServerCertificate=True` in production; it disables certificate validation for the connection.

### Production Without a Password

Passwordless with a managed identity (Azure SQL):

```text
Server=sql.example.database.windows.net;Database=IdentityServer;Authentication=Active Directory Managed Identity;Encrypt=True
```

Use `Authentication=Active Directory Default` instead when the identity isn't a managed identity, for example during
local development signed in with `az login`.

### Connection String Keywords

A few keywords worth knowing:

* `Server`: the host, and optionally the port (`,1433`) or named instance (`\InstanceName`).
* `Database`: the database name.
* `Encrypt`: encrypt the connection. Defaults to `True` in current driver versions; set it explicitly.
* `TrustServerCertificate`: skip certificate validation. Use it only for local containers and LocalDB.
* `Min Pool Size` / `Max Pool Size`: connection pool sizing.

See [Keep Connection Strings Secret](/identityserver/data/providers/duende-storage/databases/index.mdx#keep-connection-strings-secret)
for how to keep the connection string itself out of source control.

## Use a Custom Schema

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddMsSql(options => options.SchemaName = "identity"))
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

`MsSqlStorageEngineOptions.SchemaName` defaults to `dbo`, allows up to 88 characters, and accepts letters, digits,
and the characters `_`, `-`, `#`, and `@`. `MigrateAsync` creates the schema if it doesn't already exist. To migrate
a custom schema with the Duende CLI, pass `--schema identity`.

## Create and Upgrade the Schema

Run the schema migration as its own deployment step, using an identity that has write access to the target schema:

```powershell
# Terminal
$env:DUENDE_STORAGE_CONNECTION_STRING = "Server=sql.example.com;Database=IdentityServer;User Id=identityserver_migrator;Password=...;Encrypt=True"
duende storage migrate --provider mssql --schema identity --dry-run
```

Review the SQL the dry run prints, then run it again without `--dry-run` to apply it:

```powershell
# Terminal
duende storage migrate --provider mssql --schema identity
```

See [`storage migrate`](/identityserver/data/providers/duende-storage/duende-cli.md#storage-migrate) for the full
command reference, and
[Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema)
for the schema APIs behind it.

## Provider Notes

* The database's compatibility level must be 140 or higher (SQL Server 2017 or later). Migrating against a lower
  compatibility level fails with error 50001.
* Migration scripts run under an application lock (`sp_getapplock`), but the schema version is read before the lock
  is taken, so this doesn't make concurrent migrations safe. Run exactly one migration process at a time, as
  described in [Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema).
