---
title: "Management Endpoints"
date: 2020-09-10T08:22:12+02:00
order: 10
---

When you add Duende.BFF to DI - a default implementation for every management endpoint gets registered:

```cs
// management endpoints
services.AddTransient<ILoginService, DefaultLoginService>();
services.AddTransient<ILogoutService, DefaultLogoutService>();
services.AddTransient<IUserService, DefaultUserService>();
services.AddTransient<IBackchannelLogoutService, DefaultBackchannelLogoutService>();
```

You can add your own implementation, by overriding our default after calling *AddBff()*.

The interface of the management endpoints is pretty generic, and allows for inserting any custom logic:

```cs
public interface IBffEndpointService
{
    Task ProcessRequestAsync(HttpContext context);
}
```