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

Duende IdentityServer requires a [paid license](https://duendesoftware.com/products/identityserver) for production use, with plans available that offer various features based on organizational needs. A [community edition](https://duendesoftware.com/products/communityedition/)
is also available.

For some longer-term customers, we still honor customers continuing on our previous Starter, Business and Enterprise licenses. 

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
through [OpenTelemetry support](/identityserver/diagnostics/otel.mdx), and years of bug fixes and enhancements.

#### Standard Edition

The Standard edition adds additional features that go beyond the core protocol support
included in the Lite edition. This is a popular license because it adds the most
commonly needed tools and features outside a basic protocol implementation. Feature
highlights include resource isolation, the OpenId Connect CIBA flow support,
and server side sessions. [Automatic key management](/identityserver/fundamentals/key-management.md#automatic-key-management)
is available for the Standard edition as an add-on.

#### Advanced Edition

Finally, the Advanced edition includes everything in the Standard edition and adds
support for features that are typically used by enterprises with particularly complex
architectures or that handle particularly sensitive data. Highlights include
automatic key management (included), SAML, and priority developer support.

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

### Connected Applications

Duende IdentityServer licenses measure usage in **Connected Applications**. Previously, this licensing unit was
referred to as "client IDs"; the term "client ID" is still used in technical OpenID Connect and OAuth
contexts such as [client configuration](/identityserver/fundamentals/clients.md).

See the [glossary](/general/glossary.mdx#connected-application) for the full definition of a Connected Application.

Each separate registration or configuration counts as a separate Connected Application, including when the same application
is registered under multiple protocols. For example:

| Scenario                                                                          | Connected Applications                                   |
|-----------------------------------------------------------------------------------|--------------------------------------------------|
| One client with many redirect URIs, grant types, or scopes                        | 1                                                |
| Two SAML Service Providers                                                        | 2                                                |
| The same application registered with both OIDC and SAML                           | 2                                                |
| A machine-to-machine client registered for client credentials                     | 1 per registration, regardless of machine count  |
| A BFF serving two frontends that each have their own client                       | 2                                                |
| Clients created through [Dynamic Client Registration](/identityserver/configuration/dcr.mdx) | 1 per distinct registered client |
| IdentityServer acting as a SAML or OIDC client of external IdPs via [dynamic providers](/identityserver/ui/login/dynamicproviders.md) | Not counted as Connected Applications (covered by the dynamic identity provider licensing) |

:::note[Going beyond your plan limits]
Many of the limits in your license, such as the number of Connected Applications, can be lifted to unlimited with an add-on.
Check the [pricing page](https://duendesoftware.com/products/identityserver) for the available options.
:::

### Redistribution

If you want to redistribute Duende IdentityServer to your customers as part of a product,
you can use our [redistributable license](https://duendesoftware.com/products/identityserverredist).
See [Redistribution options](#redistribution-options) below for details.

### License Validation and Logging

All license validation happens at runtime and is self-contained. It does not leave the host,
and there are no outbound network calls related to license validation.

#### Startup Validation

IdentityServer loads and parses the license key at startup. If the key is present but invalid,
a critical error is logged and IdentityServer continues as if no license were configured.

When a license is configured, IdentityServer also checks a small number of enabled features at startup and throws an exception
if the license does not include them: Automatic Key Management, Server-Side Sessions, and SAML Identity Provider
(see [Runtime Validation](#runtime-validation) for details). When no license is configured, none of the startup
checks throw. Most other features are checked at runtime, when they are actively used.

:::note[IdentityServer 7 and earlier]
In IdentityServer 7 and earlier, IdentityServer performs validation checks at startup. If no license is configured,
it logs a warning and enters [Trial Mode](#trial-mode). If a license is configured, it compares the license
against the current configuration and logs any discrepancies it finds.
:::

#### Runtime Validation

IdentityServer validates feature usage based on licensing at runtime. To avoid unnecessary downtime, 
the runtime validator prefers to log a message. It will only throw an exception for certain features.

The following features are validated at runtime. If you use one of them without the
required license entitlement, IdentityServer logs a warning (rate-limited to once every
30 minutes per feature when no license is configured):

* [Demonstrating Proof-of-Possession (DPoP)](/identityserver/tokens/pop.mdx)
* [Resource Isolation](/identityserver/fundamentals/resources/isolation/index.md)
* [Client Initiated Backchannel Authentication (CIBA)](/identityserver/ui/ciba.md)
* [Dynamic Identity Providers](/identityserver/ui/login/dynamicproviders.md)
* [Financial-Grade Security and Conformance Report](/identityserver/diagnostics/conformance-report.md)
* [User Management](/identityserver/identity/user-management/index.mdx)

Some features do require a license with the proper entitlement(s). If you use one of the following features
without the required license entitlement, IdentityServer throws an exception during startup validation. 
This only applies when a license is present. If you do not have a license configured because you are 
developing locally, or IdentityServer is deployed to a non-production environment, a log message will be output
instead.

* [Server Side Sessions](/identityserver/ui/server-side-sessions/index.md)
* [Automatic Key Management](/identityserver/fundamentals/key-management.md)
* [SAML Identity Provider](/identityserver/saml/index.mdx)

:::note
When developing, you may use your production license key in _any_
environment as [detailed below](#using-a-license-in-non-production-environments).
:::

For quantized limits like Connected Application count and issuer count, IdentityServer logs a warning
when you exceed your licensed limit but stay within the grace threshold. If you exceed
the grace threshold, it logs an error instead. An expired license also results in an
error being logged. Log messages and diagnostics APIs may use the term "client", for example `LicenseUsageSummary.ClientsUsed`.
These count toward your Connected Applications. User Management also has a licensed limit on unique identities stored.
When adding a user past the licensed limit, a message will be logged. Note that the errors logged 
do not stop IdentityServer from running.

Other features are checked at runtime, when they are used. If a license is configured but does not include
the feature, IdentityServer logs a warning and the feature is not available:

* [DPoP](/identityserver/tokens/pop.mdx): token requests that include a DPoP proof fail.
* [Pushed Authorization Requests (PAR)](/identityserver/tokens/par.md): the PAR endpoint returns `404 Not Found`.
* [Resource Isolation](/identityserver/fundamentals/resources/isolation/index.md): resource indicators are ignored.
* [Dynamic Identity Providers](/identityserver/ui/login/dynamicproviders.md): loading a dynamic provider fails.
* SAML Service Provider: SAML Service Provider requests return `404 Not Found`.

As with the startup checks, this only applies when a license is present. Without a license, these features keep working
and a warning is logged instead.

:::tip
When rolling over to a renewed license, you can configure the new license before the old
license expires. While the expiration timestamp of a license is used to validate a license
is active, the start date is an administrative data point IdentityServer does not take
into account for license validation. In other words, you can safely configure the new
license before the old one lapses.
:::


#### Trial Mode

Running IdentityServer without a license is allowed for development and testing. A license is required
when running in production.

Without a license, there is no request limit and no automatic shutdown, and all features remain available.
The only difference you will notice is that IdentityServer logs messages about the missing license:

* A general message that no license key is configured:
  ```text
  You do not have a valid license key for the Duende software. This is allowed for development
  and testing scenarios. If you are running in production you are required to have a licensed version.
  Please start a conversation with us: https://duende.link/l/contact
  ```
* A warning when you use a licensed feature, such as DPoP, PAR, or Server-Side Sessions:
  ```text
  {FeatureName} is being used but no Duende license is configured.
  Please start a conversation with us: https://duende.link/l/contact
  ```
* A warning for licensed counts, such as the number of clients (Connected Applications), issuers,
  or SAML service providers and identity providers:
  ```text
  {EntitlementName} detected ({Actual} registered) but no Duende license is configured.
  Please start a conversation with us: https://duende.link/l/contact
  ```

These messages are rate-limited: each one is logged at most once every 30 minutes, so they don't flood your logs.
You can change this interval with the `Duende:LicenseValidation:LogFrequency` configuration setting, which takes
a `TimeSpan` value:

```json
// appsettings.json
{
  "Duende": {
    "LicenseValidation": {
      "LogFrequency": "01:00:00"
    }
  }
}
```

You can stop these messages by configuring a license key, even in non-production environments.
Keep in mind that once a license is configured, IdentityServer checks your [entitlements](#license-validation-and-logging):
the features listed above as throwing at startup or becoming unavailable at runtime require the corresponding license entitlement.

:::note[IdentityServer 7 and earlier]
In IdentityServer 7 and earlier, running without a license is called Trial Mode and has a threshold of 500 protocol requests.
This includes all HTTP requests that IdentityServer itself handles, such as requests for the discovery, authorize,
and token endpoints. UI requests, such as the login page, are not included in this threshold.

Beginning in IdentityServer 7.1, IdentityServer logs an error once when the trial mode threshold is exceeded:

```text
You are using IdentityServer in trial mode and have exceeded the trial threshold of 500 requests
handled by IdentityServer. In a future version, you will need to restart the server or configure
a license key to continue testing. See https://duende.link/l/trial for more information.
```

IdentityServer 7 also logs trial mode errors when requests are processed for more than one issuer, or for more
clients than a license would include. Warnings about features used without a license are logged once per
feature per process lifetime, instead of on a configurable interval. These thresholds are not enforced: IdentityServer
keeps running and handling requests after they are exceeded.
:::

#### Redistribution

If you want to redistribute Duende IdentityServer to your customers as part of a product,
you can use our [redistributable license](https://duendesoftware.com/products/identityserverredist). 
This license allows your product to include Duende IdentityServer in a packaged product you publish, 
and your customer installs within their own infrastructure. A current redistribution license is required to publish 
any new or updated version of your software which includes Duende IdentityServer. If a redistribution license is expired, 
Duende IdentityServer does not cease to work for your customer, however they will no longer be able to receive updated versions 
of Duende IdentityServer from you, including security patches.

It can be cumbersome to deploy updated licenses in redistribution scenarios,
especially if your deployment cycle does not coincide with the duration of your IdentityServer license.
In that situation, update the license key at the next deployment to your redistribution customers.
You are always responsible for ensuring your license is renewed.

##### Redistribution options

Redistribution licenses are based on features, the number of Connected Applications, and the number of IdentityServer
instances you deploy to your end customers. Many limits, including the number of Connected Applications, can be lifted
to unlimited. Unlimited Connected Applications does not mean unlimited redistributions: the number of installations
you ship to your own customers is licensed separately.
[Duende User Management](/identityserver/identity/user-management/index.mdx) and the
[BFF Security Framework](#bff-security-framework) are also available to redistribution customers.

Check the [redistribution pricing page](https://duendesoftware.com/products/identityserverredist) for the available options.

#### Log Severity

The severity of log messages depends on the nature of the message. Messages about a missing license, quantized limits, and license expiry are rate-limited to once every 30 minutes
per feature or SKU. You can change this interval with the `Duende:LicenseValidation:LogFrequency` setting, as shown under [Trial Mode](#trial-mode).

| Type of message                                   | Severity      |
|---------------------------------------------------|---------------|
| No license configured                             | Error         |
| Feature used, no license configured               | Warning       |
| Feature used, not covered by license              | Warning       |
| Quantized limit exceeded (within grace threshold) | Warning       |
| Quantized limit exceeded (beyond grace threshold) | Error         |
| License expired                                   | Error         |
| License valid                                     | Informational |

:::note[IdentityServer 7 and earlier]
In IdentityServer 7 and earlier, log severity depends on both the nature of the message and the type of license.

| Type of Message               | Standard License | Redistribution License (development*) | Redistribution License (production*) |
|-------------------------------|------------------|---------------------------------------|--------------------------------------|
| Startup, missing license      | Warning          | Warning                               | Warning                              |
| Startup, license details      | Debug            | Debug                                 | Trace                                |
| Startup, valid license notice | Informational    | Informational                         | Trace                                |
| Startup, violations           | Error            | Error                                 | Trace                                |
| Runtime, violations           | Error            | Error                                 | Trace                                |

\* as determined by `IHostEnvironment.IsDevelopment()`
:::

#### Using a License in Non-Production Environments

When running in non-production environments (development, test, QA, or anywhere else) without a license key, you can use your
production license key to suppress the warnings. IdentityServer is [free](#trial-mode) for development, testing,
and personal projects. Using your production license in these environments is fully supported.

Using the production license key in non-production environments can also help ensure that a feature is not accidentally being used
when the license does not allow for it. For example, if attempting to use the Server-Side Sessions feature but the production license 
does not have the entitlement for it, an exception will be seen in the lower environments before reaching production.

If you have feedback on trial mode, or specific use cases where you prefer other options, please 
[open a community discussion](https://github.com/DuendeSoftware/community/discussions).

## BFF Security Framework

The Duende BFF Security Framework requires a [license](https://duendesoftware.com/products/bff) for production use.
BFF is included in the Lite, Standard, and Advanced plans, which offer various features based on organizational needs.

For some longer-term customers, we still honor customers continuing on our previous Starter and Enterprise BFF licenses.

:::note[Trial mode]
Duende BFF has a [limited trial mode](#bff-trial-mode) for development and testing. For small organizations or personal
projects, consider the [community edition](https://duendesoftware.com/products/communityedition/). For production use,
a [license](https://duendesoftware.com/products/bff) is required.
:::

### Editions

BFF is a library designed to enhance the security of browser-based applications by moving authentication flows
to the server side.

The BFF license limits the number of front-ends. Check the [pricing page](https://duendesoftware.com/products/bff) for available options.

#### Starter Edition (legacy)

The (legacy) Starter edition is limited in the number of front-ends it can serve.

#### Enterprise Edition (legacy)

The (legacy) Enterprise edition removes the front-end limit of the Starter edition.

### Redistribution

If you want to redistribute Duende BFF to your customers as part of a product,
please [reach out to sales](https://duendesoftware.com/contact/sales). BFF is available for
[redistribution licenses](#redistribution-options).

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

### New License Key File Format

With Duende IdentityServer v8, a new license key file format was introduced. The following table shows which license key formats are compatible with which versions of IdentityServer:

| License key issued for         | Used with IdentityServer v7         | Used with IdentityServer v8    | Used with BFF < v4.3.3         | Used with BFF >= v4.3.3        |
|--------------------------------|-------------------------------------|--------------------------------|--------------------------------|--------------------------------|
| IdentityServer v7 (or earlier) | ✅ Works                            | ✅ Works (no add-on support)   | ✅ Works                       | ✅ Works                       |
| IdentityServer v8              | ❌ Does not work                    | ✅ Works (full support)        | ❌ Does not work               | ✅ Works                       |

Key points:

- **No new purchase required for v8**: If you have an active license from a previous version, the older key format works with IdentityServer v8. No new subscription or purchase is necessary.
- **Add-ons require a v8 key**: To use add-ons like [SAML](/identityserver/saml/index.mdx) or [Duende User Management](/identityserver/identity/user-management/index.mdx) in production on IdentityServer v8, a license key in the new v8 format is required.
- **v8 keys are not backwards-compatible**: A license key issued for v8 cannot be used with IdentityServer v7 or earlier.

If you use a license issued for IdentityServer v8 in IdentityServer v7 or BFF < v4.3.3, you may see the following error logged:

```text
Error validating the Duende software license key - You do not have a valid license key
for the Duende software. This is allowed for development and testing scenarios. If you
are running in production, you are required to have a licensed version.

IDX10503: Signature validation failed. Token does not have a kid.
Keys tried: "[PIl of type System.Text.StringBuilder' is hidden.
For more details, see https://aka.ms/ldentityModel/PIl.
```

Please [contact our sales team](https://duendesoftware.com/contact/sales) to request an updated license file, and make sure to communicate your version of IdentityServer.

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

### Configuration

_Available in IdentityServer 8.0 and later._


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
