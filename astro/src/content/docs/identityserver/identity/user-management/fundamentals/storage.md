---
title: Storage Configuration
description: How to configure PostgreSQL or SQL Server storage for Duende User Management, including using a dedicated database for User Management, package installation, connection strings, schema names, schema initialization, and version checks.
date: 2026-10-02
sidebar:
  label: Storage Configuration
  order: 4
redirect_from:
  - /identityserver/usermanagement/fundamentals/storage/
---

Duende User Management uses a document-based storage engine that stores entities as complete documents inside a relational database. Adding or removing properties on a document does not require a schema change, which eliminates the need for database migrations. Two production-ready storage adapters are available: PostgreSQL and SQL Server.

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
instance is a separate database, it is migrated separately — see [Schema Initialization](#schema-initialization)
below for migrating multiple instances. For the general model, including how IdentityServer, User Management and
Spaces data can each be placed in different instances, see
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md).

:::note[Shared instance with IdentityServer]
If you only call `AddUserManagement(configure)` (without a `StorageInstanceId`), User Management uses
`StorageInstanceId.Default`, the same instance IdentityServer uses unless you have mapped IdentityServer's categories
elsewhere. There is no need to call `AddStorage(...)` twice for the same instance: register the provider once with
`AddStorage(...)`, and map as many categories to it as you need with `AddConfigurationStorage()`,
`AddOperationalStorage()`, and `AddUserManagement(...)`.
:::

## Document-Based Storage

The storage engine uses a document-oriented approach within a relational database:

* **No Database Migrations**: Add or remove properties without schema changes.
* **In-Place Schema Upgrades**: Documents evolve automatically with your application.
* **Transaction Support**: Full ACID compliance for data integrity.

## Available Storage Adapters

* **[In-Memory](#in-memory-storage)**: An in-memory (optionally file-backed) implementation for local development and testing.
* **[PostgreSQL](#postgresql-storage)**: Production-ready storage using PostgreSQL's native JSONB format (recommended).
* **[SQL Server](#sql-server-storage)**: Production-ready storage using SQL Server's JSON support.

The adapter pattern means you can switch databases without changing your application code.

## Storage Options Comparison

| Feature                | In-Memory                   | PostgreSQL                                    | SQL Server                                        |
|------------------------|------------------------------|-----------------------------------------------|---------------------------------------------------|
| **Setup**              | Zero setup required         | Requires PostgreSQL infrastructure            | Requires SQL Server infrastructure                |
| **Best for**           | Tests and local development | Production workloads (recommended)            | Production workloads in .NET/Windows environments |
| **Data persistence**   | Lost on restart             | Durable                                       | Durable                                           |
| **JSON support**       | N/A                         | Native JSONB with excellent query performance | JSON support (less native than PostgreSQL JSONB)  |
| **Enterprise support** | None                        | Community + commercial options                | Full Microsoft enterprise support                 |
| **Production use**     | ❌ Not recommended           | ✅ Recommended                                 | ✅ Supported                                       |

:::tip
PostgreSQL is the recommended production adapter due to its native JSONB support and excellent JSON query performance. SQL Server is a strong choice for teams already invested in the Microsoft/Windows ecosystem.
:::

## In-Memory Storage

The in-memory adapter stores data in process memory and is intended exclusively for local development and automated testing. No installation or infrastructure is required; it uses SQLite with an in-memory connection string.

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.Storage.Sqlite;

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddSqliteInMemory())
    .AddUserManagement(um => { /* ... */ });
```

:::danger[Not for production]
The in-memory adapter loses all data when the application restarts. Do not use it in production environments.
:::

## PostgreSQL Storage

PostgreSQL is the recommended production storage adapter. It uses PostgreSQL's native JSONB support to provide flexible document-based storage with relational database reliability.

### Installation

Install the PostgreSQL storage package:

```bash
dotnet add package Duende.Storage.PostgreSql
```

### Basic Setup

Register the `NpgsqlDataSource` and select the PostgreSQL provider for the default storage instance:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.Storage.Schema;
using Duende.Storage.PostgreSql;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddSingleton(new NpgsqlDataSourceBuilder(
        builder.Configuration.GetConnectionString("pgsql")!).Build());

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddPostgreSql())
    .AddUserManagement(um => { /* ... */ });

var app = builder.Build();

// Initialize the database schema on startup.
using (var scope = app.Services.CreateScope())
{
    var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
    var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
    await schema.MigrateAsync(CancellationToken.None);
}

app.Run();
```

:::caution[Development convenience only]
Calling `MigrateAsync()` at application startup is convenient for development but not recommended for production. In production, run schema initialization as a separate migration step in your CI/CD pipeline or deployment process.
:::

### Connection String

Configure your connection string in `appsettings.json`:

```json title="appsettings.json"
{
  "ConnectionStrings": {
    "pgsql": "Host=localhost;Database=usermanagement;Username=postgres;Password=yourpassword"
  }
}
```

Connection string parameters:

* `Host`: PostgreSQL server hostname.
* `Database`: Database name.
* `Username`: Database user.
* `Password`: Database password.
* `Port`: Optional port (default: `5432`).
* `SSL Mode`: Optional SSL configuration.

Production connection string example:

```json title="appsettings.json"
{
  "ConnectionStrings": {
    "pgsql": "Host=db.example.com;Database=usermanagement_prod;Username=app_user;Password=secure_password;SSL Mode=Require;Timeout=30"
  }
}
```

### Schema Configuration

Customize the database schema name using `PostgreSqlStorageEngineOptions`:

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddPostgreSql(options =>
    {
        options.SchemaName = "usermanagement";
    }));
```

Using a custom schema name helps:

* Organize database objects.
* Isolate User Management tables from other application data.
* Support multiple storage instances in the same server.

:::tip[Using a dedicated database for User Management]
If you want User Management's data in a separate database from IdentityServer's configuration and operational data (for example, to isolate write load or manage permissions separately), see [Using A Dedicated Database For User Management](#using-a-dedicated-database-for-user-management) above.
:::

### Schema Initialization

Call `MigrateAsync` once on startup to create the schema, tables, and indexes. The operation is idempotent and uses advisory locks to prevent concurrent initialization:

```csharp title="Program.cs"
using Duende.Storage.Schema;

using var scope = app.Services.CreateScope();
var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
await schema.MigrateAsync(CancellationToken.None);
```

When User Management uses a non-default storage instance, pass its `StorageInstanceId` to migrate that instance specifically:

```csharp title="Program.cs"
var schema = await schemaFactory.GetStorageInstanceSchema(userManagementInstance, CancellationToken.None);
await schema.MigrateAsync(CancellationToken.None);
```

### Schema Version Check

Check schema compatibility before the application starts accepting traffic:

```csharp title="Program.cs"
using Duende.Storage.Schema;

using var scope = app.Services.CreateScope();
var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
var result = await schema.CheckVersionAsync(CancellationToken.None);

if (!result.IsCompatible)
{
    throw new InvalidOperationException(
        $"Schema version mismatch. Current: {result.CurrentVersion}, Required: {result.RequiredVersion}");
}
```

`CheckSchemaVersionResult` properties:

* `IsCompatible`: `true` when the current schema version matches the required version.
* `CurrentVersion`: The schema version found in the database.
* `RequiredVersion`: The schema version required by the current package.

## SQL Server Storage

SQL Server is a production-ready storage adapter that uses SQL Server's JSON support to provide flexible document-based storage with enterprise-grade database reliability.

### Installation

Install the SQL Server storage package:

```bash
dotnet add package Duende.Storage.MsSql
```

### Basic Setup

Register the connection factory and select the SQL Server provider for the default storage instance:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.Storage.Schema;
using Duende.Storage.MsSql;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("mssql")!;
builder.Services.AddSingleton<CreateSqlConnection>(() => new SqlConnection(connectionString));

builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddMsSql(options => { }))
    .AddUserManagement(um => { /* ... */ });

var app = builder.Build();

// Initialize the database schema on startup.
using (var scope = app.Services.CreateScope())
{
    var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
    var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
    await schema.MigrateAsync(CancellationToken.None);
}

app.Run();
```

:::caution[Development convenience only]
Calling `MigrateAsync()` at application startup is convenient for development but not recommended for production. In production, run schema initialization as a separate migration step in your CI/CD pipeline or deployment process.
:::

### Connection String

Configure your connection string in `appsettings.json`:

```json title="appsettings.json"
{
  "ConnectionStrings": {
    "mssql": "Server=localhost;Database=usermanagement;User Id=sa;Password=yourpassword;TrustServerCertificate=True"
  }
}
```

Connection string parameters:

* `Server`: SQL Server hostname. Supports instance notation, for example `localhost\SQLEXPRESS`.
* `Database`: Database name.
* `User Id`: Database user.
* `Password`: Database password.
* `TrustServerCertificate`: Set to `True` for development environments.
* `Encrypt`: Optional encryption setting (default: `True` in modern drivers).
* `Connection Timeout`: Optional connection timeout in seconds (default: `30`).

Production connection string example:

```json title="appsettings.json"
{
  "ConnectionStrings": {
    "mssql": "Server=db.example.com;Database=usermanagement_prod;User Id=app_user;Password=secure_password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Min Pool Size=5;Max Pool Size=100"
  }
}
```

Windows Authentication example:

```json title="appsettings.json"
{
  "ConnectionStrings": {
    "mssql": "Server=localhost;Database=usermanagement;Integrated Security=True;TrustServerCertificate=True"
  }
}
```

### Schema Configuration

Customize the database schema name using `MsSqlStorageEngineOptions`:

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddMsSql(options =>
    {
        options.SchemaName = "usermanagement";
    }));
```

Using a custom schema name helps:

* Organize database objects.
* Isolate User Management tables from other application data.
* Manage permissions at the schema level.

:::tip[Using a dedicated database for User Management]
If you want User Management's data in a separate database from IdentityServer's configuration and operational data, see [Using A Dedicated Database For User Management](#using-a-dedicated-database-for-user-management) above.
:::

### Schema Initialization

Call `MigrateAsync` once on startup to create the schema, tables, and indexes. The operation is idempotent and uses application locks to prevent concurrent initialization:

```csharp title="Program.cs"
using Duende.Storage.Schema;

using var scope = app.Services.CreateScope();
var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
await schema.MigrateAsync(CancellationToken.None);
```

### Schema Version Check

Check schema compatibility before the application starts accepting traffic:

```csharp title="Program.cs"
using Duende.Storage.Schema;

using var scope = app.Services.CreateScope();
var schemaFactory = scope.ServiceProvider.GetRequiredService<IStorageInstanceSchemaFactory>();
var schema = await schemaFactory.GetStorageInstanceSchema(CancellationToken.None);
var result = await schema.CheckVersionAsync(CancellationToken.None);

if (!result.IsCompatible)
{
    throw new InvalidOperationException(
        $"Schema version mismatch. Current: {result.CurrentVersion}, Required: {result.RequiredVersion}");
}
```

### Supported SQL Server Editions

The SQL Server storage adapter is compatible with:

* SQL Server 2019 and later (recommended).
* SQL Server 2017 (requires compatibility level 140 or higher).
* Azure SQL Database (all tiers).
* Azure SQL Managed Instance.

## Deployment Best Practices

### Run Schema Initialization as a Separate Step

Avoid calling `MigrateAsync()` at application startup in production. Instead, run schema initialization as a dedicated step in your CI/CD pipeline or deployment process before the application starts:

```bash
# Example: run schema init as a pre-deployment job
dotnet run --project tools/SchemaInit -- --connection-string "$DB_CONNECTION_STRING"
```

This approach ensures:
* Schema changes are applied before new application instances start.
* Rollback is possible if schema initialization fails.
* Multiple application instances starting simultaneously do not race to initialize the schema.
* Each storage instance (if you have more than one) is migrated independently.

### Manage Connection String Secrets

Never store production credentials in `appsettings.json` or source control. Use a secrets management solution appropriate for your environment:

* **Environment variables**: Set `ConnectionStrings__pgsql` or `ConnectionStrings__mssql` as environment variables at the OS or container level.
* **Azure Key Vault**: Use `builder.Configuration.AddAzureKeyVault(...)` to pull secrets at startup.
* **AWS Secrets Manager / HashiCorp Vault**: Integrate via the appropriate .NET configuration provider.
* **.NET User Secrets**: Use `dotnet user-secrets` for local development to keep credentials out of source control.

### Configure Connection Pooling

Both the Npgsql (PostgreSQL) and Microsoft.Data.SqlClient (SQL Server) drivers maintain connection pools automatically. Tune pool size to match your expected concurrency:

```json title="appsettings.Production.json"
{
  "ConnectionStrings": {
    "pgsql": "Host=db.example.com;Database=usermanagement_prod;Username=app_user;Password=...;Minimum Pool Size=5;Maximum Pool Size=100",
    "mssql": "Server=db.example.com;Database=usermanagement_prod;User Id=app_user;Password=...;Min Pool Size=5;Max Pool Size=100"
  }
}
```

General guidelines:
* Set minimum pool size to avoid cold-start latency under burst traffic.
* Set maximum pool size to prevent overwhelming the database server.
* Monitor pool exhaustion (timeout errors) and adjust accordingly.

### Use Read Replicas for Query-Heavy Workloads

If your workload is read-heavy, consider routing read operations to a read replica:

* **PostgreSQL**: Configure a secondary connection string pointing to a read replica and use it for query-only operations.
* **SQL Server**: Use the `ApplicationIntent=ReadOnly` connection string parameter to route reads to an Always On availability group secondary.
* **Azure SQL / Azure Database for PostgreSQL**: Enable read replicas in the Azure portal and configure a separate connection string for read traffic.
