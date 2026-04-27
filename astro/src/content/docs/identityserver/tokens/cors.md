---
title: "Calling Endpoints from JavaScript"
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: CORS
  order: 200
redirect_from:
  - /identityserver/v5/tokens/cors/
  - /identityserver/v6/tokens/cors/
  - /identityserver/v7/tokens/cors/
---

In JavaScript-based clients, some endpoints like the token endpoint (but also discovery) will be accessed via Ajax
calls.

Given that your IdentityServer will most likely be hosted on a different origin than these clients, this implies
that [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (CORS) will need to be
configured.

## Client-based CORS Configuration

One approach to configuring CORS is to use the `AllowedCorsOrigins` collection on
the [client configuration](/identityserver/reference/models/client.md#authentication--session-management).
Add the origin of the client to the collection and the default configuration in IdentityServer will consult these
values to allow cross-origin calls from the origins.

:::note
Be sure to use an origin (not a URL) when configuring CORS. For example: `https://foo:123/` is a URL, whereas
`https://foo:123` is an origin.
:::

This default CORS implementation will be in use if you are using either the "in-memory" or EF-based client configuration
that we provide.
If you define your own `IClientStore`, then you will need to implement your own custom CORS policy service (see below).

## Custom Cors Policy Service

Duende IdentityServer allows the hosting application to implement the `ICorsPolicyService` to completely control the
CORS policy.

The single method to implement is: *Task<bool> IsOriginAllowedAsync(string origin)*.
Return `true` if the `origin` is allowed, `false` otherwise.

Once implemented, register the implementation in the ASP.NET Core service provider and IdentityServer will then use your custom implementation.

### DefaultCorsPolicyService

If you wish to hard-code a set of allowed origins, then there is a pre-built `ICorsPolicyService` implementation
you can use called `DefaultCorsPolicyService`.

This would be configured as a singleton in DI, and hard-coded with its `AllowedOrigins` collection, or setting the flag
`AllowAll` to `true` to allow all origins.

For example, in `ConfigureServices`:

```csharp
// Program.cs
builder.Services.AddSingleton<ICorsPolicyService>((container) =>
{
    var logger = container.GetRequiredService<ILogger<DefaultCorsPolicyService>>();

    return new DefaultCorsPolicyService(logger) 
    {
        AllowedOrigins = { "https://foo", "https://bar" }
    };
});
```

:::note
Use `AllowAll` with caution.
:::

## Mixing IdentityServer's CORS Policy With ASP.NET Core's CORS Policies

IdentityServer uses the CORS middleware from ASP.NET Core to provide its CORS implementation.
It is possible that your application that hosts IdentityServer might also require CORS for its own custom endpoints.
In general, both should work together in the same application, providing the call to `app.UseCors("mypolicy");` is
called after the call to `app.UseIdentityServer();`.

Your code should use the documented CORS features from ASP.NET Core without regard to IdentityServer.
This means you should define policies and register the middleware as normal.
If your application defines policies in `ConfigureServices`, then those should continue to work in the same places you
are using them (either where you configure the CORS middleware or where you use the MVC `EnableCors` attributes in your
controller code).
If instead you define an inline policy in the use of the CORS middleware (via the policy builder callback), then that
too should continue to work normally.

The one scenario where there might be a conflict between your use of the ASP.NET Core CORS services and IdentityServer
is if you decide to create a custom `ICorsPolicyProvider`.
Given the design of the ASP.NET Core's CORS services and middleware, IdentityServer implements its own custom
`ICorsPolicyProvider` and registers it in the ASP.NET Core service provider.
Fortunately, the IdentityServer implementation is designed to use the decorator pattern to wrap any existing
`ICorsPolicyProvider` that is already registered in the service provider.
What this means is that you can also implement the `ICorsPolicyProvider`, but it needs to be registered prior to
IdentityServer in the service provider (e.g. in `ConfigureServices`).

:::note
IdentityServer requires a `ICorsPolicyService` implementation to control CORS for the endpoints it hosts, like the [OIDC Token](/identitymodel/endpoints/token.md) and [OIDC UserInfo](/identitymodel/endpoints/userinfo.md) endpoints. If you prefer to use ASP.NET Core's CORS Policy programming model, you will also need to add a `ICorsPolicyService` implementation for any CORS settings on the IdentityServer endpoints.
## Mixing IdentityServer's CORS Policy With ASP.NET Core's CORS Policies

Duende IdentityServer builds upon the standard ASP.NET Core CORS middleware. If your application needs to support CORS for both IdentityServer endpoints and your own custom API endpoints, they can coexist by following these integration rules.

### Middleware Registration Order

For both systems to function correctly, the order of registration in your middleware pipeline is important. Always place the standard CORS middleware *after* the IdentityServer middleware:

```csharp
app.UseIdentityServer();
app.UseCors("MyCustomPolicy"); // Must come after IdentityServer
```

### Custom CORS Policies

You should continue to use ASP.NET Core CORS features exactly as documented by Microsoft. Your existing configurations will not interfere with IdentityServer:

* **Named Policies:** Policies defined in `AddCors` and referenced via `[EnableCors]` attributes or middleware will work as expected.
* **Inline Policies:** Defining a policy directly within `app.UseCors(builder => ...)` is fully supported.

### Advanced Customization: `ICorsPolicyProvider`

The only potential conflict occurs if you implement a custom [`ICorsPolicyProvider`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.cors.infrastructure.icorspolicyprovider).

IdentityServer registers its own `ICorsPolicyProvider` to handle its internal endpoints, such as the [token](/identitymodel/endpoints/token.md) and [user info](/identitymodel/endpoints/userinfo.md) endpoints. To ensure both your custom logic and IdentityServer's logic run:

1.  **Register your `ICorsPolicyProvider` first:** Register your custom provider in `ConfigureServices` *before* calling `AddIdentityServer`.
2.  **The Decorator Pattern:** IdentityServer automatically detects your provider and wraps it. It will consult your provider first; if your provider doesn't handle the request, IdentityServer will then apply its own logic.

Note that while ASP.NET Core manages the middleware, IdentityServer uses an internal service called [`ICorsPolicyService`](/identityserver/reference/stores/cors-policy-service.md) to decide which origins are allowed to access its specific endpoints. If you prefer to use the ASP.NET Core CORS Policy programming model for everything, you will need to provide a custom `ICorsPolicyService` implementation that bridges your ASP.NET Core settings to IdentityServer's endpoints.
