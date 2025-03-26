---
title: ASP.NET Identity Integration
description: Overview
sidebar:
  order: 90
---


An ASP.NET Identity-based implementation is provided for managing the identity database for users of IdentityServer.
This implementation implements the extensibility points in IdentityServer needed to load identity data for your users to emit claims into tokens.

To use this library, ensure that you have the NuGet package for the ASP.NET Identity integration. 
It is called *Duende.IdentityServer.AspNetIdentity*.
You can install it with:

```
dotnet add package Duende.IdentityServer.AspNetIdentity
```

Next, configure ASP.NET Identity normally in your IdentityServer host with the standard calls to *AddIdentity* and any other related configuration.

Then in your *Startup.cs*, use the *AddAspNetIdentity* extension method after the call to *AddIdentityServer*:

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddIdentityServer()
            .AddAspNetIdentity<ApplicationUser>();
    }

*AddAspNetIdentity* requires as a generic parameter the class that models your user for ASP.NET Identity (and the same one passed to *AddIdentity* to configure ASP.NET Identity).
This configures IdentityServer to use the ASP.NET Identity implementations of [IUserClaimsPrincipalFactory](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.identity.iuserclaimsprincipalfactory-1) to convert the user data into claims, *IResourceOwnerPasswordValidator* to support the [password grant type](/identityserver/v6/tokens/password_grant), and *IProfileService* which uses the *IUserClaimsPrincipalFactory* to add [claims](/identityserver/v6/fundamentals/claims) to tokens.
It also configures some of ASP.NET Identity's options for use with IdentityServer (such as claim types to use and authentication cookie settings).

If you need to use your own implementation of *IUserClaimsPrincipalFactory*, then that is supported. Our implementation of the *IUserClaimsPrincipalFactory* will use the decorator pattern to encapsulate yours. For this to work properly, ensure that your implementation is registered in the DI system prior to calling the IdentityServer *AddAspNetIdentity* extension method.

## Template
Alternatively, you can use the *isaspid* [template](/identityserver/v6/overview/packaging#templates) to create a starter IdentityServer host project configured to use ASP.NET Identity. See the [Quickstart Documentation](/identityserver/v6/quickstarts/5_aspnetid) for a detailed walkthrough. 
