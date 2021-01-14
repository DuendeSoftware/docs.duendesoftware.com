---
title: "Hosting"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

You add the Duende IdentityServer engine to any ASP.NET Core application by adding the relevant services to the dependency injection (DI) system and adding the middleware to the processing pipeline.

{{% notice note %}}
While technically you could share the ASP.NET Core host between Duende IdentityServer, clients or APIs. We recommend putting your IdentityServer into a separate application.
{{% /notice %}}

## DI system
You add the necessary services to the  DI system by calling *AddIdentityServer* in your startup class:

```cs
public void ConfigureServices(IServiceCollection services)
{
    var builder = services.AddIdentityServer(options => { ... });
}
```

Many of the fundamental configuration settings can be set on the options. See the *[IdentityServerOptions]({{< ref "/reference/options" >}})* reference for more details.

The builder object has a number of extension methods to add additional services to DI.
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

## License Key

When deploying your IdentityServer to production, you will need to configure your license key.
This can be configured in one of two ways:
* Via a well-known file on the file system
* Programmatically in your startup code

### File System

Duende IdentityServer will look for a file called *Duende_IdentityServer_License.key* in the same directory as your hosting application.
If present, the contents of the file will be loaded as the license key.

### Startup

If you prefer to load the license key dynamically, you can in your startup code.
When calling *AddIdentityServer* from *ConfigureServices*, you can pass a lambda expression to configure various options in your IdentityServer.
The *LicenseKey* is one such setting. 
For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options =>
    {
        options.LicenseKey = "your_license_key";
    });
}
```
