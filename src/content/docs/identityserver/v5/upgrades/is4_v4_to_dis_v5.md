---
title: "IdentityServer4 v4.1 to Duende IdentityServer v5"
order: 100
newContentUrl: "https://docs.duendesoftware.com/identityserver/v7/upgrades/"
---

This upgrade guide covers upgrading from IdentityServer4 v4.1.x to Duende IdentityServer v5.

## Step 1: Update NuGet package

In your IdentityServer host project, update the IdentityServer NuGet being used from IdentityServer4 to Duende IdentityServer. 
For example in your project file:

```xml
<PackageReference Include="IdentityServer4" Version="4.1.1" />
```

would change to the latest version of Duende IdentityServer:

```xml
<PackageReference Include="Duende.IdentityServer" Version="5.2.0" />
```

If you're using any of the other IdentityServer4 packages, such as *IdentityServer4.EntityFramework* or *IdentityServer4.AspNetIdentity*, then there are Duende equivalents such as *Duende.IdentityServer.EntityFramework* and *Duende.IdentityServer.AspNetIdentity*, respectively.

## Step 2: Update Namespaces

Anywhere *IdentityServer4* was used as a namespace, replace it with *Duende.IdentityServer*. For example:

```csharp
using IdentityServer4;
using IdentityServer4.Models;
```

would change to:

```csharp
using Duende.IdentityServer;
using Duende.IdentityServer.Models;
```

## Step 3: Remove AddDeveloperSigningCredential

If in *ConfigureServices* in your *Startup.cs* you were previously using *AddDeveloperSigningCredential*, that can be removed. 
[Automatic key management](/identityserver/v5/fundamentals/keys) is now a built-in feature.

## Step 4: Update Database Schema (if needed)

If you are using a [database](/identityserver/v5/data) for your configuration and operational data, then there is a small database schema update.
This includes:

* A new *Keys* table for the automatic key management feature in the operational database.
* A new *RequireResourceIndicator* boolean column on the *ApiResources* table in the configuration database.

If you are using the *Duende.IdentityServer.EntityFramework* package as the implementation for the database and you're using EntityFramework Core migrations as the mechanism for managing those schema changes over time, the commands below will update those migrations with the new changes.
Note that you might need to adjust based on your specific organization of the migration files.

```bash
dotnet ef migrations add UpdateToDuende_v5 -c PersistedGrantDbContext -o Data/Migrations/IdentityServer/PersistedGrantDb

dotnet ef migrations add UpdateToDuende_v5 -c ConfigurationDbContext -o Data/Migrations/IdentityServer/ConfigurationDb
```

Then to apply those changes to your database:

```bash
dotnet ef database update -c PersistedGrantDbContext
dotnet ef database update -c ConfigurationDbContext
```

## Step 5: Migrating signing keys (optional)

In IdentityServer4, the common way to configure a signing key in *Startup* was to use *AddSigningCredential()* and provide key material (such as an *X509Certificate2*).
In Duende IdentityServer the [automatic key management](/identityserver/v5/fundamentals/keys) feature can manage those keys for you.

Since client apps and APIs commonly cache the key material published from the discovery document then when upgrading you need to consider how those applications will handle an upgraded token server with a new and different signing key.

If while upgrading you can simply restart all of the client apps and APIs that depend on those signing keys, then you can remove the old signing key and start to use the new automatic key management. 
When they are restarted they will reload the discovery document and thus be aware of the new signing key.

But if you can't restart all the client apps and APIs then you will need to maintain the prior signing key while still publishing the new keys produced from the automatic key management feature. 
This can be achieved by still using *AddSigningCredential()*.
A signing key registered with *AddSigningCredential()* will take precedence over any keys created by the automatic key management feature.
Once the client apps and APIs have updated their caches (typically after 24 hours) then you can remove the prior signing key by removing the call to *AddSigningCredential()* and redeploy your IdentityServer.

## Step 6: Done!

That's it. Of course, at this point you can and should test that your IdentityServer is updated and working properly.
