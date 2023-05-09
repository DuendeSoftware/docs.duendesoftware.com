---
title: Installation and Hosting
weight: 10
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

1. Create a new empty web application that will host the Configuration API endpoints:
```
dotnet new web -n Configuration
```

2. Add the Duende.IdentityServer.Configuration nuget package to the new application
```
cd Configuration
dotnet add package Duende.IdentityServer.Configuration
```

3. Add the Configuration API's services to the service collection, and set its license key, along with any other options you need:
```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>";
);
```
The Configuration API feature is included in the IdentityServer Business edition license and higher. Use the same license key for IdentityServer and the Configuration API.

4. Add and configure the store implementation
The Configuration API uses the *IClientConfigurationStore* abstraction to persist new clients to the configuration store. Your Configuration API host needs an implementation of this interface. You can either use the built-in Entity Framework-based implementation, or implement the interface yourself. See [the IClientConfigurationStore reference]({{< ref "./reference/store" >}}) for more details. 

```cs
builder.Services.AddIdentityServerConfiguration(opt =>
    opt.LicenseKey = "<license>"
).AddClientConfigurationStore();
```

5. Map the DCR endpoints in the pipeline:
```cs
app.MapDynamicClientRegistration().RequireAuthorization("DCR");
```
*MapDynamicClientRegistration* registers the DCR endpoints and returns an *IEndpointConventionBuilder* which you can use to define authorization requirements for your DCR endpoint. See [Authorization]({{< ref "./authorization" >}}) for more details.

## Shared Host for Configuration API and IdentityServer
1. Add the Duende.IdentityServer.Configuration nuget package to the IdentityServer host
```
cd Configuration
dotnet add package Duende.IdentityServer.Configuration
```

2. Add the Configuration API's services to the service collection:
```cs
builder.Services.AddIdentityServerConfiguration();
```

3. Add and configure the store implementation
The Configuration API uses the *IClientConfigurationStore* abstraction to persist new clients to the configuration store. Your Configuration API host needs an implementation of this interface. You can either use the built-in Entity Framework-based implementation, or implement the interface yourself.  See [the IClientConfigurationStore reference]({{< ref "./reference/store" >}}) for more details. 

4. Map the DCR endpoints in the pipeline:
```cs
app.MapDynamicClientRegistration().RequireAuthorization("DCR");

```
*MapDynamicClientRegistration* registers the DCR endpoints and returns an *IEndpointConventionBuilder* which you can use to define authorization requirements for your DCR endpoint. See [Authorization]({{< ref "./authorization" >}}) for more details.
