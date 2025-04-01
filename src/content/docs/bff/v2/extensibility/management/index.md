---
title: "BFF Management Endpoints Extensibility"
menuTitle: "Management Endpoints"
date: 2020-09-10T08:22:12+02:00
order: 10
---

The behavior of each [management endpoint](/bff/v2/session/management) is defined in a service. When you add Duende.BFF to DI, a default implementation for every management endpoint gets registered:

```csharp
// management endpoints
builder.Services.AddTransient<ILoginService, DefaultLoginService>();
builder.Services.AddTransient<ISilentLoginService, DefaultSilentLoginService>();
builder.Services.AddTransient<ISilentLoginCallbackService, DefaultSilentLoginCallbackService>();
builder.Services.AddTransient<ILogoutService, DefaultLogoutService>();
builder.Services.AddTransient<IUserService, DefaultUserService>();
builder.Services.AddTransient<IBackchannelLogoutService, DefaultBackchannelLogoutService>();
builder.Services.AddTransient<IDiagnosticsService, DefaultDiagnosticsService>();
```

You can add your own implementation by overriding the default after calling *AddBff()*.

The management endpoint services all inherit from the *IBffEndpointService*, which provides a general-purpose mechanism to add custom logic to the endpoints. 

```cs
public interface IBffEndpointService
{
    Task ProcessRequestAsync(HttpContext context);
}
```

None of the endpoint services contain additional members beyond *ProcessRequestAsync*.

You can customize the behavior of the endpoints either by implementing the appropriate interface or by extending the default implementation of that interface. In many cases, extending the default implementation is preferred, as this allows you to keep most of the default behavior by calling the base *ProcessRequestAsync* from your derived class. Several of the default endpoint service implementations also define virtual methods that can be overridden to customize their behavior with more granularity. See the following pages for details on those extension points.

TODO LIST CHILDREN HERE