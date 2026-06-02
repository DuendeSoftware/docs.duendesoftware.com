---
title: "License Information and Usage"
description: "Reference documentation for LicenseInformation and LicenseUsageSummary, which provide license details and usage metrics for self-auditing and license compliance in Duende IdentityServer."
date: 2026-05-28
sidebar:
  label: "License and Usage"
  order: 90
redirect_from:
  - /identityserver/v5/reference/models/license_usage_summary/
  - /identityserver/v6/reference/models/license_usage_summary/
  - /identityserver/reference/models/license-usage-summary/
---

## Duende.IdentityServer.Licensing.LicenseInformation

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>

The `LicenseInformation` class exposes details about the configured license.

:::note
An equivalent class named `IdentityServerLicense` exists in Duende IdentityServer v7.
:::

IdentityServer registers `LicenseInformation` as a singleton automatically. You do not need any additional setup to use it.

### Properties

* **`CompanyName`** (`string?`): Company name from the license.
* **`ContactInfo`** (`string?`): Contact information from the license.
* **`SerialNumber`** (`int?`): Serial number of the license.
* **`IssuedAt`** (`DateTimeOffset?`): Date and time when the license was issued.
* **`Expiration`** (`DateTimeOffset?`): Date and time when the license expires.
* **`IsConfigured`** (`bool`): `true` if a license was loaded and parsed successfully. Use this to check whether a license is present before displaying license details.
* **`EntitledSkus`** (`IReadOnlyCollection<string>`): SKU identifiers entitled by the license.

### Inject LicenseInformation

Because `LicenseInformation` is registered in DI automatically, you can inject it directly into your classes:

```csharp
// MyPage.cshtml.cs
public class MyPage(LicenseInformation license) : PageModel
{
    public void OnGet()
    {
        if (license.IsConfigured)
        {
            // display license.SerialNumber, license.Expiration, etc.
        }
    }
}
```

---

## Duende.IdentityServer.Licensing.LicenseUsageSummary

The `LicenseUsageSummary` class lets you get a detailed summary of clients, issuers, and features used 
during the lifetime of an active .NET application for self-auditing purposes.

### Properties

* **`EntitledSkus`** <span data-shb-badge data-shb-badge-variant="default">v8.0+</span>

  A `string` collection of SKU identifiers entitled by the configured license.

* **`LicenseEdition`** <span data-shb-badge data-shb-badge-variant="default">v7.1+</span>

  A `string` indicating the edition.

* **`ClientsUsed`**

  A `string` collection of clients used with the current IdentityServer instance.

* **`IssuersUsed`**

  A `string` collection of issuers used with the current IdentityServer instance.

* **`FeaturesUsed`**

  A `string` collection of human-readable feature names used since the IdentityServer instance started.

### Register LicenseUsageSummary services

To make `LicenseUsageSummary` available in your application, call the `AddLicenseSummary()` extension method
when registering IdentityServer:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddLicenseSummary();
```

### Use LicenseUsageSummary with .NET lifetime events

The [`IHost`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.hosting.ihostapplicationlifetime) interface lets you subscribe to application lifetime events, including **Application Started**,
**Application Stopped**, and **Application Stopping**. IdentityServer tracks usage metrics internally, and you can
access that information at any time during the application's lifetime from the service collection:

```csharp
// from a valid services scope
app.Services.GetRequiredService<LicenseUsageSummary>();
```

For self-auditing purposes, we recommend using the `ApplicationStopping` lifetime event:

Note: `LicenseUsageSummary` is read-only.

```csharp
app.Lifetime.ApplicationStopping.Register(() =>
{
    var usage = app.Services.GetRequiredService<LicenseUsageSummary>();
    // Substitute a different logging mechanism as needed
    Console.Write(Summary(usage));
});
```

You can also inject `LicenseUsageSummary` using standard dependency injection:

```csharp
// An ASP.NET Core MVC controller
public class MyController : Controller
{
    public MyController(LicenseUsageSummary summary)
    {
        // use the summary information
    }
}
```

Use the license usage summary to check whether your organization is within its current licensing allowance,
or needs to make adjustments to stay within the [Duende licensing terms](https://duendesoftware.com/products/identityserver).
