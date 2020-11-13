---
title: "Adding DI and middleware to Startup"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

You add the Duende IdentityServer engine to an ASP.NET application by adding the relevant services to the DI system and adding the middleware to the processing pipeline.

## DI system
Yo add the necessary services to the  DI system by calling *AddIdentityServer* in your startup class:

```cs
public void ConfigureServices(IServiceCollection services)
{
    var builder = services.AddIdentityServer(options => { ... });
}
```

Many of the fundamental configuration settings can be set on the options. See the *[IdentityServerOptions]({{< ref "/reference/options" >}})* reference for more details.

The builder object has a number of extension methods to add addtional services to DI.
You can see the full list in the [reference]({{< ref "/reference/di" >}}) section, but very commonly you start by adding the configuration stores for clients and resources, e.g.:

```cs
var builder = services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
```

The above is using the in-memory stores, but we also support EntityFramework-based implementations and custom stores. See [here]({{< ref "/data" >}}) for more information.

## Pipeline
You need to add the Duende IdentityServer middleware to the pipeline by calling *AddIdentityServer*.

Since ordering is important in the pipeline, you typically want to put the IdentityServer middleware after the static files, but before the UI framework like MVC.

This would be a very typical minimal pipeline:

```cs
public void Configure(IApplicationBuilder app)
{
    app.UseStaticFiles();
    
    app.UseRouting();
    app.UseIdentityServer();
    app.UseAuthorization();

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapDefaultControllerRoute();
    });
}
```

{{% notice note %}}
*UseIdentityServer* includes a call to *UseAuthentication*, so it’s not necessary to have both.
{{% /notice %}}
