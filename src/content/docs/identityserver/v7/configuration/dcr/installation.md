---
title: Installation and Hosting
sidebar:
  order: 10
---

The Configuration API can be installed in a separate host from IdentityServer,
or in the same host. In many cases it is desirable to host the configuration API
and IdentityServer separately. This facilitates the ability to restrict access
to the configuration API at the network level separately from IdentityServer and
keeps IdentityServer's access to the configuration data read-only. In other
cases, you may find that hosting the two systems together better fits your
needs.

## Separate Host for Configuration API
To host the configuration API separately from IdentityServer:

#### Create a new empty web application
```bash
dotnet new web -n Configuration
```

#### Add the Duende.IdentityServer.Configuration package
```bash
cd Configuration
dotnet add package Duende.IdentityServer.Configuration
```

#### Configure Services
```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>";
);
```
The Configuration API feature is included in the IdentityServer Business edition
license and higher. Use the same license key for IdentityServer and the
Configuration API.

#### Add and configure the store implementation

The Configuration API uses the `IClientConfigurationStore` abstraction to
persist new clients to the configuration store. Your Configuration API host
needs an implementation of this interface. You can either use the built-in
Entity Framework based implementation, or implement the interface yourself. See
[the IClientConfigurationStore reference](reference/store) for
more details. If you wish to use the built-in implementation, install its NuGet
package and add it to DI.

```bash
dotnet add package Duende.IdentityServer.Configuration.EntityFramework
```

```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>"
).AddClientConfigurationStore();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddConfigurationDbContext<ConfigurationDbContext>(options =>
{
    options.ConfigureDbContext = builder => builder.UseSqlite(connectionString);
});
```

#### Map Configuration Endpoints
```cs
app.MapDynamicClientRegistration().RequireAuthorization("DCR");
```
`MapDynamicClientRegistration` registers the DCR endpoints and returns an
`IEndpointConventionBuilder` which you can use to define authorization
requirements for your DCR endpoint. See [Authorization](authorization) for more details.

## Shared Host for Configuration API and IdentityServer
To host the configuration API in the same host as IdentityServer:

#### Add the Duende.IdentityServer.Configuration package
```bash
dotnet add package Duende.IdentityServer.Configuration
```

#### Add the Configuration API's services to the service collection:
```cs
builder.Services.AddIdentityServerConfiguration();
```

#### Add and configure the store implementation

The Configuration API uses the `IClientConfigurationStore` abstraction to
persist new clients to the configuration store. Your Configuration API host
needs an implementation of this interface. You can either use the built-in
Entity Framework-based implementation, or implement the interface yourself.  See
[the IClientConfigurationStore reference](reference/store) for
more details. If you wish to use the built-in implementation, install its NuGet
package and add it to DI.

```bash
dotnet add package Duende.IdentityServer.Configuration.EntityFramework
```

```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>"
).AddClientConfigurationStore();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddConfigurationDbContext<ConfigurationDbContext>(options =>
{
    options.ConfigureDbContext = builder => builder.UseSqlite(connectionString);
});
```
#### Map Configuration Endpoints:
```cs
app.MapDynamicClientRegistration().RequireAuthorization("DCR");

```
`MapDynamicClientRegistration` registers the DCR endpoints and returns an
`IEndpointConventionBuilder` which you can use to define authorization
requirements for your DCR endpoint. See [Authorization](authorization) for more details.
