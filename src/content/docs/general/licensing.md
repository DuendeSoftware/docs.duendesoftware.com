---
title: "Licensing"
description: "Details about Duende IdentityServer and BFF licensing requirements, editions, configuration options, and trial mode functionality."
sidebar:
  order: 1
tableOfContents:
  minHeadingLevel: 1
  maxHeadingLevel: 4
redirect_from:
  - /licensekey/
  - /licenseKey/
  - /trial-mode/
  - /identityserver/v5/fundamentals/license_key/
  - /identityserver/v6/fundamentals/license_key/
  - /identityserver/v7/fundamentals/license_key/  
---

Duende products, except for our [open source tools](https://duendesoftware.com/products/opensource),
require a license for production use. The [Duende Software website](https://duendesoftware.com/) provides an overview of
different products and license editions. 

Licenses can be configured via a file system, programmatic startup, or external configuration services like Azure Key Vault,
with trial mode available for development and testing.

## IdentityServer

Duende IdentityServer requires a license for production use, with three editions available (Starter, Business, and
Enterprise) that offer various features based on organizational needs. A [community edition](https://duendesoftware.com/products/communityedition/)
is available as well.

:::note[Free for development]
IdentityServer is [free](#trial-mode) for development, testing and personal projects, but production use
requires a [license](https://duendesoftware.com/products/identityserver).
:::

### Editions

There are three license editions which include different [features](https://duendesoftware.com/products/features).

#### Starter Edition

The Starter edition includes the core OIDC and OAuth protocol implementation. This is an
economical option that is a good fit for organizations with basic needs. It's also a great
choice if you have an aging [IdentityServer4 implementation that needs to be updated](/identityserver/upgrades/identityserver4-to-duende-identityserver-v7.mdx)
and licensed. The Starter edition includes all the features that were part of
IdentityServer4, along with support for the latest .NET releases, improved observability
through [OpenTelemetry support](/identityserver/diagnostics/otel.md), and years of bug fixes and enhancements.

#### Business Edition

The Business edition adds additional features that go beyond the core protocol support
included in the Starter edition. This is a popular license because it adds the most
commonly needed tools and features outside a basic protocol implementation. Feature
highlights include support for server side sessions and automatic signing key management.

#### Enterprise Edition

Finally, the Enterprise edition includes everything in the Business edition and adds
support for features that are typically used by enterprises with particularly complex
architectures or that handle particularly sensitive data. Highlights include resource
isolation, the OpenId Connect CIBA flow, and dynamic federation. This is the best option
when you have a specific threat model or architectural need for these features.

### Redistribution

If you want to redistribute Duende IdentityServer to your customers as part of a product,
you can use our [redistributable license](https://duendesoftware.com/products/identityserverredist).

### License Validation and Logging

The license is validated at startup and during runtime. All license validation is
self-contained and does not leave the host. There are no outbound network calls related
to license validation.

#### Startup Validation

At startup, IdentityServer first checks for a license. If there is no license configured,
IdentityServer logs a warning indicating that a license is required in a production
deployment and enters [Trial Mode](#trial-mode).

Next, assuming a license is configured, IdentityServer compares its configuration to the
license. If there are discrepancies between the license and the configuration,
IdentityServer will write log messages indicating the nature of the problem.

#### Runtime Validation

Most common licensing issues, such as expiration of the license or configuring more
clients than are included in the license do not prevent IdentityServer from functioning. We
trust our customers, and we don't want a simple oversight to cause an outage. However, some
features will be disabled at runtime if your license does not include them, including:

- [Server Side Sessions](/identityserver/ui/server-side-sessions/index.md)
- [Demonstrating Proof-of-Possession (DPoP)](/identityserver/tokens/pop.md)
- [Resource Isolation](/identityserver/fundamentals/resources/isolation.md)
- [Pushed Authorization Requests (PAR)](/identityserver/tokens/par.md)
- [Dynamic Identity Providers](/identityserver/ui/login/dynamicproviders.md)
- [Client Initiated Backchannel Authentication (CIBA)](/identityserver/ui/ciba.md)

Again, the absence of a license is permitted for development and testing, and therefore
does not disable any of these features. Similarly, using an expired license that includes
those features does not cause those features to be disabled.

#### Trial Mode

Using IdentityServer without a license is considered Trial Mode. In Trial Mode, all
enterprise features are enabled. Trial Mode is limited to 500 protocol requests. This
includes all HTTP requests that IdentityServer itself handles, such as requests for the
discovery, authorize, and token endpoints. UI requests, such as the login page, are not
included in this limit. Beginning in IdentityServer 7.1, IdentityServer will log a warning
when the trial mode threshold is exceeded:

```text
You are using IdentityServer in trial mode and have exceeded the trial 
threshold of 500 requests handled by IdentityServer. In a future version, 
you will need to restart the server or configure a license key to continue testing.
```

In a future version, IdentityServer will shut down at that time instead.

:::note
When operating non-production environments, such as development, test, or QA, without a valid license key,
you may run into this trial mode limitation.

To prevent your non-production IdentityServer from shutting down in the future, you can use your
production license key. IdentityServer is [free](#trial-mode) for development, testing and personal projects,
and we support using your production license in these environments when trial mode is not sufficient.

If you have feedback on trial mode, or specific use cases where you'd prefer other options,
please [open a community discussion](https://github.com/DuendeSoftware/community/discussions).
:::

#### Redistribution

We understand that when IdentityServer is redistributed, log messages from the licensing
system are not likely to be very useful to your redistribution customers. For that reason,
in a redistribution the severity of log messages from the license system is turned all the
way down to the trace level.

We also appreciate that it might be cumbersome to deploy updated licenses in this scenario,
especially if the deployment of your software does not coincide with the duration of the
IdentityServer license. In that situation, we ask that you update the license key at the next
deployment of your software to your redistribution customers. Of course, you are always responsible
for ensuring that your license is renewed.

#### Log Severity

The severity of the log messages described above depend on the nature of the message and the type of
license.

| Type of Message               | Standard License | Redistribution License (development*) | Redistribution License (production*) |
|-------------------------------|------------------|---------------------------------------|--------------------------------------|
| Startup, missing license      | Warning          | Warning                               | Warning                              |
| Startup, license details      | Debug            | Debug                                 | Trace                                |
| Startup, valid license notice | Informational    | Informational                         | Trace                                |
| Startup, violations           | Error            | Error                                 | Trace                                |
| Runtime, violations           | Error            | Error                                 | Trace                                |

\* as determined by `IHostEnvironment.IsDevelopment()`

## BFF Security Framework

The Duende BFF Security Framework requires a license for production use, with two editions available (Starter and
Enterprise) that offer various features based on organizational needs.

:::note[Trial mode]
Duende BFF has a [limited trial mode](#bff-trial-mode) for development and testing. For small organizations or personal
projects, consider the [community edition](https://duendesoftware.com/products/communityedition/). For production use,
a [license](https://duendesoftware.com/products/bff) is required.
:::

### Editions

There are two license editions that [include different functionality](https://duendesoftware.com/products/bff).

### Redistribution

If you want to redistribute Duende BFF to your customers as part of a product,
you can use our [Duende IdentityServer redistributable license](https://duendesoftware.com/products/identityserverredist),
which includes the BFF Security Framework license.

### License Validation and Logging

The BFF license is validated during runtime. All license validation is self-contained and does not leave the host.
There are no outbound network calls related to license validation.

#### BFF v3.1+ Runtime Validation

BFF v3.1 does not technically enforce the presence of a license key.

At runtime, if no license is present, an error message will be logged indicating future versions of the product will be
limited in their functionality, specifically by restricting the number of sessions per host.

#### BFF v4 Runtime Validation

BFF v4 requires a valid license in production environments. If no license is present, [a limited trial mode](#bff-trial-mode)
is configured by BFF v4.

The number of frontends permitted for use with the BFF v4 license is explicitly defined in your license key. The software
will log a message indicating the number of frontends configured versus the number licensed. Any frontends that are configured
beyond the licensed quantity will result in additional frontends not being permitted.

A single "grace" frontend may be added beyond the licensed count, which will be logged as an error but will not be
technically prevented from operating.

:::note[BFF v3 and v4 License Compatibility]
Existing BFF v3 licenses are valid for a single-frontend-per-deployment configuration. Under a v3 license, you
can deploy a separate, single-frontend BFF v3 or v4 instance for up to three distinct applications.
The v3 license, however, does not grant access to the v4 multi-frontend feature.
:::

#### BFF Trial Mode

Using BFF without a license is considered Trial Mode. In Trial Mode, BFF will be limited to a maximum of
five (5) sessions per host. Any sessions exceeding this limit will result in error logging.
This session limit is not distributed or shared across multiple nodes.

:::note
When operating non-production environments, such as development, test, or QA, without a valid license key,
you may run into this trial mode limitation.

If you require a larger number of sessions, we support using your production license in these environments
when trial mode is not enough.
:::

## License Key

The license key can be configured in one of two ways:

* Via a well-known file on the file system
* Programmatically in your startup code

You can also use other configuration sources such as Azure Key Vault, by using the
programmatic approach.

:::note[Redistributable license]
If you use our [redistributable license](https://duendesoftware.com/products/identityserverredist),
we recommend loading the license at startup from an embedded resource.
:::

We consider the license key to be private to your organization, but not necessarily a secret. If you're using private
source control that is scoped to your organization, storing your license key within it is acceptable.

### File System

Duende products like IdentityServer and the BFF Security Framework look for a file named `Duende_License.key` in the
[ContentRootPath](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.hosting.ihostenvironment.contentrootpath?#microsoft-extensions-hosting-ihostenvironment-contentrootpath)
of your application. If present, the content of the file will be used as the license key.

### Startup

If you prefer to load the license key programmatically, you can do so in your startup
code. This allows you to use the ASP.NET configuration system to load the license key from
any [configuration provider](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-7.0#cp), including environment variables, `appsettings.json`, 
external configuration services such as Azure App Configuration, Azure Key Vault, etc.

#### IdentityServer

The `AddIdentityServer` method accepts a lambda expression to configure various options in
your IdentityServer, including the `LicenseKey`. Set the value of this property to the
content of the license key file.

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    // the content of the license key file
    options.LicenseKey = "eyJhbG...";
});
```

#### BFF Security Framework

The `AddBff` method accepts a lambda expression to configure various options in
your BFF host, including the `LicenseKey`. Set the value of this property to the
content of the license key file.

```csharp
// Program.cs
builder.Services.AddBff(options =>
{
    // the content of the license key file
    options.LicenseKey = "eyJhbG...";
});
```

### Azure Key Vault

When deploying your application to Microsoft Azure, you can make use of
[Azure Key Vault](https://azure.microsoft.com/products/key-vault/) to load the Duende license key at startup.

Similarly to setting the license key programmatically, you can use the `AddIdentityServer`
or `AddBff` method, and use the overload that accepts a lambda expression to configure the `LicenseKey` property.

```csharp
// Program.cs
var keyVaultUrl = new Uri("https://<YourKeyVaultName>.vault.azure.net/"); 

var secretClient = new Azure.Security.KeyVault.Secrets.SecretClient(
    keyVaultUrl, 
    new Azure.Identity.DefaultAzureCredential()
);

KeyVaultSecret licenseKeySecret = secretClient.GetSecret("<YourSecretName>");
var licenseKey = licenseKeySecret.Value;

// Inject the secret (license key) into the IdentityServer configuration
builder.Services.AddIdentityServer(options =>
{
    options.LicenseKey = licenseKey;
});
```

If you are using [Azure App Configuration](https://azure.microsoft.com/products/app-configuration/),
you can use a similar approach to load the license key into your application host.