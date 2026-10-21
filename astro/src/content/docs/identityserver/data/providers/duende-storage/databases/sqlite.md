---
title: "SQLite"
description: "Use SQLite with Duende Storage for local development and automated tests"
date: 2026-10-19
sidebar:
  label: "SQLite"
  order: 40
---

:::danger[Do not use SQLite in production]
SQLite is for automated tests and local development only. Use
[SQL Server](/identityserver/data/providers/duende-storage/databases/sql-server.md),
[PostgreSQL](/identityserver/data/providers/duende-storage/databases/postgresql.md), or
[Oracle](/identityserver/data/providers/duende-storage/databases/oracle.md) in production. SQLite stores data in a
single local file or in-memory database with a single writer at a time, and it can't be shared over the network by
multiple IdentityServer instances.
:::

## Install the Package

```bash
# Terminal
dotnet add package Duende.Storage.Sqlite --prerelease
```

The package is available from the
[Duende.Storage.Sqlite](https://www.nuget.org/packages/Duende.Storage.Sqlite) NuGet Gallery page.

## Use a File-Based Database for Local Development

Add a connection string for a local database file:

```json
// appsettings.Development.json
{
  "ConnectionStrings": {
    "IdentityServer": "Data Source=identityserver.db"
  }
}
```

Register the provider and route configuration and operational data to it:

```csharp
// Program.cs
using Duende.IdentityServer;
using Duende.Storage.Sqlite;

var connectionString = builder.Configuration.GetConnectionString("IdentityServer")!;

builder.Services
    .AddIdentityServer()
    .AddStorage(storage =>
        storage.AddSqlite(options =>
            options.ConnectionString = connectionString))
    .AddConfigurationStorage()
    .AddOperationalStorage();
```

In development, migrate the schema at application startup:

```csharp
// Program.cs
using Duende.Storage.Schema;

if (app.Environment.IsDevelopment())
{
    await app.Services
        .GetRequiredService<IStorageInstanceSchema>()
        .MigrateAsync(CancellationToken.None);
}
```

Or run the schema deployment step with the
[Duende CLI](/identityserver/data/providers/duende-storage/duende-cli.md#storage-migrate):

```powershell
# Terminal
duende storage migrate --provider sqlite --connection-string "Data Source=identityserver.db"
```

The first run against a fresh file creates the schema:

```text
Connecting to sqlite database...
Current schema version: 0
Required schema version: 2
Migrating from version 0 to version 2...
Migration complete. Schema is now at version 2.
```

Running the same command again is a no-op:

```text
Connecting to sqlite database...
Current schema version: 2
Required schema version: 2
Schema is already up to date (version 2).
```

SQLite doesn't support schemas, so the CLI rejects `--schema` for the `sqlite` provider. See
[Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema)
for the general migration API.

Delete the database file to reset it. The application process needs write access to the file and to the folder it
lives in, because SQLite also creates journal files there while it writes.

## Use an In-Memory Database for Tests

`AddSqliteInMemory()` creates a uniquely named, shared-cache, in-memory database for each registration. Call
`AddSqliteInMemory("name")` to choose the name yourself instead of a generated one.

```csharp
// Test setup
using Duende.IdentityServer;
using Duende.Storage.Sqlite;

services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddSqliteInMemory())
    .AddConfigurationStorage()
    .AddOperationalStorage();

// Or choose the name yourself instead of a generated one:
// storage.AddSqliteInMemory("shared-test-db")
```

Storage keeps a connection open for the lifetime of the `ServiceProvider` to keep the in-memory database alive.
Disposing the provider closes that connection, and the database disappears with it. The data never touches disk.

:::caution[`Data Source=:memory:` is not supported]
Don't use `AddSqlite(o => o.ConnectionString = "Data Source=:memory:")`. Duende Storage opens a new connection for
every operation, and each `:memory:` connection is its own private, empty database, so the schema created on one
connection is invisible to the next. `MigrateAsync` fails immediately with a schema verification error:

```text
System.InvalidOperationException: Schema verification failed after migration: Table '__schema_info' is missing.; ...
```

Use `AddSqliteInMemory()` instead. It uses a named, shared-cache in-memory database, so every connection opened for
that name sees the same data.
:::

There is no file-backed variant of in-memory mode.

## Isolate Each Test

Build a new `ServiceProvider` with a parameterless `AddSqliteInMemory()` call for each test. Because xUnit creates a
new test-class instance per test, each test gets its own uniquely named database and starts from an empty schema.

If you call `AddSqliteInMemory("name")` with the same name while another provider that used that name is still
alive, the two providers share the same database, including tests running in parallel in the same test process. Only
reuse a name when you deliberately want two providers to share state.

Dispose the provider when the test finishes to free the database:

```csharp
public async ValueTask DisposeAsync() => await _serviceProvider.DisposeAsync();
```

## Migrate the Schema in Test Setup

Every new in-memory database starts empty. Call `MigrateAsync` before resolving and using any store.

## Example: Testing with xUnit v3

This example uses xUnit v3. Install the test packages:

```bash
# Terminal
dotnet add package xunit.v3
dotnet add package xunit.runner.visualstudio
dotnet add package Microsoft.NET.Test.Sdk
dotnet add package Duende.IdentityServer --prerelease
dotnet add package Duende.Storage.Sqlite --prerelease
```

Each test in this example gets a new in-memory database, migrated in `InitializeAsync`, then stores and reads back a
persisted grant through `IPersistedGrantStore`. `DisposeAsync` disposes the provider, which removes the database.

```csharp
// PersistedGrantStoreTests.cs
using Duende.IdentityServer;
using Duende.IdentityServer.Models;
using Duende.IdentityServer.Stores;
using Duende.Storage.Schema;
using Duende.Storage.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

public class PersistedGrantStoreTests : IAsyncLifetime
{
    private ServiceProvider _serviceProvider = null!;

    public async ValueTask InitializeAsync()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddIdentityServer()
            .AddStorage(s => s.AddSqliteInMemory())
            .AddConfigurationStorage()
            .AddOperationalStorage();

        _serviceProvider = services.BuildServiceProvider();

        var schema = _serviceProvider.GetRequiredService<IStorageInstanceSchema>();
        await schema.MigrateAsync(TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task Stores_and_reads_back_a_persisted_grant()
    {
        using var scope = _serviceProvider.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IPersistedGrantStore>();

        var grant = new PersistedGrant
        {
            Key = "test-key",
            Type = "refresh_token",
            ClientId = "test-client",
            SubjectId = "test-subject",
            CreationTime = DateTime.UtcNow,
            Expiration = DateTime.UtcNow.AddMinutes(10),
            Data = "{}",
        };

        await store.StoreAsync(grant, TestContext.Current.CancellationToken);

        var found = await store.GetAsync(grant.Key, TestContext.Current.CancellationToken);

        Assert.NotNull(found);
        Assert.Equal(grant.ClientId, found!.ClientId);
    }

    public async ValueTask DisposeAsync() => await _serviceProvider.DisposeAsync();
}
```

Run `dotnet test` to run it. Reuse the same setup to test your own code that depends on IdentityServer's stores.

## Provider Notes

* `SqliteStorageEngineOptions` has no schema option. SQLite stores everything in the single database file or
  in-memory database you connect to.
* Every connection runs `PRAGMA foreign_keys = ON`, so foreign key constraints are enforced.
