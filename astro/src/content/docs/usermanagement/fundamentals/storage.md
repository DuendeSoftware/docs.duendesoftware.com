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
* **Multi-Tenancy Support**: Built-in space isolation for tenant separation.

## Available Storage Adapters

* **In-Memory**: An in-memory (optionally file-backed) implementation for local development and testing.
* **PostgreSQL**: Production-ready storage using PostgreSQL's native JSONB format (recommended).
* **SQL Server**: Production-ready storage using SQL Server's JSON support.

The adapter pattern means you can switch databases without changing your application code.

## PostgreSQL Storage

PostgreSQL is the recommended production storage adapter. It uses PostgreSQL's native JSONB support to provide flexible document-based storage with relational database reliability.

### Installation

Install the PostgreSQL storage package:

```bash
dotnet add package Duende.UserManagement.Storage.PostgreSQL
```

### Basic Setup

Configure User Management to use PostgreSQL storage:

```csharp title="Program.cs"
using Duende.Platform.Builder;
using Duende.Platform.Storage;
using Duende.Platform.Storage.PostgreSql;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddDuendePlatform()
    .AddStorage(s => s.PostgreSql(
        builder.Configuration.GetConnectionString("pgsql")!));

var app = builder.Build();

// Initialize the database schema on startup.
using (var scope = app.Services.CreateScope())
{
    var store = scope.ServiceProvider.GetRequiredService<IPostgreSqlStore>();
    await store.CreateIfNotExistsAsync(CancellationToken.None);
}

app.Run();
```

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
builder.Services
    .AddDuendePlatform()
    .AddStorage(s => s.PostgreSql(
        builder.Configuration.GetConnectionString("pgsql")!,
        options =>
        {
            options.SchemaName = "usermanagement"; // Default is "public"
        }));
```

Using a custom schema name helps:

* Organize database objects.
* Isolate User Management tables from other application data.
* Support multi-tenant deployments.

### Schema Initialization

Call `CreateIfNotExistsAsync` once on startup to create the schema, tables, and indexes. The operation is idempotent and uses advisory locks to prevent concurrent initialization:

```csharp title="Program.cs"
using var scope = app.Services.CreateScope();
var store = scope.ServiceProvider.GetRequiredService<IPostgreSqlStore>();
await store.CreateIfNotExistsAsync(CancellationToken.None);
```

### Schema Version Check

Check schema compatibility before the application starts accepting traffic:

```csharp title="Program.cs"
using var scope = app.Services.CreateScope();
var store = scope.ServiceProvider.GetRequiredService<IPostgreSqlStore>();
var result = await store.CheckVersionAsync(CancellationToken.None);

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
dotnet add package Duende.UserManagement.Storage.SqlServer
```

### Basic Setup

Configure User Management to use SQL Server storage:

```csharp title="Program.cs"
using Duende.Platform.Builder;
using Duende.Platform.Storage;
using Duende.Platform.Storage.MsSql;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddDuendePlatform()
    .AddStorage(s => s.MsSql(
        builder.Configuration.GetConnectionString("mssql")!));

var app = builder.Build();

// Initialize the database schema on startup.
using (var scope = app.Services.CreateScope())
{
    var store = scope.ServiceProvider.GetRequiredService<IMsSqlStore>();
    await store.CreateIfNotExistsAsync(CancellationToken.None);
}

app.Run();
```

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
builder.Services
    .AddDuendePlatform()
    .AddStorage(s => s.MsSql(
        builder.Configuration.GetConnectionString("mssql")!,
        options =>
        {
            options.SchemaName = "usermanagement"; // Default is "dbo"
        }));
```

Using a custom schema name helps:

* Organize database objects.
* Isolate User Management tables from other application data.
* Support multi-tenant deployments.
* Manage permissions at the schema level.

### Schema Initialization

Call `CreateIfNotExistsAsync` once on startup to create the schema, tables, and indexes. The operation is idempotent and uses application locks to prevent concurrent initialization:

```csharp title="Program.cs"
using var scope = app.Services.CreateScope();
var store = scope.ServiceProvider.GetRequiredService<IMsSqlStore>();
await store.CreateIfNotExistsAsync(CancellationToken.None);
```

### Schema Version Check

Check schema compatibility before the application starts accepting traffic:

```csharp title="Program.cs"
using var scope = app.Services.CreateScope();
var store = scope.ServiceProvider.GetRequiredService<IMsSqlStore>();
var result = await store.CheckVersionAsync(CancellationToken.None);

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

## See Also

* [Introduction to User Management](/usermanagement/introduction.md): Overview of User Management features and capabilities.
* [Multi-Tenancy](/usermanagement/fundamentals/multi-tenancy.md): How to configure isolated tenant storage.
