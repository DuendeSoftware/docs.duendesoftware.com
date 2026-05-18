---
title: Storage Configuration
description: How to configure PostgreSQL or SQL Server storage for Duende User Management, including package installation, connection strings, schema names, schema initialization, and version checks.
date: 2026-04-29
sidebar:
  label: Storage Configuration
  order: 4
---

Duende User Management uses a document-based storage engine that stores entities as complete documents inside a relational database. Adding or removing properties on a document does not require a schema change, which eliminates the need for database migrations. Two production-ready storage adapters are available: PostgreSQL and SQL Server.

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
|------------------------|-----------------------------|-----------------------------------------------|---------------------------------------------------|
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
using Duende.Storage.Sqlite;

builder.Services.AddSqliteStore(options =>
{
    options.ConnectionString = "Data Source=:memory:";
});
```

:::danger[Not for production]
The in-memory adapter loses all data when the application restarts. Do not use it in production environments.
:::

## PostgreSQL Storage

PostgreSQL is the recommended production storage adapter. It uses PostgreSQL's native JSONB support to provide flexible document-based storage with relational database reliability.

### Installation

Install the PostgreSQL storage package:

```bash
dotnet add package Duende.Storage.PostgreSQL
```

### Basic Setup

Configure User Management to use PostgreSQL storage:

```csharp title="Program.cs"
using Duende.Storage;
using Duende.Storage.PostgreSql;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Register the NpgsqlDataSource and PostgreSQL store
builder.Services
    .AddSingleton(new NpgsqlDataSourceBuilder(
        builder.Configuration.GetConnectionString("pgsql")!).Build())
    .AddPostgreSqlStore();

var app = builder.Build();

// Initialize the database schema on startup.
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider
        .GetRequiredService<IDatabaseSchema>()
        .CreateIfNotExistsAsync(CancellationToken.None);
}

app.Run();
```

:::caution[Development convenience only]
Calling `CreateIfNotExistsAsync()` at application startup is convenient for development but not recommended for production. In production, run schema initialization as a separate migration step in your CI/CD pipeline or deployment process.
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

Customize the database schema name using `PostgreSqlStoreOptions`:

```csharp title="Program.cs"
builder.Services.AddPostgreSqlStore(options =>
{
    options.SchemaName = "usermanagement";
});
```

Using a custom schema name helps:

* Organize database objects.
* Isolate User Management tables from other application data.
* Support multi-tenant deployments.

:::tip[Multiple stores with keyed services]
If your application needs more than one store instance (for example, in a multi-tenant setup where each tenant has its own database), see [Multiple Store Instances](#multiple-store-instances) below.
:::

### Schema Initialization

Call `CreateIfNotExistsAsync` once on startup to create the schema, tables, and indexes. The operation is idempotent and uses advisory locks to prevent concurrent initialization:

```csharp title="Program.cs"
using Duende.Storage;

using var scope = app.Services.CreateScope();
await scope.ServiceProvider
    .GetRequiredService<IDatabaseSchema>()
    .CreateIfNotExistsAsync(CancellationToken.None);
```

### Schema Version Check

Check schema compatibility before the application starts accepting traffic:

```csharp title="Program.cs"
using Duende.Storage;

using var scope = app.Services.CreateScope();
var schema = scope.ServiceProvider.GetRequiredService<IDatabaseSchema>();
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
dotnet add package Duende.Storage.SqlServer
```

### Basic Setup

Configure User Management to use SQL Server storage:

```csharp title="Program.cs"
using Duende.Storage;
using Duende.Storage.MsSql;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

// Register the connection factory and SQL Server store
var connectionString = builder.Configuration.GetConnectionString("mssql")!;
builder.Services
    .AddSingleton<CreateSqlConnection>(() => new SqlConnection(connectionString))
    .AddMsSqlStore(options => { });

var app = builder.Build();

// Initialize the database schema on startup.
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider
        .GetRequiredService<IDatabaseSchema>()
        .CreateIfNotExistsAsync(CancellationToken.None);
}

app.Run();
```

:::caution[Development convenience only]
Calling `CreateIfNotExistsAsync()` at application startup is convenient for development but not recommended for production. In production, run schema initialization as a separate migration step in your CI/CD pipeline or deployment process.
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

Customize the database schema name using `MsSqlStoreOptions`:

```csharp title="Program.cs"
builder.Services.AddMsSqlStore(options =>
{
    options.SchemaName = "usermanagement";
});
```

Using a custom schema name helps:

* Organize database objects.
* Isolate User Management tables from other application data.
* Support multi-tenant deployments.
* Manage permissions at the schema level.

:::tip[Multiple stores with keyed services]
If your application needs more than one store instance (for example, in a multi-tenant setup where each tenant has its own database), see [Multiple Store Instances](#multiple-store-instances) below.
:::

### Schema Initialization

Call `CreateIfNotExistsAsync` once on startup to create the schema, tables, and indexes. The operation is idempotent and uses application locks to prevent concurrent initialization:

```csharp title="Program.cs"
using Duende.Storage;

using var scope = app.Services.CreateScope();
await scope.ServiceProvider
    .GetRequiredService<IDatabaseSchema>()
    .CreateIfNotExistsAsync(CancellationToken.None);
```

### Schema Version Check

Check schema compatibility before the application starts accepting traffic:

```csharp title="Program.cs"
using Duende.Storage;

using var scope = app.Services.CreateScope();
var schema = scope.ServiceProvider.GetRequiredService<IDatabaseSchema>();
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

Avoid calling `CreateIfNotExistsAsync()` at application startup in production. Instead, run schema initialization as a dedicated step in your CI/CD pipeline or deployment process before the application starts:

```bash
# Example: run schema init as a pre-deployment job
dotnet run --project tools/SchemaInit -- --connection-string "$DB_CONNECTION_STRING"
```

This approach ensures:
* Schema changes are applied before new application instances start.
* Rollback is possible if schema initialization fails.
* Multiple application instances starting simultaneously do not race to initialize the schema.

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

## Multiple Store Instances

If your application needs more than one store instance (for example, in a multi-tenant setup where each tenant has its own database),
you can register named stores using [.NET's keyed services](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection#keyed-services).

Both the PostgreSQL and SQL Server adapters accept a service key as their first parameter. When you provide a key, the adapter registers itself
and resolves its dependencies (the `NpgsqlDataSource` or `CreateSqlConnection` delegate) as keyed services under that same key. 
This lets you run multiple isolated stores side-by-side in a single application.

### PostgreSQL

Register each tenant's `NpgsqlDataSource` as a keyed singleton, then pass the same key to `AddPostgreSqlStore`.
Each store gets its own connection pool and can target a different database or schema:

```csharp title="Program.cs"
using Duende.Storage.PostgreSql;
using Npgsql;

// Tenant A
builder.Services
    .AddKeyedSingleton("tenant-a",
        new NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("pgsql-tenant-a")!).Build())
    .AddPostgreSqlStore("tenant-a", options =>
    {
        options.SchemaName = "tenant_a";
    });

// Tenant B
builder.Services
    .AddKeyedSingleton("tenant-b",
        new NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("pgsql-tenant-b")!).Build())
    .AddPostgreSqlStore("tenant-b", options =>
    {
        options.SchemaName = "tenant_b";
    });
```

### SQL Server

The same pattern applies to SQL Server. Register a keyed `CreateSqlConnection` delegate for each tenant,
then pass the key to `AddMsSqlStore`:

```csharp title="Program.cs"
using Duende.Storage.MsSql;
using Microsoft.Data.SqlClient;

// Tenant A
var tenantAConnectionString = builder.Configuration.GetConnectionString("mssql-tenant-a")!;
builder.Services
    .AddKeyedSingleton<CreateSqlConnection>("tenant-a", () => new SqlConnection(tenantAConnectionString))
    .AddMsSqlStore("tenant-a", options =>
    {
        options.SchemaName = "tenant_a";
    });
```

### Resolving Keyed Stores

Once registered, you can inject a specific store instance using the `[FromKeyedServices]` attribute
on constructor parameters:

```csharp title="Example.cs"
public class TenantAService([FromKeyedServices("tenant-a")] IPooledStore store)
{
    // Use the tenant-a store instance
}
```

You can also resolve keyed services programmatically via `IServiceProvider.GetRequiredKeyedService<IPooledStore>("tenant-a")`,
which is useful when the tenant key is determined at runtime (for example, from a request header or route value).

