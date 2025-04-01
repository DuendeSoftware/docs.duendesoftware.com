---
title: "License Key"
order: 60
---

When deploying your IdentityServer to production, you will need to configure your license key.
This can be configured in one of two ways:
* Via a well-known file on the file system
* Programmatically in your startup code

## File System

Duende IdentityServer will look for a file called *Duende_License.key* in the same directory as your hosting application.
If present, the contents of the file will be loaded as the license key.

## Startup

If you prefer to load the license key dynamically (e.g. from an API or environment variable), you can in your startup code.
When calling *AddIdentityServer* from *ConfigureServices*, you can pass a lambda expression to configure various options in your IdentityServer.
The *LicenseKey* is one such setting. 

The contents of the license key file is text, and so that is the value to assign to the *LicenseKey* property.
For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options =>
    {
        options.LicenseKey = "eyJhbG..."; // the contents of the license key file
    });
}
```

## License Validation and Logging

All license validation is self-contained and does not leave the host (meaning there are no outbound calls related to license validation).
Any messages from the license validation layer will be emitted to the logging system.
The level of the log entry depends on the nature of the message and the type of license.

| Type of Message              | Standard License        | Redistribution License (development*) | Redistribution License (production*) |
|------------------------------|-------------------------|--------------------------------------|---------------------------------------|
| Startup, missing license     | Warning                 | Warning                              | Warning                               |
| Startup, license details     | Debug                   | Debug                                | Trace                                 |
| Startup, valid license notice| Informational           | Informational                        | Trace                                 |
| Startup, violations          | Error                   | Error                                | Trace                                 |
| Runtime, violations          | Error                   | Error                                | Trace                                 |

\* as determined by *IHostEnvironment.IsDevelopment()*
