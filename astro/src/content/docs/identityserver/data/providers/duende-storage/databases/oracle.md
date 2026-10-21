---
title: "Oracle"
description: "Install, register and configure Duende Storage with Oracle Database"
date: 2026-10-19
sidebar:
  label: "Oracle"
  order: 30
---

## Install the Package

```bash
# Terminal
dotnet add package Duende.Storage.Oracle --prerelease
```

The package is available from the
[Duende.Storage.Oracle](https://www.nuget.org/packages/Duende.Storage.Oracle) NuGet Gallery page. It depends on
`Oracle.ManagedDataAccess.Core`.

## Register the Provider

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.Oracle;
using Oracle.ManagedDataAccess.Client;

var connectionString = builder.Configuration.GetConnectionString("IdentityServer")!;

builder.Services.AddSingleton<CreateOracleConnection>(() => new OracleConnection(connectionString));

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddOracle(_ => { }))
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

`CreateOracleConnection` is a delegate, `public delegate OracleConnection CreateOracleConnection()`. The delegate
you register must return a **new, unopened** `OracleConnection` every time it's called. Duende Storage opens and
disposes the connection itself for each operation; it never reuses or holds open the connection you return.
Register the delegate as a singleton, not the connection itself.

There's no parameterless `AddOracle()` overload. Call `AddOracle(_ => { })` even when you don't need to set any
options, so Duende Storage knows to use the Oracle provider for this instance.

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
using Duende.Storage.Oracle;
using Oracle.ManagedDataAccess.Client;
using Microsoft.Extensions.DependencyInjection;

var operationalInstanceId = StorageInstanceId.Create("operational");
var operationalConnectionString = builder.Configuration.GetConnectionString("IdentityServerOperational")!;

builder.Services.AddKeyedSingleton<CreateOracleConnection>(
    "operational",
    (_, _) => () => new OracleConnection(operationalConnectionString));

builder.Services
    .AddIdentityServer()
    .AddStorage(operationalInstanceId, storage =>
        storage.AddOracle(sp => sp.GetRequiredKeyedService<CreateOracleConnection>("operational")))
    .AddOperationalStorage(operationalInstanceId);
```

The options-only overload, `AddOracle(Action<OracleStorageEngineOptions> configure)`, works for the default storage
instance only. Calling it for a named instance throws an `InvalidOperationException` immediately, telling you to
use the resolver overload instead. See
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md) for more
on registering and migrating more than one instance.

## Connection Strings

### Development With a Container

[Oracle Database Free](https://www.oracle.com/database/free/) is Oracle's free edition of Oracle Database, available
as a container image you can run locally.

```text
User Id=IDENTITYSERVER;Password=<dev-password>;Data Source=localhost:1521/FREEPDB1
```

Connect to the pluggable database (`FREEPDB1`), not the container's root (CDB) database. The root database can't
create ordinary application users.

### Production With Easy Connect And TLS

```text
User Id=identityserver_app;Password=<from-secret-store>;Data Source=tcps://oracle.example.com:1522/identityserver.example.com?wallet_location=/opt/oracle/wallet
```

### Production With a Wallet

Use a wallet and a TNS alias instead of an inline connect descriptor:

```text
User Id=identityserver_app;Password=<from-secret-store>;Data Source=prod_high
```

```powershell
# Terminal
$env:TNS_ADMIN = "/opt/oracle/wallet"
```

`prod_high` resolves against the `tnsnames.ora` entry in the wallet directory pointed to by `TNS_ADMIN`. Wallets are
the usual way to connect to Oracle Autonomous Database and other managed Oracle services. See Oracle's
[Connecting to Oracle Database](https://docs.oracle.com/en/database/oracle/oracle-database/19/odpnt/featConnecting.html)
guide for the full set of connection string attributes, Easy Connect Plus syntax, and wallet configuration steps.

See [Keep Connection Strings Secret](/identityserver/data/providers/duende-storage/databases/index.mdx#keep-connection-strings-secret)
for how to keep the connection string itself out of source control.

## Use a Custom Schema

By default, objects go in the connecting user's current schema. Set `SchemaName` when the application connects as
a different user than the schema owner, which is the usual least-privilege setup: tables owned by
`IDENTITYSERVER`, application connects as `IDENTITYSERVER_APP`.

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddOracle(options => options.SchemaName = "IDENTITYSERVER"))
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

`OracleStorageEngineOptions.SchemaName` defaults to `null`, which resolves to the connecting user's current schema
at runtime (`SYS_CONTEXT('USERENV','CURRENT_SCHEMA')`). A value you set is uppercased, allows up to 128 characters,
and must start with a letter, followed by letters, digits, `_`, `$`, or `#`.

If the application connects as a different user than the schema owner and you leave `SchemaName` unset, the
application looks for tables in its own, empty schema, and every operation fails with "table or view does not
exist".

## Create and Upgrade the Schema Without the CLI

The Duende CLI's `storage migrate` command doesn't support Oracle yet; support is coming. Until then, deploy the
Oracle schema with custom code instead, for example using a console application.

### Option A: Migrate from a Deployment Console App

Run this as the schema owner (or as a user with enough privileges to create objects in the target schema), as its
own deployment step, before the application starts:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.Oracle;
using Duende.Storage.Schema;
using Oracle.ManagedDataAccess.Client;
using Microsoft.Extensions.DependencyInjection;

var connectionString = Environment.GetEnvironmentVariable(
    "DUENDE_STORAGE_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Set DUENDE_STORAGE_CONNECTION_STRING before running the migration.");
}

var services = new ServiceCollection();

services.AddSingleton<CreateOracleConnection>(() => new OracleConnection(connectionString));

services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddOracle(options => options.SchemaName = "IDENTITYSERVER"))
    .AddConfigurationStorage()
    .AddOperationalStorage();

await using var serviceProvider = services.BuildServiceProvider();

var schema = serviceProvider.GetRequiredService<IStorageInstanceSchema>();
await schema.MigrateAsync(CancellationToken.None);

Console.WriteLine("Schema migration complete.");
```

### Option B: Generate a Script for a DBA to Run

If a DBA, rather than the application's deployment pipeline, applies schema changes, write the migration script to
a file instead of connecting and applying it directly:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.Oracle;
using Duende.Storage.Schema;
using Oracle.ManagedDataAccess.Client;
using Microsoft.Extensions.DependencyInjection;

var connectionString = Environment.GetEnvironmentVariable(
    "DUENDE_STORAGE_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Set DUENDE_STORAGE_CONNECTION_STRING before generating the migration script.");
}

var services = new ServiceCollection();

services.AddSingleton<CreateOracleConnection>(() => new OracleConnection(connectionString));

services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddOracle(options => options.SchemaName = "IDENTITYSERVER"))
    .AddConfigurationStorage()
    .AddOperationalStorage();

await using var serviceProvider = services.BuildServiceProvider();

var schema = serviceProvider.GetRequiredService<IStorageInstanceSchema>();

// For a brand-new database, build the full script from zero:
var script = schema.BuildMigrationScript(DatabaseSchemaVersion.Zero);

// To upgrade an existing database, build only the remaining steps instead:
// var current = await schema.CheckVersionAsync(CancellationToken.None);
// var script = schema.BuildMigrationScript(new DatabaseSchemaVersion((int)current.CurrentVersion));

await File.WriteAllTextAsync("identityserver-oracle-migration.sql", script);
Console.WriteLine("Wrote identityserver-oracle-migration.sql");
```

`BuildMigrationScript` doesn't open a database connection; it's safe to run from a workstation with no network
access to the database. `CheckVersionAsync`, in the upgrade variant, does connect, to read the current schema
version.

The generated script's statements are separated by `/` lines, in the style SQL*Plus and SQLcl expect. A DBA
reviews the file, then runs it with:

```text
sqlplus identityserver@prod_high @identityserver-oracle-migration.sql
```

With `SchemaName` set, as in the example above, the script's statements are schema-qualified
(`"IDENTITYSERVER".<table>`), so the DBA can run it while connected as any user with enough privileges on that
schema. With `SchemaName` unset, the script's statements are unqualified, so the DBA must run it while connected
*as* the owning user, or the objects land in the wrong schema.

No provider locks against concurrent migrations. Run only one migration process at a time, as described in
[Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema).

## Provider Notes

* Duende Storage requires Oracle Database 12c or later.
* Every connection runs `ALTER SESSION SET NLS_COMP=LINGUISTIC NLS_SORT=BINARY_CI`, so text comparisons (including
  lookups by key) are case-insensitive.
* GUIDs are stored as `RAW(16)`, in canonical big-endian byte order. This differs from ODP.NET's default
  `Guid.ToByteArray()` layout, which is mixed-endian. It matters only if you query the Oracle tables directly with
  raw SQL instead of through Duende Storage's stores.
