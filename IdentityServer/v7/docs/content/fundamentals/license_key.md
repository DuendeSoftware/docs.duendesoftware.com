---
title: "Licensing"
weight: 60
---

IdentityServer is free for development, testing and personal projects, but production use
requires a [license](https://duendesoftware.com/products/identityserver). 

## Editions
There are three license editions which include different [features](https://duendesoftware.com/products/features).

#### Starter Edition
The Starter edition includes the core OIDC and OAuth protocol implementation. This is an
economical option that is a good fit for organizations with basic needs. It's also a great
choice if you have an aging IdentityServer4 implementation that needs to be updated and
licensed. The Starter edition includes all the features that were part of
IdentityServer4, along with support for the latest .NET release, improved observability
through OTEL support, and years of bug fixes and enhancements. 

#### Business Edition
The Business edition adds additional features that go beyond the core protocol support
included in the Starter edition. This is a popular license because it adds the most
commonly needed tools and features outside a basic protocol implementation. Feature
highlights include our backend-for-frontend security framework for SPAs, support for
server side sessions, and automatic signing key management. 

#### Enterprise Edition
Finally, the Enterprise edition includes everything in the Business edition and adds
support for features that are typically used by enterprises with particularly complex
architectures or that handle particularly sensitive data. Highlights include resource
isolation, the OpenId Connect CIBA flow, and dynamic federation. This is the best option
when you have a specific threat model or architectural need for these features.

## License Key
The license key can be configured in one of two ways:
* Via a well-known file on the file system
* Programmatically in your startup code

#### File System

IdentityServer looks for a file named *Duende_License.key* in the
[ContentRootPath](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.hosting.ihostenvironment.contentrootpath?view=dotnet-plat-ext-8.0#microsoft-extensions-hosting-ihostenvironment-contentrootpath).
If either are present, the content of the file will be used as the license key.

#### Startup

If you prefer to load the license key programatically, you can do so in your startup code.
This allows you to use the ASP.NET configuration system to load the license key from any
[configuration
provider](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-7.0#cp),
including environment variables, appsettings.json, an external configuration service such
as Azure App Configuration, etc.

The *AddIdentityServer* method accepts a lambda expression to configure various options in
your IdentityServer, including the *LicenseKey*. Set the value of this property to the
content of the license key file.

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options =>
    {
        options.LicenseKey = "eyJhbG..."; // the content of the license key file
    });
}
```

## License Validation and Logging

The license is validated at startup and during runtime. All license validation is
self-contained and does not leave the host. There are no outbound calls related to license
validation.

#### Startup Validation
At startup, IdentityServer first checks for a license. If there is no license configured,
IdentityServer logs a warning indicating that a license is required in a production
deployment. You can ignore these messages in non-production environments.

Next, assuming a license is configured, IdentityServer compares its configuration to the
license. If there are discrepancies between the license and the configuration,
IdentityServer will write log messages indicating the nature of the problem.


#### Runtime Validation
Most common licensing issues, such as expiration of the license or configuring more
clients than is included in the license do not prevent IdentityServer from functioning. We
trust our customers and we don't want a simple oversight to cause an outage. However, some
features will be disabled at runtime if your license does not include them, including:

- Server Side Sessions
- DPoP
- Resource Isolation
- PAR
- Dynamic Identity Providers 
- CIBA

Again, the absence of a license is permitted for development and testing, and therefore
does not disable any of these features.

## Redistribution
We understand that when IdentityServer is redistributed, log messages from the licensing
system are not likely to be very useful to your redistribution customers. For that reason,
in a redistribution the severity of log messages from the license system is turned all the
way down to the Trace level. We also appreciate that it might be cumbersome to deploy
updated licenses in this scenario. You are not required to deploy updated licenses to your
redistribution customers, as long as you have a current license.

## Log Severity

The severity of the log messages described above depend on the nature of the message and the type of
license.

| Type of Message              | Standard License        | Redistribution License (development*) | Redistribution License (production*) |
|------------------------------|-------------------------|--------------------------------------|---------------------------------------|
| Startup, missing license     | Warning                 | Warning                              | Warning                               |
| Startup, license details     | Debug                   | Debug                                | Trace                                 |
| Startup, valid license notice| Informational           | Informational                        | Trace                                 |
| Startup, violations          | Error                   | Error                                | Trace                                 |
| Runtime, violations          | Error                   | Error                                | Trace                                 |

\* as determined by *IHostEnvironment.IsDevelopment()*
