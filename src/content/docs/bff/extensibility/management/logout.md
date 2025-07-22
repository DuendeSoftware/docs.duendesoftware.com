---
title: "BFF Logout Endpoint Extensibility"
date: 2022-12-30 10:55:24
sidebar:
  label: "Logout"
  order: 40
redirect_from:
  - /bff/v2/extensibility/management/logout/
  - /bff/v3/extensibility/management/logout/
  - /identityserver/v5/bff/extensibility/management/logout/
  - /identityserver/v6/bff/extensibility/management/logout/
  - /identityserver/v7/bff/extensibility/management/logout/
---

The BFF logout endpoint has extensibility points in two interfaces. The `ILogoutEndpoint` is the top-level abstraction that processes requests to the endpoint. This service can be used to add custom request processing logic. The `IReturnUrlValidator` ensures that the `returnUrl` parameter passed to the logout endpoint is safe to use.

## Request Processing

`ProcessRequestAsync` is the top-level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

For example, you could take whatever actions you need before normal processing of the request like this:

```csharp
public Task ProcessRequestAsync(HttpContext context, CancellationToken ct)
{
    // Custom logic here

    return base.ProcessRequestAsync(context);
}
```

## Return URL Validation

To prevent open redirector attacks, the `returnUrl` parameter to the logout endpoint must be validated. You can customize this validation by implementing the `IReturnUrlValidator` interface. The default implementation enforces that return URLs are local.
