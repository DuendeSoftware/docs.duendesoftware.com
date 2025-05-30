---
title: "Hosting"
description: Learn how to host and configure Duende IdentityServer in ASP.NET Core applications by adding services and middleware to the pipeline
sidebar:
  order: 10
redirect_from:
  - /identityserver/v5/fundamentals/hosting/
  - /identityserver/v6/fundamentals/hosting/
  - /identityserver/v7/fundamentals/hosting/
---

You add the Duende IdentityServer engine to any ASP.NET Core application by adding the relevant services to the
dependency injection (DI) system and adding the middleware to the processing pipeline.

:::note
While technically you could share the ASP.NET Core host between Duende IdentityServer, clients or APIs. We recommend
putting your IdentityServer into a separate application.
:::

## Dependency Injection System

You add the necessary services to the ASP.NET Core service provider by calling `AddIdentityServer` at application startup:

```cs
//Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{ 
    // ...
});
```

Many of the fundamental configuration settings can be set on the options. See the
[`IdentityServerOptions`](/identityserver/reference/options) reference for more details.

The builder object has a number of extension methods to add additional services to the ASP.NET Core service provider.
You can see the full list in the [reference](/identityserver/reference/di) section, but very commonly you start by
adding the configuration stores for clients and resources, e.g.:

```cs
//Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
```

The above is using the in-memory stores, but we also support EntityFramework-based implementations and custom stores.
See [here](/identityserver/data) for more information.

## Request Pipeline

:::note
`UseIdentityServer` includes a call to `UseAuthentication`, so it’s not necessary to have both.
:::

You need to add the Duende IdentityServer middleware to the pipeline by calling `UseIdentityServer`.

Since ordering is important in the pipeline, you typically want to put the IdentityServer middleware after the static
files, but before the UI framework like MVC.

This would be a very typical minimal pipeline:

```cs
//Program.cs
app.UseStaticFiles();

app.UseRouting();
app.UseIdentityServer();
app.UseAuthorization();

app.MapDefaultControllerRoute();
```


