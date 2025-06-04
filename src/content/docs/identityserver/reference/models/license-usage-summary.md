---
title: "License Usage Summary"
description: "Reference documentation for the LicenseUsageSummary class which provides detailed information about clients, issuers, and features used in Duende IdentityServer for self-auditing and license compliance."
date: 2025-01-07T12:00:00+02:00
sidebar:
  order: 90
redirect_from:
  - /identityserver/v5/reference/models/license_usage_summary/
  - /identityserver/v6/reference/models/license_usage_summary/
  - /identityserver/v7/reference/models/license_usage_summary/
---

## Duende.IdentityServer.Licensing.LicenseUsageSummary

The `LicenseUsageSummary` class allows developers to get a
detailed summary of clients, issuers, and features used
during the lifetime of an active .NET application for self-auditing
purposes.

* **`LicenseEdition`**

  Indicates the current IdentityServer instance's license edition.

* **`ClientsUsed`**

  A `string` collection of clients used with the current IdentityServer instance.

* **`IssuersUsed`**

  A `string` collection of issuers used with the current IdentityServer instance.

* **`FeaturesUsed`**

  A `string` collection of features has been used since the IdentityServer instance ran.

## Using LicenseUsageSummary with .NET Lifetime Events

In .NET, an [
`IHost`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.hosting.ihostapplicationlifetime)
implementation allows developers to subscribe to application
lifetime events, including **Application Started**, **Application Stopped**,
and **Application Stopping**. IdentityServer tracks usage metrics internally
and that information may be accessed by developers at any time during the application's lifetime
from the application's service collection using the following code snippet.

```csharp
// from a valid services scope
app.Services.GetRequiredService<LicenseUsageSummary>();
```

For self-auditing purposes, we recommend using the `IHost` lifetime event `ApplicationStopping` as shown
in the example below.

Note, `LicenseUsageSummary` is *`read-only`*.

```csharp
app.Lifetime.ApplicationStopping.Register(() =>
{
  var usage = app.Services.GetRequiredService<LicenseUsageSummary>();
  // Todo: Substitue a different logging mechanism
  Console.Write(Summary(usage));
});
```

Developers may also use common dependency injection techniques
such as property or constructor injection.

```csharp
// An ASP.NET Core MVC Controller
public class MyController : Controller
{
    public MyController(LicenseUsageSummary summary)
    {
        // use the summary information    
    }
}
```

Developers can use the license usage summary to determine if their organization is
within their current licensing tier or if they need to make adjustments to
stay within compliance of [Duende licensing terms](https://duendesoftware.com/products/identityserver).
