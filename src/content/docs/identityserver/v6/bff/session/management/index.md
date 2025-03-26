---
title: "BFF Session Management Endpoints"
menuTitle: "Session Management Endpoints"
weight: 20
---

Duende.BFF adds endpoints for performing typical session-management operations such as triggering login and logout and getting information about the currently logged-on user. These endpoint are meant to be called by the frontend.

In addition Duende.BFF adds an implementation of the OpenID Connect back-channel notification endpoint to overcome the restrictions of third party cookies in front-channel notification in modern browsers.

You enable the endpoints by adding the relevant services into the DI container:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // Add BFF services to DI - also add server-side session management
    services.AddBff(options => 
    {
        // default value
        options.ManagementBasePath = "/bff";
    };

    // rest omitted
}
```

Endpoint routing is used to map the management endpoints:

```csharp
public void Configure(IApplicationBuilder app)
{
    // rest omitted

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapBffManagementEndpoints();
    });
```

*MapBffManagementEndpoints* adds all BFF management endpoints. You can also map each endpoint individually by calling the various *MapBffManagementXxxEndpoint* methods, for example *endpoints.MapBffManagementLoginEndpoint()*.

The following pages describe the default behavior of the management endpoints. See the [extensibility](/identityserver/v6/bff/extensibility) section for information about how to customize the behavior of the endpoints.

TODO LIST CHILDREN HERE
