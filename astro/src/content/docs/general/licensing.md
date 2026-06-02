---
title: "Licensing"
description: "Details about Duende IdentityServer and BFF licensing requirements, editions, configuration options, and trial mode functionality."
date: 2026-05-29
sidebar:
  order: 1
tableOfContents:
  minHeadingLevel: 1
  maxHeadingLevel: 4
redirect_from:
  - /licensekey/
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

#### Lite Edition

The Lite edition includes the core OIDC and OAuth protocol implementation. This is an
economical option that is a good fit for organizations with basic needs. It's also a great
choice if you have an aging [IdentityServer4 implementation that needs to be updated](/identityserver/upgrades/identityserver4-to-duende-identityserver-v8.mdx)
and licensed. The Lite edition includes all the features that were part of
IdentityServer4, along with support for the latest .NET releases, improved observability
through [OpenTelemetry support](/identityserver/diagnostics/otel.md), and years of bug fixes and enhancements.

#### Standard Edition

The Standard edition adds additional features that go beyond the core protocol support
included in the Starter edition. This is a popular license because it adds the most
commonly needed tools and features outside a basic protocol implementation. Feature
highlights include resource isolation, the OpenId Connect CIBA flow support,
and server side sessions.

#### Advanced Edition

Finally, the Advanced edition includes everything in the Standard edition and adds
support for features that are typically used by enterprises with particularly complex
architectures or that handle particularly sensitive data. Highlights include
automatic key management, SAML, and priority developer support.

This is the best option when you have a specific threat model or architectural
need for these features.

#### Starter Edition (legacy)

The (legacy) Starter edition includes the core OIDC and OAuth protocol implementation.

#### Business Edition (legacy)

The (legacy) Business edition adds additional features that go beyond the core protocol support
included in the Starter edition. Feature highlights include support for server side sessions and
automatic signing key management.

#### Enterprise Edition (legacy)

The (legacy) Enterprise edition includes everything in the Business edition and adds
resource isolation, the OpenId Connect CIBA flow, and dynamic federation.

### Redistribution

If you want to redistribute Duende IdentityServer to your customers as part of a product,
you can use our [redistributable license](https://duendesoftware.com/products/identityserverredist).

### License Validation and Logging

All license validation happens at runtime and is self-contained. It does not leave the host,
and there are no outbound network calls related to license validation.

#### Startup Validation

IdentityServer loads and parses the license key at startup. If the key is present but invalid,
an error is logged at that point. Beyond that, no further checks happen at startup.
IdentityServer does not compare your configuration against the license at startup; that all happens at runtime,
when features are actively used.

:::note[IdentityServer 7 and earlier]
In v7 and earlier, IdentityServer performed validation checks at startup. If no license was configured,
it logged a warning and entered [Trial Mode](#trial-mode). If a license was configured, it compared the license
against the current configuration and logged any discrepancies it found.
:::

#### Runtime Validation

IdentityServer never blocks or disables features at runtime based on licensing. A licensing oversight
should never cause an outage. The runtime validator only logs; it does not prevent IdentityServer from functioning.

The following features are validated at runtime. If you use one of them without the
required license entitlement, IdentityServer logs a warning (rate-limited to once every
5 minutes per feature):

* [Server Side Sessions](/identityserver/ui/server-side-sessions/index.md)
* [Demonstrating Proof-of-Possession (DPoP)](/identityserver/tokens/pop.md)
* [Resource Isolation](/identityserver/fundamentals/resources/isolation/index.md)
* [Client Initiated Backchannel Authentication (CIBA)](/identityserver/ui/ciba.md)
* [Dynamic Identity Providers](/identityserver/ui/login/dynamicproviders.md)
* [Automatic Key Management](/identityserver/fundamentals/key-management.md)
* [Financial-Grade Security and Conformance Report](/identityserver/diagnostics/conformance-report.md)
* [SAML IdP and SAML Service Provider](/identityserver/saml/index.md)
* [User Management](/identityserver/usermanagement/index.mdx)

For quantized limits like client count and issuer count, IdentityServer logs a warning
when you exceed your licensed limit but stay within the grace threshold. If you exceed
the grace threshold, it logs an error instead. An expired license also results in an
error being logged.

:::note[IdentityServer 7 and earlier]
In IdentityServer 7 and earlier, some features were actually disabled at runtime when
the license did not include them. The features that could be disabled were: Server Side
Sessions, DPoP, Resource Isolation, PAR, Dynamic Identity Providers, and CIBA.
:::

:::tip
When rolling over to a renewed license, you can configure the new license before the old
license expires. While the expiration timestamp of a license is used to validate a license
is active, the start date is an administrative data point IdentityServer does not take
into account for license validation. In other words, you can safely configure the new
license before the old one lapses.
:::

#### Trial Mode

Running IdentityServer without a license is perfectly fine for development, testing, and personal projects.
There is no request limit and no automatic shutdown. All features remain available. The only difference you
will notice is that IdentityServer logs a warning when you use a licensed feature without a license configured:

```text
{FeatureName} is being used but no Duende license is configured.
Please start a conversation with us: https://duende.link/l/contact
```

These warnings are rate-limited to once per five minutes per feature, so they won't flood your logs.
You can silence them entirely by configuring a license key, even in non-production environments.

:::note
When running non-production environments (development, test, or QA) without a license key, you can use your
production license key to suppress the warnings. IdentityServer is [free](#trial-mode) for development, testing,
and personal projects, and using your production license in these environments is fully supported.

If you have feedback on trial mode, or specific use cases where you prefer other options, please 
[open a community discussion](https://github.com/DuendeSoftware/community/discussions).
:::

:::note[IdentityServer 7 and earlier]
In IdentityServer 7 and earlier, running without a license was called Trial Mode and was limited to 500 protocol requests.
This included all HTTP requests that IdentityServer itself handled, such as requests for the discovery, authorize,
and token endpoints. UI requests, such as the login page, were not included in this limit.

Beginning in IdentityServer 7.1, IdentityServer logged a warning when the trial mode threshold was exceeded:

```text
You are using IdentityServer in trial mode and have exceeded the trial 
threshold of 500 requests handled by IdentityServer. In a future version, 
you will need to restart the server or configure a license key to continue testing.
```

This limit is not currently being enforced.
:::

#### Redistribution

If you want to redistribute Duende IdentityServer to your customers as part of a product,
you can use our [redistributable license](https://duendesoftware.com/products/identityserverredist).

It can be cumbersome to deploy updated licenses in redistribution scenarios,
especially if your deployment cycle does not coincide with the duration of your IdentityServer license.
In that situation, update the license key at the next deployment to your redistribution customers.
You are always responsible for ensuring your license is renewed.

#### Log Severity

The severity of log messages depends on the nature of the message. All messages are rate-limited to once per 5 minutes per feature or SKU.

| Type of message                                   | Severity      |
|---------------------------------------------------|---------------|
| Feature used, no license configured               | Warning       |
| Feature used, not covered by license              | Warning       |
| Quantized limit exceeded (within grace threshold) | Warning       |
| Quantized limit exceeded (beyond grace threshold) | Error         |
| License expired                                   | Error         |
| License valid                                     | Informational |

:::note[IdentityServer 7 and earlier]
In IdentityServer 7 and earlier, log severity depended on both the nature of the message and the type of license.

| Type of Message               | Standard License | Redistribution License (development*) | Redistribution License (production*) |
|-------------------------------|------------------|---------------------------------------|--------------------------------------|
| Startup, missing license      | Warning          | Warning                               | Warning                              |
| Startup, license details      | Debug            | Debug                                 | Trace                                |
| Startup, valid license notice | Informational    | Informational                         | Trace                                |
| Startup, violations           | Error            | Error                                 | Trace                                |
| Runtime, violations           | Error            | Error                                 | Trace                                |

\* as determined by `IHostEnvironment.IsDevelopment()`
:::

## BFF Security Framework

The Duende BFF Security Framework requires a license for production use, with two editions available (Starter and
Enterprise) that offer various features based on organizational needs.

:::note[Trial mode]
Duende BFF has a [limited trial mode](#bff-trial-mode) for development and testing. For small organizations or personal
projects, consider the [community edition](https://duendesoftware.com/products/communityedition/). For production use,
a [license](https://duendesoftware.com/products/bff) is required.
:::

### Editions

BFF is a library designed to enhance the security of browser-based applications by moving authentication flows
to the server side. The Duende BFF Security Framework requires a license for production use, and is available in
two editions that [include different functionality](https://duendesoftware.com/products/bff) based on organizational
needs.

### Redistribution

If you want to redistribute Duende BFF to your customers as part of a product,
please [reach out to sales](https://duendesoftware.com/contact/sales).

### License Validation and Logging

The BFF license is validated during runtime. All license validation is self-contained and does not leave the host.
There are no outbound network calls related to license validation.

#### BFF v3.1+ Runtime Validation

BFF v3.1 does not technically enforce the presence of a license key.
At runtime, if no license is present, an error message will be logged.

#### BFF v4 Runtime Validation

BFF v4 requires a valid license in production environments. When no license is present, the system operates in
[trial mode](#bff-trial-mode) with a limitation of maximum of five sessions per host (not technically enforced)
with any excess resulting in error logging.

Trial mode is also enabled when the license could not be validated, for example when the signature validation fails.

When an expired license is used, the system will continue to function with only a warning written to the logs,
and not fall back to trial mode.

#### BFF Trial Mode

Using BFF without a license is considered Trial Mode. When running in Trial Mode, you will see the following
error logged on startup:

```text
You do not have a valid license key for the Duende software.
BFF will run in trial mode. This is allowed for development and testing scenarios.

If you are running in production you are required to have a licensed version.
Please start a conversation with us: https://duende.link/l/bff/contact
```

In Trial Mode, BFF will be limited to a maximum of five (5) sessions per host. Sessions exceeding the limit
will cause the host to log an error for every consecutive authenticated session:

```text
BFF is running in trial mode. The maximum number of allowed authenticated sessions (5) has been exceeded.

See https://duende.link/l/bff/trial for more information. 
```

The trial mode session limit is not distributed or shared across multiple nodes.

:::note
When operating non-production environments, such as development, test, or QA, without a valid license key,
you may run into this trial mode limitation.

If you require a larger number of sessions, we support using your production license in these environments
when trial mode is not enough.
:::

## License Key

The license key can be configured in one of three ways:

* Via a well-known file on the file system
* Via `IConfiguration` (for example, `appsettings.json` or environment variables)
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

By default, `ContentRootPath` is the directory that contains the application's `.csproj`
file during development, and the application's base directory in published deployments.
Place the license key file there:

```text
MyIdentityServer/
├── Duende_License.key   ← place license here
├── MyIdentityServer.csproj
├── Program.cs
├── appsettings.json
└── ...
```

:::tip
To verify your `ContentRootPath` at runtime, inspect `builder.Environment.ContentRootPath`.
:::

### Configuration :badge[v8.0]


IdentityServer can read the license key directly from `IConfiguration`, so you do not need to write any startup code.
If `LicenseKey` is not set in your `AddIdentityServer` call, IdentityServer checks the following configuration keys in order,
using the first non-empty value it finds:

1. `Duende:IdentityServer:LicenseKey`
2. `Duende:LicenseKey`

Whitespace is trimmed, and empty or whitespace-only values are ignored.

Add the license key to `appsettings.json` using the IdentityServer-specific key:

```json title="appsettings.json"
{
  "Duende": {
    "IdentityServer": {
      "LicenseKey": "eyJhbG..."
    }
  }
}
```

Or use the shorter key:

```json title="appsettings.json"
{
  "Duende": {
    "LicenseKey": "eyJhbG..."
  }
}
```

Because [`IConfiguration`](https://learn.microsoft.com/en-us/dotnet/core/extensions/configuration) supports many providers, you can also supply the key via environment variables
(for example, `Duende__IdentityServer__LicenseKey` or `Duende__LicenseKey`), Azure App Configuration, Azure Key Vault,
or any other configuration source.

:::note
Loading the license key from configuration is not currently supported in Duende BFF.
:::

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