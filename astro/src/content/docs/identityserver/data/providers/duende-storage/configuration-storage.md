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

await app.Services
    .GetRequiredService<IDatabaseSchema>()
    .MigrateAsync(CancellationToken.None);

app.UseIdentityServer();
app.Run();
```

`AddStorageInternal` is the current preview bootstrap API. Its name and shape may change before general availability.
Do not hide a missing connection string or continue startup after a migration failure.

`AddConfigurationStorage` registers storage-backed implementations of:

* `IClientStore`
* `IResourceStore`
* `IIdentityProviderStore`
* `ISamlServiceProviderStore`
* `ICorsPolicyService`

It also registers the
[configuration administration APIs](/identityserver/data/providers/duende-storage/admin-apis.md).

`IDatabaseSchema.MigrateAsync` creates or upgrades the common Duende storage schema. In production, run migrations as a
controlled deployment step so that multiple application instances do not attempt the same migration concurrently.

## Supported Databases for Duende Storage

The [Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx#supported-databases) lists the
published database packages and registration methods. Replace the SQLite package and `AddSqliteStore` call with the
provider for your database.

SQL Server, PostgreSQL and Oracle use their provider-native connection factory or data source registrations. Keep
credentials outside source control and use your deployment platform's secret store.

To persist runtime data as well, add
[`AddOperationalStorage`](/identityserver/data/providers/duende-storage/operational-storage.md) to the same
`IIdentityServerBuilder`.
