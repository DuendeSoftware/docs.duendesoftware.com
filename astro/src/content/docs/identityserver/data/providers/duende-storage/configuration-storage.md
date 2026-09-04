---
title: "Duende Storage Configuration Storage"
description: "Set up Duende Storage as the persistence provider for IdentityServer clients, API scopes, API resources, identity resources and dynamic identity providers"
date: 2026-09-01
sidebar:
  label: "Configuration Storage"
  order: 10
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

Configuration storage persists the data that defines how IdentityServer behaves: clients, API scopes, API resources,
identity resources, dynamic identity providers, SAML service providers and CORS origins.

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

## Register Duende Storage for Configuration Data

Register one database provider before adding the IdentityServer storage adapters:

```csharp
// Program.cs
using Duende.Storage.Internal;
using Duende.Storage.Schema;
using Duende.Storage.Sqlite;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddStorageInternal(storage =>
    storage.AddSqliteStore(options =>
        options.ConnectionString =
            builder.Configuration.GetConnectionString("IdentityServer")
            ?? throw new InvalidOperationException(
                "IdentityServer connection string is missing.")));

builder.Services
    .AddIdentityServer()
    .AddConfigurationStorage();

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

`AddStorageInternal` is the current preview bootstrap API. Its name and shape may change before general availability.
Do not hide a missing connection string or continue startup after a migration failure.

The example runs migrations from the application only in development. Do not give the production application schema
creation permissions unless application-managed migrations are an intentional deployment choice.

`AddConfigurationStorage` registers storage-backed implementations of:

* `IClientStore`
* `IResourceStore`
* `IIdentityProviderStore`
* `ISamlServiceProviderStore`
* `ICorsPolicyService`

It also registers the
[configuration administration APIs](/identityserver/data/providers/duende-storage/admin-apis.md).

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

## Supported Databases for Duende Storage

The [Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx#supported-databases) lists the
published database packages and registration methods. Replace the SQLite package and `AddSqliteStore` call with the
provider for your database.

SQL Server, PostgreSQL and Oracle use their provider-native connection factory or data source registrations. Keep
credentials outside source control and use your deployment platform's secret store.

## Protect Configuration Data

:::caution
Dedicated client and API resource secrets are stored as one-way hashes. Other configuration values that IdentityServer
must recover at runtime, including dynamic identity-provider secrets, are not field-encrypted by Duende Storage. Protect
the database, its connections and its backups. See the
[configuration admin API guidance](/identityserver/data/providers/duende-storage/admin-apis.md#dynamic-identity-provider)
for details.
:::

To persist runtime data as well, add
[`AddOperationalStorage`](/identityserver/data/providers/duende-storage/operational-storage.md) to the same
`IIdentityServerBuilder`.
