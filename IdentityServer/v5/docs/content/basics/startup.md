---
title: "Adding DI and middleware to Startup"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

You add Duende IdentityServer to the ASP.NET Core DI system by calling *AddIdentityServer* in your startup class:

```cs
public void ConfigureServices(IServiceCollection services)
{
    var builder = services.AddIdentityServer();
}
```

{{% notice note %}}
Many of the fundamental configuration settings can be set on the options. See the *[IdentityServerOptions]({{< ref "options" >}})* reference for more details.
{{% /notice %}}

