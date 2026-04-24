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
the [client configuration](/identityserver/reference/v8/models/client.md#authentication--session-management).
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

Note that while ASP.NET Core manages the middleware, IdentityServer uses an internal service called [`ICorsPolicyService`](/identityserver/reference/v8/stores/cors-policy-service.md) to decide which origins are allowed to access its specific endpoints. If you prefer to use the ASP.NET Core CORS Policy programming model for everything, you will need to provide a custom `ICorsPolicyService` implementation that bridges your ASP.NET Core settings to IdentityServer's endpoints.
