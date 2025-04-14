---
title: "BFF Diagnostics Endpoint Extensibility"
date: 2022-12-29T10:22:12+02:00
sidebar:
  order: 70
  label: "Diagnostics"
redirect_from:
  - /bff/v2/extensibility/management/diagnostics/
  - /bff/v3/extensibility/management/diagnostics/
  - /identityserver/v5/bff/extensibility/management/diagnostics/
  - /identityserver/v6/bff/extensibility/management/diagnostics/
  - /identityserver/v7/bff/extensibility/management/diagnostics/
---

The BFF diagnostics endpoint can be customized by implementing the *IDiagnosticsService* or by extending *DefaultDiagnosticsService*, its default implementation.

## Request Processing
*ProcessRequestAsync* is the top level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

For example, you could take whatever actions you need before normal processing of the request like this:

```csharp
public override Task ProcessRequestAsync(HttpContext context)
{
    // Custom logic here

    return base.ProcessRequestAsync(context);
}
```