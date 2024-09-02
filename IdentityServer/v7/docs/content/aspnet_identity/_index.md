+++
title = "ASP.NET Identity Integration"
description = "Overview"
weight = 90
chapter = true
+++

# ASP.NET Identity Integration

An ASP.NET Identity-based implementation is provided for managing the identity database for users of IdentityServer.
This implementation implements the extensibility points in IdentityServer needed to load identity data for your users to emit claims into tokens.

To use this library, ensure that you have the NuGet package for the ASP.NET Identity integration. 
It is called *Duende.IdentityServer.AspNetIdentity*.
You can install it with:

```
dotnet add package Duende.IdentityServer.AspNetIdentity
```

Next, configure ASP.NET Identity normally in your IdentityServer host with the standard calls to *AddIdentity* and any other related configuration.

Then in your *Program.cs*, use the *AddAspNetIdentity* extension method after the call to *AddIdentityServer*:

```cs
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddIdentityServer()
    .AddAspNetIdentity<ApplicationUser>();
```

*AddAspNetIdentity* requires as a generic parameter the class that models your user for ASP.NET Identity (and the same one passed to *AddIdentity* to configure ASP.NET Identity).
This configures IdentityServer to use the ASP.NET Identity implementations of [IUserClaimsPrincipalFactory](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.identity.iuserclaimsprincipalfactory-1) to convert the user data into claims, *IResourceOwnerPasswordValidator* to support the [password grant type]({{<ref "/tokens/password_grant">}}), and *IProfileService* which uses the *IUserClaimsPrincipalFactory* to add [claims]({{<ref "/fundamentals/claims">}}) to tokens.
It also configures some of ASP.NET Identity's options for use with IdentityServer (such as claim types to use and authentication cookie settings).

If you need to use your own implementation of *IUserClaimsPrincipalFactory*, then that is supported. Our implementation of the *IUserClaimsPrincipalFactory* will use the decorator pattern to encapsulate yours. For this to work properly, ensure that your implementation is registered in the DI system prior to calling the IdentityServer *AddAspNetIdentity* extension method.

The *IUserProfileService* interface has two methods that IdentityServer uses to interact with the user store. The profile service added for Asp.Net Identity implements *GetProfileDataAsync* by invoking the *IUserClaimsPrincipalFactory* implementation registered in the dependency injection cotainer. The other method on *IProfileService* is *IsActiveAsync* which is used in various places in IdentityServer to validate that the user is (still) active. There is no built in concept in Asp.Net Identity to deactive users, so our implementation is simply hard coded to return *true*. If you extend the Asp.Net Identity user with enabled/disabled functionality you should derive from our *ProfileService<TUser>* and override *IsUserActiveAsync(TUser user)* to check your custom enabled/disabled flags.

## Template
Alternatively, you can use the *isaspid* [template]({{<ref "/overview/packaging#templates">}}) to create a starter IdentityServer host project configured to use ASP.NET Identity. See the [Quickstart Documentation]({{<ref "/quickstarts/5_aspnetid">}}) for a detailed walkthrough. 
