---
title: "Dynamic Providers"
description: "Documentation for IdentityServer's Dynamic Identity Providers feature, which enables configuring external authentication providers from a store at runtime without performance penalties or application recompilation."
sidebar:
  order: 65
redirect_from:
  - /identityserver/v5/ui/login/dynamicproviders/
  - /identityserver/v6/ui/login/dynamicproviders/
  - /identityserver/v7/ui/login/dynamicproviders/
---

Dynamic Identity Providers are a scalable solution for managing authentication with lots of external providers, without
incurring performance penalties or requiring application recompilation. This feature, included in the Enterprise Edition
of Duende IdentityServer, enables providers to be configured dynamically from a store at runtime.

## Dynamic Identity Providers

Authentication handlers for external providers are typically added into your IdentityServer using `AddAuthentication()`
and `AddOpenIdConnect()`. This is fine for a handful of schemes, but becomes harder to manage if you have too many of them.
Additionally, you'd have to re-compile and re-run your startup code for new authentication handlers to be picked up by ASP.NET Core.

The authentication handler architecture in ASP.NET Core was not designed to have many statically registered authentication
handlers registered in the service container and Dependency Injection (DI) system. At some point you will incur a
performance penalty for having too many of them.

Duende IdentityServer provides support for dynamic configuration of OpenID Connect providers loaded from a store.
Dynamic configuration addresses the performance concern and allows changes to the configuration to a running server.

Support for Dynamic Identity Providers is included in the [Duende IdentityServer](https://duendesoftware.com/products/identityserver) Enterprise Edition.

## Store And Configuration Data

Dynamic identity providers are configured in IdentityServer and require a store for the configuration data of [dynamic OIDC providers](../../../reference/models/idp/).

There are two store implementations provided by Duende IdentityServer:

* An in-memory store
* A store backed by a database (using [Entity Framework Core](../../../data/ef/))

You could also implement your own store based on the [`IIdentityProviderStore` interface](../../../reference/stores/idp-store/).

The configuration data for the OIDC provider is used to assign the configuration on the ASP.NET
Core [OpenID Connect Options](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions) class,
much like you would if you were to statically configure the options when using `AddOpenIdConnect()`.

The [identity provider model documentation](../../../reference/models/idp) provides details for the model
properties and how they are mapped to the options.

:::tip[Consider caching dynamic identity providers]
Like other configuration data in IdentityServer, by default the dynamic provider configuration is loaded from the store
on every request unless caching is enabled.
If you use a custom store, there is an [extension method to enable caching](../../../data/configuration#caching-configuration-data).
If you use the EF stores, there is a general helper [to enable caching for all configuration data](../../../data/ef#enabling-caching-for-configuration-store).
:::

Here's an example of adding a dynamic provider to an IdentityServer instance using the in-memory store:

```csharp title=Program.cs {6-15}
builder.Services
    .AddIdentityServer(options =>
    {
        // ...
    })
    .AddInMemoryIdentityProviders(new []
    {
        new OidcProvider
        {
            Scheme = "oidc",
            DisplayName = "Sample provider",
            Enabled = true,
            // ... more properties
        }
    })
```

The identity provider store only provides an interface to query dynamic providers and does not provide any methods to add, update, or delete identity providers.
For custom store implementations, this means you'll need to implement a mechanism for populating the store with identity providers.

If you're using the Entity Provider Core stored from the `Duende.IdentityServer.EntityFramework.Storage` NuGet package,
you can use the `ConfigurationDbContext` database context directly to add, update or remove dynamic identity providers:

```csharp title="SeedData.cs"
private static async Task SeedDynamicProviders(ConfigurationDbContext context)
{
    if (!context.IdentityProviders.Any())
    {
        Console.WriteLine("IdentityProviders being populated...");
        
        context.IdentityProviders.Add(new OidcProvider
        {
            Scheme = "demoidsrv",
            DisplayName = "IdentityServer (dynamic)",
            Authority = "https://demo.duendesoftware.com",
            ClientId = "login",
            // ... more properties
        }.ToEntity());
        
        await context.SaveChangesAsync();
        
        Console.WriteLine("IdentityProviders populated.");
    }
    else
    {
        Console.WriteLine("OidcIdentityProviders already populated");
    }
}
```

You can use the `ConfigurationDbContext` database context to add dynamic identity providers at runtime.

## Listing Dynamic Providers On The Login Page

When working with dynamic providers, you'll typically want to display a list of the available providers on the login
page. The [identity provider store (`IIdentityProviderStore`)](../../../reference/stores/idp-store/) can be used to query the database
containing the dynamic providers.

```cs title="IIdentityProviderStore" {9}
/// <summary>
/// Interface to model storage of identity providers.
/// </summary>
public interface IIdentityProviderStore
{
    /// <summary>
    /// Gets all identity providers name.
    /// </summary>
    Task<IEnumerable<IdentityProviderName>> GetAllSchemeNamesAsync();

    // other APIs omitted
}
```

The `GetAllSchemeNamesAsync()` API returns a list of `IdentityProviderName` objects, which contain the scheme name and
display name of the provider and can be used on the login page, or in other places where you need this information.

In the [IdentityServer Quickstart UI](https://github.com/DuendeSoftware/products/tree/main/identity-server/templates/src/UI/Pages/Account/Login/Index.cshtml.cs#l193-l210),
dynamically registered identity providers will be automatically added to the list of providers on the login page by querying the identity provider store.
In custom UI implementations, you can use a similar approach to build and present a unified list of authentication providers to the end user:

```cs title="Login.cshtml.cs"
var schemes = await _schemeProvider.GetAllSchemesAsync();

var providers = schemes
    .Where(x => x.DisplayName != null)
    .Select(x => new ExternalProvider
    {
        DisplayName = x.DisplayName ?? x.Name,
        AuthenticationScheme = x.Name
    }).ToList();

var dynamicSchemes = (await _identityProviderStore.GetAllSchemeNamesAsync())
    .Where(x => x.Enabled)
    .Select(x => new ExternalProvider
    {
        AuthenticationScheme = x.Scheme,
        DisplayName = x.DisplayName
    });

providers.AddRange(dynamicSchemes);
```

The above code will query the identity provider store for all statically registered authentication schemes and merge them with (enabled) dynamic providers.

:::note
The dynamic identity provider store API is deliberately separate from the `IAuthenticationSchemeProvider` provided by ASP.NET Core, which returns the
list of statically configured providers (from `Startup.cs`).

This split allows the developer to have more control over the customization on the login page. For example, there might be hundreds or
thousands on dynamic providers, and therefore you would not want them displayed on the login page. At the same time, you might have a
few social providers statically configured that you would want to display.
:::

## Callback Paths

As part of the architecture of the dynamic providers feature, different callback paths are required and are
automatically set to follow a convention. The convention of these paths follows the form of `~/federation/{scheme}/{suffix}`.

There are three paths that are set on the `OpenIdConnectOptions`:

* [CallbackPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.remoteauthenticationoptions.callbackpath).
  This is the OIDC redirect URI protocol value. The suffix `"/signin"` is used for this path.
* [SignedOutCallbackPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.signedoutcallbackpath).
  This is the OIDC post logout redirect URI protocol value. The suffix `"/signout-callback"` is used for this path.
* [RemoteSignOutPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.remotesignoutpath).
  This is the OIDC front channel logout URI protocol value. The suffix `"/signout"` is used for this path.

For your IdentityServer running at "https://sample.duendesoftware.com" and an OIDC identity provider whose
scheme is "idp1", your client configuration with the external OIDC identity provider would be:

* The redirect URI would be "https://sample.duendesoftware.com/federation/idp1/signin"
* The post logout redirect URI would be "https://sample.duendesoftware.com/federation/idp1/signout-callback"
* The front channel logout URI would be "https://sample.duendesoftware.com/federation/idp1/signout"


## Advanced Configuration

Dynamic identity providers in Duende IdentityServer come with a number of defaults and expose configuration options
that make sense in most scenarios. In this section, we'll cover some of the more advanced configuration options.

### Customizing OpenIdConnectOptions

While dynamic providers come with various configuration options, these are not as rich as the options available when
statically configuring authentication handlers using `AddOpenIdConnect()`.

If you need to further customize the `OpenIdConnectOptions` for a particular provider, you can do so using a custom
`IConfigureNamedOptions<OpenIdConnectOptions>` implementation. In the `Configure(string, OpenIdConnectOptions)` method,
you can override the `OpenIdConnectOptions` for the provider by name.

```cs title="CustomConfig.cs"
public class CustomConfig : IConfigureNamedOptions<OpenIdConnectOptions>
{
    public void Configure(string name, OpenIdConnectOptions options)
    {
        if (name == "MyScheme")
        {
            // ... configure options
        }
        else if (name == "OtherScheme")
        {
            // ... configure options
        }
    }

    public void Configure(OpenIdConnectOptions options)
    {
    }
}
```

You will need to register the named options type in the service container at startup:

```csharp title="Program.cs"
builder.Services.ConfigureOptions<CustomConfig>();
```

:::note
In your `IConfigureNamedOptions<OpenIdConnectOptions>`, you can use constructor injection to access other services.
For example, if you need to access your Entity Framework Core database context to retrieve additional data for a given
(dynamic) authentication scheme, you can do so if needed.

If you require data from the `IIdentityProvider` store, you can use the `ConfigureAuthenticationOptions<>` base class
to further customize your dynamic identity provider, as we'll see in the next section.
:::

### Accessing OidcProvider Data In IConfigureNamedOptions

If your customization of `OpenIdConnectOptions` requires per-provider data that is available in the `IIdentityProvider`
and is accessible through properties of the `OidcProvider`, Duende IdentityServer provides an abstraction
for `IConfigureNamedOptions<OpenIdConnectOptions>`.

This abstraction requires your code to derive from `ConfigureAuthenticationOptions<OpenIdConnectOptions,
OidcProvider>` (rather than `IConfigureNamedOptions<OpenIdConnectOptions>`).

Here's an example implementation:

```cs title="CustomOidcConfigureOptions.cs"
class CustomOidcConfigureOptions : ConfigureAuthenticationOptions<OpenIdConnectOptions, OidcProvider>
{
    public CustomOidcConfigureOptions(IHttpContextAccessor httpContextAccessor,
        ILogger<CustomOidcConfigureOptions> logger) : base(httpContextAccessor, logger)
    {
    }

    protected override void Configure(ConfigureAuthenticationContext<OpenIdConnectOptions, OidcProvider> context)
    {
        var oidcProvider = context.IdentityProvider;
        var oidcOptions = context.AuthenticationOptions;

        // TODO: configure oidcOptions with values from oidcProvider
    }
}
```

You will need to register the options type in the service container at startup:

```csharp title="Program.cs"
builder.Services.ConfigureOptions<CustomOidcConfigureOptions>();
```

### DynamicProviderOptions

The `DynamicProviderOptions` is an options class in the IdentityServer options object model, and provides
[shared configuration options](../../../reference/options#dynamic-providers) for the dynamic identity providers
feature. For example, you can customize the path prefix for the dynamic providers callback path:

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer(options =>
    {
        // ...
        
        options.DynamicProviders.PathPrefix = "/fed";
        
        // ...
    })
```

## Using Non-OIDC Authentication Handlers 

Dynamic identity providers in Duende IdentityServer come with an implementation that supports OpenId Connect providers to be registered.
In your solution, it may be necessary to support other authentication providers, such as the `GoogleHandler`, or a SAML-based authentication provider.

To register other authentication handlers, you can use the `AddProviderType<T, TOptions, TIdentityProvider>(string scheme)` method on the `DynamicProviderOptions` object,
where `T` is the authentication handler type, `TOptions` is the options type for that particular handler, and `TIdentityProvider` is the identity provider type that models the dynamic provider.

The authentication handler type and options type will typically be provided by the authentication provider itself.
For example, the `GoogleHandler` and `GoogleOptions` types are provided by the `Google.AspNetCore.Authentication.OAuth` NuGet package.
`TIdentityProvider` will typically be a model class that maps to the identity provider data in the database
and can either be IdentityServer's [`IdentityProvider`](../../../reference/models/idp) class, or a custom type provided and implemented by you.

Let's add Google authentication support to dynamic identity providers in IdentityServer!

We'll assume you have already added the `Microsoft.AspNetCore.Authentication.Google` NuGet package to your project.

### 1. Implement A Custom IdentityProvider Type

While IdentityServer's [`IdentityProvider`](../../../reference/models/idp) class has a `Properties` bag that can be used
to store dynamic identity provider configuration data, it's recommended to use a custom type that is specific to the dynamic
identity provider.

The `GoogleIdentityProvider` class can extend IdentityServer's [`IdentityProvider`](../../../reference/models/idp) class,
and expose additional properties that are specific to the Google identity provider.  For a minimal Google implementation,
that would be the `ClientId` and `ClientSecret`:

```csharp title="GoogleIdentityProvider.cs"
public class GoogleIdentityProvider : IdentityProvider
{
    public const string ProviderType = "google";
    
    public GoogleIdentityProvider() 
        : base(ProviderType)
    {
    }
    
    public string? ClientId 
    {
        get => this["ClientId"];
        set => this["ClientId"] = value;
    }
    
    public string? ClientSecret 
    {
        get => this["ClientSecret"];
        set => this["ClientSecret"] = value;
    }
}
```

### 2. Register Dynamic Identity Provider Type

In the host startup, you can register the handler and identity provider type. This registration provides IdentityServer
with a way to map the dynamic identity provider configuration type created in the previous step, to an authentication handler type
in ASP.NET Core.

```csharp title="Program.cs" {6}
builder.Services
    .AddIdentityServer(options =>
    {
        // ...
        
        options.DynamicProviders
            .AddProviderType<GoogleHandler, GoogleOptions, GoogleIdentityProvider>(
                GoogleIdentityProvider.ProviderType);
    })
```

### 3. Configure Authentication Handler Options

With the dynamic identity provider type mapped to an ASP.NET Core authentication handler type, you'll need to make sure
an instance of the ASP.NET Core authentication handler options can be created based on a particular dynamic provider configuration.

To do so, you can use the `ConfigureAuthenticationOptions<TOptions, TIdentityProvider>` base class. In our Google example:

```csharp title="GoogleDynamicConfigureOptions.cs"
class GoogleDynamicConfigureOptions 
    : ConfigureAuthenticationOptions<GoogleOptions, GoogleIdentityProvider>
{
    public GoogleDynamicConfigureOptions(IHttpContextAccessor httpContextAccessor,
        ILogger<GoogleDynamicConfigureOptions> logger) : base(httpContextAccessor, logger)
    {
    }

    protected override void Configure(
        ConfigureAuthenticationContext<GoogleOptions, GoogleIdentityProvider> context)
    {        
        var googleProvider = context.IdentityProvider;
        var googleOptions = context.AuthenticationOptions;

        googleOptions.ClientId = googleProvider.ClientId;
        googleOptions.ClientSecret = googleProvider.ClientSecret;
        googleOptions.ClaimActions.MapAll();
        
        googleOptions.SignInScheme = context.DynamicProviderOptions.SignInScheme;
        googleOptions.CallbackPath = context.PathPrefix + "/signin";
    }
}
```

You will need to register this type in the service container at startup:

```csharp title="Program.cs"
builder.Services.ConfigureOptions<GoogleDynamicConfigureOptions>();
```

Note that for the `GoogleHandler` to work, you'll also need to register its `OAuthPostConfigureOptions<>`
to make sure data protection and state data formatters are registered. While this is an implementation detail of the
Google authentication handler, a similar implementation detail may exist for the custom dynamic provider type you are building.

```csharp title="Program.cs"
builder.Services.ConfigureOptions<OAuthPostConfigureOptions<GoogleOptions, GoogleHandler>>();
```

### 4. Use Your Custom IdentityProvider

With these building blocks in place, you can start using your custom identity provider type with Duende IdentityServer
dynamic identity providers!

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer(options =>
    {
        // ...
        
        options.DynamicProviders
            .AddProviderType<GoogleHandler, GoogleOptions, GoogleIdentityProvider>(
                GoogleIdentityProvider.ProviderType);
    })
    .AddInMemoryIdentityProviders(new []
    {
        new GoogleIdentityProvider
        {
            Scheme = "google1",
            DisplayName = "Google 1",
            Enabled = true,
            ClientId = "...",
            ClientSecret = "..."
        }
    })
```