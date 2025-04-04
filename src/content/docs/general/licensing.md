---
title: "Licensing"
description: "information pertaining to Duende products"
sidebar:
  order: 1
---

Duende IdentityServer requires a license for production use, with three editions available (Starter, Business, and
Enterprise) that offer various features based on organizational needs. Licenses can be configured via a file system,
programmatic startup, or external configuration services like Azure Key Vault, with trial mode available for development
and testing. Learn more about each in the following sections.

:::note
IdentityServer is [free](#trial-mode) for development, testing and personal projects, but production use
requires a [license](https://duendesoftware.com/products/identityserver).
:::

## Editions

There are three license editions which include different [features](https://duendesoftware.com/products/features).

### Starter Edition

The Starter edition includes the core OIDC and OAuth protocol implementation. This is an
economical option that is a good fit for organizations with basic needs. It's also a great
choice if you have an aging IdentityServer4 implementation that needs to be updated and
licensed. The Starter edition includes all the features that were part of
IdentityServer4, along with support for the latest .NET releases, improved observability
through OTEL support, and years of bug fixes and enhancements.

### Business Edition

The Business edition adds additional features that go beyond the core protocol support
included in the Starter edition. This is a popular license because it adds the most
commonly needed tools and features outside a basic protocol implementation. Feature
highlights include support for server side sessions and automatic signing key management.

### Enterprise Edition

Finally, the Enterprise edition includes everything in the Business edition and adds
support for features that are typically used by enterprises with particularly complex
architectures or that handle particularly sensitive data. Highlights include resource
isolation, the OpenId Connect CIBA flow, and dynamic federation. This is the best option
when you have a specific threat model or architectural need for these features.

## License Key

The license key can be configured in one of two ways:

* Via a well-known file on the file system
* Programmatically in your startup code

You can also use other configuration sources such as Azure Key Vault, by using the
programmatic approach.

:::note
If you want to redistribute Duende IdentityServer as part of a product to your customers,
you can use our [redistributable license](https://duendesoftware.com/products/identityserverredist).
To include the license key with your product, we recommend loading it at startup
from an embedded resource.
:::

### File System

IdentityServer looks for a file named `Duende_License.key` in the
[ContentRootPath](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.hosting.ihostenvironment.contentrootpath?view=dotnet-plat-ext-8.0#microsoft-extensions-hosting-ihostenvironment-contentrootpath).
If present, the content of the file will be used as the license key.

We consider the license key to be private to your organization, but not necessarily a secret.
If you're using private source control that is scoped to your organization,
storing your license key within it is acceptable.

### Startup

If you prefer to load the license key programmatically, you can do so in your startup
code. This allows you to use the ASP.NET configuration system to load the license key from
any [configuration provider](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-7.0#cp),
including environment variables, appsettings.json, an external configuration service such
as Azure App Configuration, etc.

The `AddIdentityServer` method accepts a lambda expression to configure various options in
your IdentityServer, including the `LicenseKey`. Set the value of this property to the
content of the license key file.

```csharp
builder.Services.AddIdentityServer(options =>
{
    options.LicenseKey = "eyJhbG..."; // the content of the license key file
});

```

### Azure Key Vault

When deploying IdentityServer to Microsoft Azure, you can make use of
[Azure Key Vault](https://azure.microsoft.com/products/key-vault/) to load the IdentityServer
license key at startup.

Similarly to setting the license key programmatically, you can use the `AddIdentityServer` method
and use the overload that accepts a lambda expression to configure the `LicenseKey` property for
your IdentityServer.

```csharp
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
you can use a similar approach to load the license key into your IdentityServer host.

## License Validation and Logging

The license is validated at startup and during runtime. All license validation is
self-contained and does not leave the host. There are no outbound calls related to license
validation.

### Startup Validation

At startup, IdentityServer first checks for a license. If there is no license configured,
IdentityServer logs a warning indicating that a license is required in a production
deployment and enters [Trial Mode](#trial-mode).

Next, assuming a license is configured, IdentityServer compares its configuration to the
license. If there are discrepancies between the license and the configuration,
IdentityServer will write log messages indicating the nature of the problem.

### Runtime Validation

Most common licensing issues, such as expiration of the license or configuring more
clients than is included in the license do not prevent IdentityServer from functioning. We
trust our customers, and we don't want a simple oversight to cause an outage. However, some
features will be disabled at runtime if your license does not include them, including:

- Server Side Sessions
- DPoP
- Resource Isolation
- PAR
- Dynamic Identity Providers
- CIBA

Again, the absence of a license is permitted for development and testing, and therefore
does not disable any of these features. Similarly, using an expired license that includes
those features does not cause those features to be disabled.

### Trial Mode

Using IdentityServer without a license is considered Trial Mode. In Trial Mode, all
enterprise features are enabled. Trial Mode is limited to 500 protocol requests. This
includes all HTTP requests that IdentityServer itself handles, such as requests for the
discovery, authorize, and token endpoints. UI requests, such as the login page, are not
included in this limit. Beginning in IdentityServer 7.1, IdentityServer will log a warning
when the trial mode threshold is exceeded:

```text
You are using IdentityServer in trial mode and have exceeded the trial threshold of 500 requests handled by IdentityServer. In a future version, you will need to restart the server or configure a license key to continue testing.
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

## Redistribution

We understand that when IdentityServer is redistributed, log messages from the licensing
system are not likely to be very useful to your redistribution customers. For that reason,
in a redistribution the severity of log messages from the license system is turned all the
way down to the trace level. We also appreciate that it might be cumbersome to deploy
updated licenses in this scenario, especially if the deployment of your software does not
coincide with the duration of the IdentityServer license. In that situation, we ask that you
update the license key at the next deployment of your software to your redistribution customers.
Of course, you are always responsible for ensuring that your license is renewed.

## Log Severity

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
