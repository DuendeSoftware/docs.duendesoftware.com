---
title: "License Key"
weight: 60
---

When deploying your IdentityServer to production, you will need to configure your license key.
This can be configured in one of two ways:
* Via a well-known file on the file system
* Programmatically in your startup code

## File System

Duende IdentityServer will look for a file called *Duende_IdentityServer_License.key* in the same directory as your hosting application.
If present, the contents of the file will be loaded as the license key.

## Startup

If you prefer to load the license key dynamically, you can in your startup code.
When calling *AddIdentityServer* from *ConfigureServices*, you can pass a lambda expression to configure various options in your IdentityServer.
The *LicenseKey* is one such setting. 
For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options =>
    {
        options.LicenseKey = "your_license_key";
    });
}
```
