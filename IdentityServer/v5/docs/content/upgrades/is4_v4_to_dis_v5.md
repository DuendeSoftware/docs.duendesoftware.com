---
title: "IdentityServer4 v4.1 to Duende IdentityServer v5.0"
weight: 100
---

This upgrade guide covers upgrading from IdentityServer4 v4.1.x to Duende IdentityServer [v5.0.x](https://github.com/DuendeSoftware/IdentityServer/releases/tag/5.0.0).

## Step 1: Update NuGet package

In your IdentityServer host project, update the IdentityServer NuGet being used from IdentityServer4 to Duende IdentityServer. 
For example in your project file:

```
<PackageReference Include="IdentityServer4" Version="4.1.1" />
```

would change to: 

```
<PackageReference Include="Duende.IdentityServer" Version="5.0.5" />
```

If you're using any of the other IdentityServer4 packages, such as *IdentityServer4.EntityFramework* or *IdentityServer4.AspNetIdentity*, then there are Duende equivalents such as *Duende.IdentityServer.EntityFramework* and *Duende.IdentityServer.AspNetIdentity*, respectively.

## Step 2: Update Namespaces

Anywhere *IdentityServer4* was used as a namespace, replace it with *Duende.IdentityServer*. For example:

```
using IdentityServer4;
using IdentityServer4.Models;
```

would change to:

```
using Duende.IdentityServer;
using Duende.IdentityServer.Models;
```

## Step 3: Remove AddDeveloperSigningCredential

If in *ConfigureServices* in your *Startup.cs* you were previously using *AddDeveloperSigningCredential*, that can be removed. 
[Automatic key management]({{<ref "/fundamentals/keys">}}) is now a built-in feature.

## Step 4: Update Database Schema (if needed)

If you are using a [database]({{<ref "/data">}}) for your configuration and operational data, then there is a small database schema update.
This includes:

* A new *Keys* table for the automatic key management feature in the operational database.
* A new *RequireResourceIndicator* boolean column on the *ApiResources* table in the configuration database.

If you are using the *Duende.IdentityServer.EntityFramework* package as the implementation for the database and you're using EntityFramework Core migrations as the mechanism for managing those schema changes over time, the commands below will update those migrations with the new changes.
Note that you might need to adjust based on your specific organization of the migration files.

```
dotnet ef migrations add UpdateToDuende_v5 -c PersistedGrantDbContext -o Data/Migrations/IdentityServer/PersistedGrantDb

dotnet ef migrations add UpdateToDuende_v5 -c ConfigurationDbContext -o Data/Migrations/IdentityServer/ConfigurationDb
```

Then to apply those changes to your database:

```
dotnet ef database update -c PersistedGrantDbContext

dotnet ef database update -c ConfigurationDbContext
```

## Step 5: Done!

That's it. Of course, at this point you can and should test that your IdentityServer is updated and working properly.
