---
title: "IdentityServer4 v3.1 to IdentityServer4 v4.1"
sidebar:
  order: 140
  label: IdentityServer4 v3.1 → v4.1
redirect_from:
  - /identityserver/v5/upgrades/is4_v3_to_dis_v5/
  - /identityserver/v5/upgrades/is4_v3_to_dis_v6/
  - /identityserver/v6/upgrades/is4_v3_to_dis_v5/
  - /identityserver/v6/upgrades/is4_v3_to_dis_v6/
  - /identityserver/v7/upgrades/is4_v3_to_dis_v5/
  - /identityserver/v7/upgrades/is4_v3_to_dis_v6/
---

This upgrade guide covers upgrading from IdentityServer4 v3.1.x to IdentityServer4 v4.1.x.

If you are on IdentityServer4 v3 this upgrade is necessary before moving on to Duende IdentityServer versions. 
The upgrade is relatively complex because the configuration object model had some non-trivial changes from IdentityServer4 v3 to IdentityServer4 v4.

In short, in IdentityServer4 v3 there was a parent-child relationship between the ApiResources and the ApiScopes.
Then in IdentityServer4 v4 the ApiScopes was promoted to be its own top-level configuration. 
This meant that the child collection under the ApiResources was renamed to ApiResourcesScopes and it contained a reference to the new top-level ApiScopes.

If you were using a database for this configuration, then this means that configuration changed from a parent-child, to two top-level tables with a join table between them (to put it loosely). The new ApiResourcesScopes table was created to act as that join table.

Also, all the prior tables associated with the `ApiResources` were prefixed with "Api" and that prefix became "ApiResource" to better indicate the association. 
Then any new tables associated with the new top-level ApiScopes have the "ApiScope" prefix to indicate that association.

To properly update the database, the easiest approach is to first update to the latest of IdentityServer4 v4. 
Once that's complete, then it's straightforward to move to Duende IdentityServer v6.

There is a sample project for this migration exercise. It is located [here](https://github.com/DuendeSoftware/UpgradeSample-IdentityServer4-v3).

## Step 1: Update NuGet package to IdentityServer4 v4.x

In your IdentityServer host project, update the IdentityServer NuGet being used from IdentityServer4 v3 to IdentityServer4 v4. 
For example in your project file:

```
<PackageReference Include="IdentityServer4" Version="3.1.4" />
```

would change to the latest version of IdentityServer4:

```
<PackageReference Include="IdentityServer4" Version="4.1.2" />
```

If you're using any of the other IdentityServer4 packages, such as `IdentityServer4.EntityFramework` or `IdentityServer4.AspNetIdentity`, then update those as well.

## Step 2: Update Database Schema with EF Core Migrations

If you are using a [database](/identityserver/data) for your configuration and operational data, then there is a bit of work.
The reason is that for this type of schema restructuring EntityFramework Core's migrations can lose existing data.
To handle this, custom SQL will perform the conversation from the old schema to the new.
This is only needed for the configuration database, not the operational one so normal migrations will suffice for the operational database.

First for the operational database, we can apply EF Core migrations. 
Note that you might need to adjust based on your specific organization of the migration files.

```
dotnet ef migrations add Grants_v4 -c PersistedGrantDbContext -o Migrations/PersistedGrantDb
```

Then to apply those changes to your database:

```
dotnet ef database update -c PersistedGrantDbContext
```

Next for the configuration database, we'll also add an EF Migration with:

```
dotnet ef migrations add Config_v4 -c ConfigurationDbContext -o Migrations/ConfigurationDb
```

When you run this, you should see the warnings from EF Core about this migration possibly losing data:

```
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 3.1.15 initialized 'ConfigurationDbContext' using provider 'Microsoft.EntityFrameworkCore.SqlServer' with options: MigrationsAssembly=IdentityServerMigrationSample, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
An operation was scaffolded that may result in the loss of data. Please review the migration for accuracy.
Done. To undo this action, use 'ef migrations remove'
```

To ensure we don't lose data, we will add a custom SQL script to run instead of the generated migration.
To ensure the script is available to the migration we will include the script into the project as an embedded resource.
You could devise other approaches (like loading the SQL script from the filesystem) based on your preferences.

The SQL script to include is located [here](https://github.com/DuendeSoftware/UpgradeSample-IdentityServer4-v3/blob/main/IdentityServerMigrationSample/ConfigurationDb_v4_delta.sql).
Copy it into your project folder and then configure it as an embedded resource in the csproj file:

```
  <ItemGroup>
    <EmbeddedResource Include="ConfigurationDb_v4_delta.sql" />
  </ItemGroup>

```

Then modify the migration that was just created. Remove all the code in the `Up` and `Down` methods are replace the `Up` with this code, which will execute the custom SQL script:

```
using System.IO;
using Microsoft.EntityFrameworkCore.Migrations;

namespace IdentityServerMigrationSample.Migrations.ConfigurationDb
{
    public partial class Config_v4 : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var assembly = typeof(Program).Assembly;
            using (var s = assembly.GetManifestResourceStream("IdentityServerMigrationSample.ConfigurationDb_v4_delta.sql"))
            {
                using (StreamReader sr = new StreamReader(s))
                {
                    var sql = sr.ReadToEnd();
                    migrationBuilder.Sql(sql);
                }
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
```

Note that given that there is no `Down` implementation, this is a one-way update.

And now run the migration:

```
dotnet ef database update -c ConfigurationDbContext
```

And your database should now be updated.


## Step 3: Verify Configuration Database Data

At this point, you should be able to query your migrated database and see your data intact. 
[This script](https://github.com/DuendeSoftware/UpgradeSample-IdentityServer4-v3/blob/main/IdentityServerMigrationSample/query_v4.sql) allows you to query the new restructured tables.

## Step 4: Move Onto The Upgrade Guide For Duende IdentityServer v6

Once your project has been updated to IdentityServer4 v4, then you can work through the guide to update from IdentityServer4 v4 to Duende IdentityServer v6 (which should be far easier).
Here is the [link to the next upgrade guide](/identityserver/upgrades/identityserver4-v4-to-duende-identityserver-v6.md).
