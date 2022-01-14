---
title: "Using EntityFramework Core for configuration and operational data"
date: 2020-09-10T08:22:12+02:00
weight: 5
---

Welcome to Quickstart 4 for Duende IdentityServer!

{{% notice note %}}

We recommend you do the quickstarts in order, but if you'd like
to start here, begin from a copy of [Quickstart 2's source code]({{< param
qs_base >}}/2_InteractiveAspNetCore). You will also need to [install the IdentityServer
templates]({{< ref "0_overview#preparation" >}}).

{{% /notice %}}


In this quickstart you will move configuration and other temporary data into a
database using Entity Framework. In the previous quickstarts, you configured
clients and scopes with code. IdentityServer loaded this configuration data into
memory on startup. Modifying the configuration required a restart.
IdentityServer also generates temporary data, such as authorization codes,
consent choices, and refresh tokens. Up to this point in the quickstarts, this
data was also stored in memory.

To move this data into a database that is persistent between restarts and across
multiple IdentityServer instances, you will use the
*Duende.IdentityServer.EntityFramework* library.

{{% notice note %}}

This quickstart shows how to add Entity Framework support to IdentityServer
manually. There is also a template that will create a new IdentityServer project
with the EntityFramework integration already added: *dotnet new isef*.

{{% /notice %}}

## Configure IdentityServer
### Install Duende.IdentityServer.EntityFramework
IdentityServer's Entity Framework integration is provided by the
*Duende.IdentityServer.EntityFramework* NuGet package. Run the following command
from the *IdentityServer* directory to install it:

```console
dotnet add package Duende.IdentityServer.EntityFramework
```

### Install Microsoft.EntityFrameworkCore.Sqlite

In this quickstart you will use Sqlite as the database provider, but you can
replace Sqlite with any Entity Framework provider. To add Sqlite support to your
IdentityServer project, install the Entity framework Sqlite NuGet package by
running the following command from the *IdentityServer* directory:

```
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
```

### Configuring the Stores
*Duende.IdentityServer.EntityFramework* stores configuration and operational
data in separate stores. To start using these stores, replace the existing calls
to *AddInMemoryClients*, *AddInMemoryIdentityResources*, and
*AddInMemoryApiScopes* in your *ConfigureServices* method in
*HostingExtensions.cs* with *AddConfigurationStore* and *AddOperationalStore*.

You will use Entity Framework migrations later on in this quickstart to manage
the database schema. The call to *MigrationsAssembly(...)* tells Entity
Framework that the (TODO) host project will contain the migrations. This is
necessary since the host project is in a different assembly than the one that
contains the *DbContext* classes.


```cs
// TODO - Do I need typeof still, or is there some more modern thing that will do it?
// TODO - Also, Startup doesn't exist anymore!
var migrationsAssembly = typeof(Startup).GetTypeInfo().Assembly.GetName().Name;
const string connectionString = @"Data Source=Duende.IdentityServer.Quickstart.EntityFramework.db";

builder.Services.AddIdentityServer()
    .AddTestUsers(TestUsers.Users)
    .AddConfigurationStore(options =>
    {
        options.ConfigureDbContext = b => b.UseSqlite(connectionString,
            sql => sql.MigrationsAssembly(migrationsAssembly));
    })
    .AddOperationalStore(options =>
    {
        options.ConfigureDbContext = b => b.UseSqlite(connectionString,
            sql => sql.MigrationsAssembly(migrationsAssembly));
    });
```


## Database Schema Changes

The *Duende.IdentityServer.EntityFramework.Storage* Nuget package (installed as
a dependency of *Duende.IdentityServer.EntityFramework*) contains entity classes
that map onto IdentityServer's models. These entities are maintained in sync
with IdentityServer's models - when the models are changed in a new release,
corresponding changes are made to the entities. As you use IdentityServer and
upgrade over time, you are responsible for your database schema and changes
necessary to that schema.

One approach for managing those changes is to use [EF
migrations](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/index),
which is what this quickstart will use. If migrations are not your preference,
then you can manage the schema changes in any way you see fit. 

{{% notice note %}}

You can find the latest SQL scripts for SqlServer in our EF
[repository](https://github.com/DuendeSoftware/IdentityServer/tree/main/migrations/IdentityServerDb/Migrations).

{{% /notice %}}


TODO - Where does this belong? Back with the stores intro?
### DB Contexts
The IdentityServer Entity Framework integration library implements the required
stores and services using the following DbContexts:

* ConfigurationDbContext: used for configuration data such as clients,
  resources, and scopes
* PersistedGrantDbContext: used for dynamic operational data such as
  authorization codes, and refresh tokens


## Adding Migrations
To create migrations, you will need to install the Entity Framework Core CLI
on your machine and the *Microsoft.EntityFrameworkCore.Design* nuget package in
IdentityServer. Run the following commands from the *IdentityServer* directory.

```console
dotnet tool install --global dotnet-ef
dotnet add package Microsoft.EntityFrameworkCore.Design
```

Then in the same directory, run the following two commands to create the
migrations:

```console
dotnet ef migrations add InitialIdentityServerPersistedGrantDbMigration -c PersistedGrantDbContext -o Data/Migrations/IdentityServer/PersistedGrantDb
dotnet ef migrations add InitialIdentityServerConfigurationDbMigration -c ConfigurationDbContext -o Data/Migrations/IdentityServer/ConfigurationDb
```

You should now see a *Data/Migrations/IdentityServer* folder in your project
containing the code for your newly created migrations.

## Initializing the Database
Now that you have the migrations, you can write code to create the database from
them and seed the database with the same configuration data used in the previous
quickstarts.

{{% notice note %}}

The approach used in this quickstart is used to make it easy to get
IdentityServer up and running. You should devise your own database creation and
maintenance strategy that is appropriate for your architecture.

{{% /notice %}}

In *IdentityServer/HostingExtensions.cs*, add this method to initialize the
database:

```cs
TODO - Copy updated code here
private void InitializeDatabase(IApplicationBuilder app)
{
    using (var serviceScope = app.ApplicationServices.GetService<IServiceScopeFactory>().CreateScope())
    {
        serviceScope.ServiceProvider.GetRequiredService<PersistedGrantDbContext>().Database.Migrate();

        var context = serviceScope.ServiceProvider.GetRequiredService<ConfigurationDbContext>();
        context.Database.Migrate();
        if (!context.Clients.Any())
        {
            foreach (var client in Config.Clients)
            {
                context.Clients.Add(client.ToEntity());
            }
            context.SaveChanges();
        }

        if (!context.IdentityResources.Any())
        {
            foreach (var resource in Config.IdentityResources)
            {
                context.IdentityResources.Add(resource.ToEntity());
            }
            context.SaveChanges();
        }

        if (!context.ApiScopes.Any())
        {
            foreach (var resource in Config.ApiScopes)
            {
                context.ApiScopes.Add(resource.ToEntity());
            }
            context.SaveChanges();
        }
    }
}
```

Call *InitializeDatabase* from the *Configure* method:

```cs
TODO - Copy updated code here
public void Configure(IApplicationBuilder app)
{
    // this will do the initial DB population
    InitializeDatabase(app);

    // the rest of the code that was already here
    // ...
}
```

Now if you run the IdentityServer project, the database should be created and
seeded with the quickstart configuration data. You should be able to use a tool
like SQL Lite Studio to connect and inspect the data.

![](../images/ef_database.png)

{{% notice note %}}
The above *InitializeDatabase* helper API is convenient to seed the database, but this approach is not ideal to leave in to execute each time the application runs. Once your database is populated, consider removing the call to the API.
{{% /notice %}}

## Run the client applications
You should now be able to run any of the existing client applications and sign-in, get tokens, and call the API -- all based upon the database configuration.

TODO - Make on the fly changes?
