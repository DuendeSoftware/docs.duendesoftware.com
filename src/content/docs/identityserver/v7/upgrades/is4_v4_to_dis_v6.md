---
title: "IdentityServer4 v4.1 to Duende IdentityServer v6"
sidebar:
  order: 95
  label: v4.1 → v6.0
---

This upgrade guide covers upgrading from IdentityServer4 v4.1.x to Duende IdentityServer v6.

:::note
With any major release, there is always the possibility of some breaking changes.
[This issue tracks](https://github.com/DuendeSoftware/IdentityServer/issues/351) the list of updates where a breaking change might affect your use of IdentityServer. It would be useful to review it to understand if any of these changes affect you.
:::

## Step 1: Update to .NET 6

In your IdentityServer host project, update the version of the .NET framework. 
For example in your project file:

```
<TargetFramework>netcoreapp3.1</TargetFramework>
```

would change to: 

```
<TargetFramework>net6.0</TargetFramework>
```

Also, any other NuGets that you were previously using that targeted an older version of .NET should be updated.
For example, `Microsoft.EntityFrameworkCore.SqlServer` or `Microsoft.AspNetCore.Authentication.Google`.
Depending on what your application was using, there may or may not be code changes based on those updated NuGet packages. 

## Step 2: Update the IdentityServer NuGet package

In your IdentityServer host project, update the IdentityServer NuGet being used from IdentityServer4 to Duende IdentityServer. 
For example in your project file:

```
<PackageReference Include="IdentityServer4" Version="4.1.1" />
```

would change to the latest version of Duende IdentityServer:

```
<PackageReference Include="Duende.IdentityServer" Version="6.0.0" />
```

If you're using any of the other IdentityServer4 packages, such as `IdentityServer4.EntityFramework` or `IdentityServer4.AspNetIdentity`, then there are Duende equivalents such as `Duende.IdentityServer.EntityFramework` and `Duende.IdentityServer.AspNetIdentity`, respectively.

## Step 3: Update Namespaces

Anywhere `IdentityServer4` was used as a namespace, replace it with `Duende.IdentityServer`. For example:

```
using IdentityServer4;
using IdentityServer4.Models;
```

would change to:

```
using Duende.IdentityServer;
using Duende.IdentityServer.Models;
```

## Step 4: Remove AddDeveloperSigningCredential

If in `ConfigureServices` in your `Startup.cs` you were previously using `AddDeveloperSigningCredential`, that can be removed. 
[Automatic key management](/identityserver/v7/fundamentals/key_management) is now a built-in feature.

## Step 5: Update Database Schema (if needed)

If you are using a [database](/identityserver/v7/data) for your configuration and operational data, then there are database schema updates.
These include:

* A new `Keys` table for the automatic key management feature in the operational database.
* A new `RequireResourceIndicator` boolean column on the `ApiResources` table in the configuration database.
* A new index on the `ConsumedTime` column in the `PersistedGrants` table ([more details](https://github.com/DuendeSoftware/IdentityServer/pull/84)).
* A new table called `IdentityProviders` for storing the OIDC provider details ([more details](https://github.com/DuendeSoftware/IdentityServer/pull/188)).
* Add missing columns for created, updated, etc. to EF entities ([more details](https://github.com/DuendeSoftware/IdentityServer/pull/356)).
* Add unique constraints to EF tables where duplicate records not allowed ([more details](https://github.com/DuendeSoftware/IdentityServer/pull/355)).

IdentityServer is abstracted from the data store on multiple levels, so the exact steps involved in updating your data store will depend on your implementation details. 

#### Custom Store Implementations
The core of IdentityServer is written against the [store interfaces](/identityserver/v7/reference/stores), which abstract all the implementation details of actually storing data. If your IdentityServer implementation includes a custom implementation of those stores, then you will have to determine how best to include the changes in the model in the underlying data store and make any necessary changes to schemas, if your data store requires that.

#### Duende.IdentityServer.EntityFramework
We also provide a default implementation of the stores in the `Duende.IdentityServer.EntityFramework` package, but this implementation is still highly abstracted because it is usable with any database that has an EF provider. Different database vendors have very different dialects of sql that have different syntax and type systems, so we don't provide schema changes directly. Instead, we provide the Entity Framework entities and mappings which can be used with Entity Framework's migrations feature to generate the schema updates that are needed in your database. 

To generate migrations, run the commands below. Note that you might need to adjust paths based on your specific organization of the migration files.

```
dotnet ef migrations add UpdateToDuende_v6_0 -c PersistedGrantDbContext -o Data/Migrations/IdentityServer/PersistedGrantDb

dotnet ef migrations add UpdateToDuende_v6_0 -c ConfigurationDbContext -o Data/Migrations/IdentityServer/ConfigurationDb
```

:::note
You will likely get the warning "An operation was scaffolded that may result in the loss of data. Please review the migration for accuracy.". This is due to the fact that in this release the column length for redirect URIs (for both login and logout) was reduced from 2000 to 400. This was needed because some database providers have limits on index size. This should not affect you unless you are using redirect URIs greater than 400 characters.
:::

Then to apply those changes to your database:

```
dotnet ef database update -c PersistedGrantDbContext

dotnet ef database update -c ConfigurationDbContext
```

Some organizations prefer to use other tools for managing schema changes. You're free to manage your schema however you see fit, as long as the entities can be successfully mapped. Even if you're not going to ultimately use Entity Framework migrations to manage your database changes, generating a migration can be a useful development step to get an idea of what needs to be done.

## Step 6: Migrating signing keys (optional)

In IdentityServer4, the common way to configure a signing key in `Startup` was to use `AddSigningCredential()` and provide key material (such as an `X509Certificate2`).
In Duende IdentityServer the [automatic key management](/identityserver/v7/fundamentals/key_management) feature can manage those keys for you.

Since client apps and APIs commonly cache the key material published from the discovery document then when upgrading you need to consider how those applications will handle an upgraded token server with a new and different signing key.

If while upgrading you can simply restart all the client apps and APIs that depend on those signing keys, then you can remove the old signing key and start to use the new automatic key management. 
When they are restarted they will reload the discovery document and thus be aware of the new signing key.

But if you can't restart all the client apps and APIs then you will need to maintain the prior signing key while still publishing the new keys produced from the automatic key management feature. 
This can be achieved by still using `AddSigningCredential()`.
A signing key registered with `AddSigningCredential()` will take precedence over any keys created by the automatic key management feature.
Once the client apps and APIs have updated their caches (typically after 24 hours) then you can remove the prior signing key by removing the call to `AddSigningCredential()` and redeploy your IdentityServer.

## Step 7: Verify Data Protection Configuration
IdentityServer depends on ASP.NET Data Protection. Data Protection encrypts and signs data using keys managed by ASP.NET. Those keys are isolated by application name, which by default is set to the content root path of the host. This prevents multiple applications from sharing encryption keys, which is necessary to protect your encryption against certain forms of attack. However, this means that if your content root path changes, the default settings for data protection will prevent you from using your old keys. Beginning in .NET 6, the content root path is now normalized so that it ends with a directory separator. This means that your content root path might change when you upgrade to .NET 6. This can be mitigated by explicitly setting the application name and removing the separator character. See [Microsoft's documentation for more information](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview?view=aspnetcore-6.0#setapplicationname).

## Step 8: Done!

That's it. Of course, at this point you can and should test that your IdentityServer is updated and working properly.
