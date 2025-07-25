---
title: "BFF Management Endpoints Extensibility"
sidebar:
  label: "Overview"
  order: 10
date: 2020-09-10T08:22:12+02:00
redirect_from:
  - /bff/v2/extensibility/management/
  - /bff/v3/extensibility/management/
  - /identityserver/v5/bff/extensibility/management/
  - /identityserver/v6/bff/extensibility/management/
  - /identityserver/v7/bff/extensibility/management/
---

The behavior of each [management endpoint](/bff/fundamentals/session/management) is defined in a service. When you add Duende.BFF to DI, a default implementation for every management endpoint gets registered:

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

You can add your own implementation by overriding the default after calling `AddBff()`.

The management endpoint services all inherit from the `IBffEndpointEndpoint`, which provides a general-purpose mechanism to add custom logic to the endpoints. 

```csharp
public interface IBffEndpointService
{
    Task ProcessRequestAsync(HttpContext context, CancellationToken ct);
}
```

None of the endpoint services contain additional members beyond `ProcessRequestAsync`.

You can customize the behavior of the endpoints either by implementing the appropriate interface or by extending the default implementation of that interface. In many cases, extending the default implementation is preferred, as this allows you to keep most of the default behavior by calling the base *ProcessRequestAsync* from your derived class. Several of the default endpoint service implementations also define virtual methods that can be overridden to customize their behavior with more granularity.