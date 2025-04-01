---
title: "Entity Framework Integration"
sidebar:
  order: 50
---

An EntityFramework-based implementation is provided for the configuration and operational data extensibility points in IdentityServer.
The use of EntityFramework allows any EF-supported database to be used with this library.

The features provided by this library are broken down into two main areas: configuration store and operational store support.
These two different areas can be used independently or together, based upon the needs of the hosting application.

To use this library, ensure that you have the NuGet package for the EntityFramework integration. 
It is called `Duende.IdentityServer.EntityFramework`.
You can install it with:

```
dotnet add package Duende.IdentityServer.EntityFramework
```

## Configuration Store Support
For storing [configuration data](configuration), then the configuration store can be used.
This support provides implementations of the `IClientStore`, `IResourceStore`, `IIdentityProviderStore`, and the `ICorsPolicyService` extensibility points.
These implementations use a `DbContext`-derived class called `ConfigurationDbContext` to model the tables in the database.

To use the configuration store support, in Program.cs use the `AddConfigurationStore` extension method after the call to `AddIdentityServer`:

```csharp
const string connectionString = @"Data Source=(LocalDb)\MSSQLLocalDB;database=YourIdentityServerDatabase;trusted_connection=yes;";
var migrationsAssembly = typeof(Program).GetTypeInfo().Assembly.GetName().Name;

builder.Services.AddIdentityServer()
    // this adds the config data from DB (clients, resources, CORS)
    .AddConfigurationStore(options =>
    {
        options.ConfigureDbContext = builder =>
            builder.UseSqlServer(connectionString,
                sql => sql.MigrationsAssembly(migrationsAssembly));
    });
```

To configure the configuration store, use the `ConfigurationStoreOptions` options object passed to the configuration callback.

### ConfigurationStoreOptions
This options class contains properties to control the configuration store and `ConfigurationDbContext`.

`ConfigureDbContext`
    Delegate of type `Action<DbContextOptionsBuilder>` used as a callback to configure the underlying `ConfigurationDbContext`.
    The delegate can configure the `ConfigurationDbContext` in the same way if EF were being used directly with `AddDbContext`, which allows any EF-supported database to be used.

`DefaultSchema`
    Allows setting the default database schema name for all the tables in the `ConfigurationDbContext`

```csharp
options.DefaultSchema = "myConfigurationSchema";      
```

If you need to change the schema for the Migration History Table, you can chain another action to the `UseSqlServer`:

```csharp
options.ConfigureDbContext = b =>
    b.UseSqlServer(connectionString,
        sql => sql.MigrationsAssembly(migrationsAssembly).MigrationsHistoryTable("MyConfigurationMigrationTable", "myConfigurationSchema"));
```

### Enabling Caching for Configuration Store

To enable caching for the EF configuration store implementation, use the `AddConfigurationStoreCache` extension method:

```csharp
builder.Services.AddIdentityServer()
    .AddConfigurationStore(options => { ... })
    // this is something you will want in production to reduce load on and requests to the DB
    .AddConfigurationStoreCache();

```

## Operational Store 
For storing [operational data](operational) then the operational store can be used.
This support provides implementations of the `IPersistedGrantStore`, `IDeviceFlowStore`, `IServerSideSessionStore`, and `ISigningKeyStore` extensibility points.
The implementation uses a `DbContext`-derived class called `PersistedGrantDbContext` to model the table in the database.

To use the operational store support, in Program.cs use the `AddOperationalStore` extension method after the call to `AddIdentityServer`:

```csharp
const string connectionString = @"Data Source=(LocalDb)\MSSQLLocalDB;database=YourIdentityServerDatabase;trusted_connection=yes;";
var migrationsAssembly = typeof(Program).GetTypeInfo().Assembly.GetName().Name;

builder.Services.AddIdentityServer()
    // this adds the operational data from DB (codes, tokens, consents)
    .AddOperationalStore(options =>
    {
        options.ConfigureDbContext = builder =>
            builder.UseSqlServer(connectionString,
                sql => sql.MigrationsAssembly(migrationsAssembly));

        // this enables automatic token cleanup. this is optional.
        options.EnableTokenCleanup = true;
        options.TokenCleanupInterval = 3600; // interval in seconds (default is 3600)
    });

```

To configure the operational store, use the `OperationalStoreOptions` options object passed to the configuration callback.

### OperationalStoreOptions
This options class contains properties to control the operational store and `PersistedGrantDbContext`.

`ConfigureDbContext`
    Delegate of type `Action<DbContextOptionsBuilder>` used as a callback to configure the underlying `PersistedGrantDbContext`.
    The delegate can configure the `PersistedGrantDbContext` in the same way if EF were being used directly with `AddDbContext`, which allows any EF-supported database to be used.

`DefaultSchema`
    Allows setting the default database schema name for all the tables in the `PersistedGrantDbContext`.

`EnableTokenCleanup`
    Indicates whether expired grants and pushed authorization requests will be automatically cleaned up from the database. The default is `false`.

`RemoveConsumedTokens` [added in 5.1]
    Indicates whether consumed grants will be automatically cleaned up from the database. The default is `false`.
        
`TokenCleanupInterval`
    The token cleanup interval (in seconds). The default is 3600 (1 hour).

`ConsumedTokenCleanupDelay` [added in 6.3]
    The consumed token cleanup delay (in seconds). The default is 0. This delay is the amount of time that must elapse before tokens marked as consumed can be deleted. Note that only refresh tokens with
    OneTime usage can be marked as consumed. 

`FuzzTokenCleanupStart` [added in 7.0]
    The background token cleanup job runs at a configured interval. If multiple nodes run the cleanup job at the same time, update conflicts might occur in the store. To reduce the probability of that happening, the startup time can be fuzzed. When enabled, the first run is scheduled at a random time between the host startup and the configured
    TokenCleanupInterval. Subsequent runs are run on the configured TokenCleanupInterval. Defaults to `true`.


:::note
The token cleanup feature does `not` remove persisted grants that are `consumed` (see [persisted grants](operational/grants#grant-expiration-and-consumption)). It only removes persisted grants that are beyond their `Expiration`.
:::

## Database creation and schema changes across different versions of IdentityServer
It is very likely that across different versions of IdentityServer (and the EF support) that the database schema will change to accommodate new and changing features.

We do not provide any support for creating your database or migrating your data from one version to another. 
You are expected to manage the database creation, schema changes, and data migration in any way your organization sees fit.

Using EF migrations is one possible approach to this. 
If you do wish to use migrations, then see the [EF quickstart](/identityserver/v7/quickstarts/4_ef) for samples on how to get started, or consult the Microsoft [documentation on EF migrations](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/index).

We publish a [sample app](https://github.com/DuendeSoftware/products/tree/main/identity-server/migrations/IdentityServerDb) that we use internally for creating databases to test the latest database schema (this is SQL Server specific).
