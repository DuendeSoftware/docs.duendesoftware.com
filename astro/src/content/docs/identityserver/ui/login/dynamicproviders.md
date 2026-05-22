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
incurring performance penalties or requiring application recompilation. This feature enables providers to be configured dynamically from a store at runtime.

:::note
This feature is part of the [Duende IdentityServer Enterprise (legacy), Advanced, and Custom Edition](https://duendesoftware.com/products/identityserver).
:::

## Dynamic Identity Providers

Authentication handlers for external providers are typically added into your IdentityServer using `AddAuthentication()`,
`AddOpenIdConnect()`, `AddSamlServiceProvider()`, and other helper methods. This is fine for a handful of schemes,
but becomes harder to manage if you have too many of them.
Additionally, you'd have to re-run your startup code for new authentication handlers to be picked up by ASP.NET Core.

The authentication handler architecture in ASP.NET Core was not designed to have many statically registered authentication
handlers registered in the service container and Dependency Injection (DI) system. At some point you will incur a
performance penalty for having too many of them.

Duende IdentityServer provides support for dynamic configuration of authentication handlers loaded from a store.
Dynamic configuration addresses the performance concern and allows changes to the configuration to a running server.

IdentityServer includes built-in support for [OIDC providers](#oidc-providers) and [SAML providers](#saml-providers).
You can also add [custom authentication handlers](#custom-authentication-handlers) for other protocols.

## Store And Configuration Data

Dynamic identity providers require a store for the configuration data.
There are two store implementations provided by Duende IdentityServer:

* An in-memory store
* A store backed by a database (using [Entity Framework Core](/identityserver/data/ef.md))

You could also implement your own store based on the [`IIdentityProviderStore` interface](/identityserver/reference/v8/stores/idp-store.md).

:::tip[Consider caching dynamic identity providers]
Like other configuration data in IdentityServer, by default the dynamic provider configuration is loaded from the store
on every request unless caching is enabled.
If you use a custom store, there is an [extension method to enable caching](/identityserver/data/configuration.md#caching-configuration-data).
If you use the EF stores, there is a general helper [to enable caching for all configuration data](/identityserver/data/ef.md#enabling-caching-for-configuration-store).
:::

The identity provider store only provides an interface to query dynamic providers and does not provide any methods to add, update, or delete identity providers.
For custom store implementations, this means you'll need to implement a mechanism for populating the store with identity providers.

## OIDC Providers

The configuration data for the OIDC provider is used to assign the configuration on the ASP.NET
Core [OpenID Connect Options](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions) class,
much like you would if you were to statically configure the options when using `AddOpenIdConnect()`.

The [identity provider model documentation](/identityserver/reference/v8/models/idp.md) provides details for the model
properties and how they are mapped to the options.

### Registration

Here's an example of adding a dynamic OIDC provider using the in-memory store:

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer(options =>
    {
        // ...
    })
    .AddInMemoryOidcProviders(new []
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

If you're using the Entity Framework Core identity provider store from the `Duende.IdentityServer.EntityFramework.Storage` NuGet package,
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

### Callback Paths

Different callback paths are required and are automatically set to follow a convention.
The convention of these paths follows the form of `~/federation/{scheme}/{suffix}`.

There are three paths that are set on the `OpenIdConnectOptions` for OIDC dynamic providers:

* [CallbackPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.remoteauthenticationoptions.callbackpath).
  This is the OIDC redirect URI protocol value. The suffix `"/signin"` is used for this path.
* [SignedOutCallbackPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.signedoutcallbackpath).
  This is the OIDC post logout redirect URI protocol value. The suffix `"/signout-callback"` is used for this path.
* [RemoteSignOutPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.remotesignoutpath).
  This is the OIDC front channel logout URI protocol value. The suffix `"/signout"` is used for this path.

For your IdentityServer running at `https://sample.duendesoftware.com` and an OIDC identity provider whose
scheme is "idp1", your client configuration with the external OIDC identity provider would be:

* The redirect URI would be `https://sample.duendesoftware.com/federation/idp1/signin`
* The post logout redirect URI would be `https://sample.duendesoftware.com/federation/idp1/signout-callback`
* The front channel logout URI would be `https://sample.duendesoftware.com/federation/idp1/signout`

:::tip
Even if you don't use dynamic providers yet, you may want to consider adopting this pattern for the callback paths.
This will make it easier to transition to dynamic providers in the future.
:::

### Customizing OpenIdConnectOptions

While dynamic providers come with various configuration options, these are not as rich as the options available when
statically configuring authentication handlers using `AddOpenIdConnect()`.

If you need to further customize the `OpenIdConnectOptions` for a particular provider, you can do so using a custom
`IConfigureNamedOptions<OpenIdConnectOptions>` implementation. In the `Configure(string, OpenIdConnectOptions)` method,
you can override the `OpenIdConnectOptions` for the provider by name.

```csharp title="CustomConfig.cs"
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

You will need to register the named options type in the ASP.NET Core service container at startup:

```csharp title="Program.cs"
builder.Services.ConfigureOptions<CustomConfig>();
```

:::note
While you can use constructor injection in your `IConfigureNamedOptions<OpenIdConnectOptions>` to access other services,
we recommend using that technique sparingly for performance reasons. If you do need to access your Entity Framework Core
database context here, make sure to cache any additional data you may need as part of configuring options.

Alternatively, the `OidcProvider` class has a `Properties` bag that can be used to store additional dynamic identity provider
configuration data. You can use this data to further customize the `OpenIdConnectOptions`, instead of making additional database
calls. When you require access to the `Properties` bag or the `IIdentityProvider` store, you can use the `ConfigureAuthenticationOptions<>`
base class to further customize your dynamic identity provider, as we'll see in the next section.
:::

### Accessing OidcProvider Data In IConfigureNamedOptions

If your customization of `OpenIdConnectOptions` requires per-provider data that is available in the `IIdentityProvider`
and is accessible through properties of the `OidcProvider`, Duende IdentityServer provides an abstraction
for `IConfigureNamedOptions<OpenIdConnectOptions>`.

This abstraction requires your code to derive from `ConfigureAuthenticationOptions<OpenIdConnectOptions,
OidcProvider>` (rather than `IConfigureNamedOptions<OpenIdConnectOptions>`).

Here's an example implementation:

```csharp title="CustomOidcConfigureOptions.cs"
class CustomOidcConfigureOptions 
    : ConfigureAuthenticationOptions<OpenIdConnectOptions, OidcProvider>
{
    public CustomOidcConfigureOptions(IHttpContextAccessor httpContextAccessor,
        ILogger<CustomOidcConfigureOptions> logger) : base(httpContextAccessor, logger)
    {
    }

    protected override void Configure(
        ConfigureAuthenticationContext<OpenIdConnectOptions, OidcProvider> context)
    {
        var oidcProvider = context.IdentityProvider;
        var oidcOptions = context.AuthenticationOptions;

        // TODO: configure oidcOptions with values from oidcProvider
    }
}
```

You will need to register the options type in the service provider at startup:

```csharp title="Program.cs"
builder.Services.ConfigureOptions<CustomOidcConfigureOptions>();
```

## SAML Providers

IdentityServer includes built-in support for dynamic SAML 2.0 providers via `AddSamlDynamicProvider()`. This registers the SAML SP authentication handler for use with the dynamic provider infrastructure, so you can manage SAML IdPs from a store at runtime.

### Registration

To enable SAML dynamic providers, call `AddSamlDynamicProvider()` on the IdentityServer builder:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSamlDynamicProvider();
```

SAML dynamic providers use the `SamlProvider` model, which extends `IdentityProvider` with SAML-specific properties:

* `IdpEntityId` (`string?`, default `null`) — The entity ID of the remote SAML Identity Provider.
* `SingleSignOnServiceUrl` (`string?`, default `null`) — The URL of the IdP's SSO endpoint.
* `SingleLogoutServiceUrl` (`string?`, default `null`) — The URL of the IdP's SLO endpoint. When `null`, outbound logout is disabled.
* `SigningCertificateBase64` (`string?`, default `null`) — Base64-encoded X.509 certificate for validating IdP signatures.
* `BindingType` (`string`, default `"redirect"`) — The SAML binding type (`"redirect"` or `"post"`).
* `SpEntityId` (`string?`, default `null`) — The entity ID of your application (the SP). When `null`, derived from the IdentityServer issuer.
* `AllowUnsolicitedAuthnResponse` (`bool`, default `false`) — Whether to accept IdP-initiated (unsolicited) responses.
* `WantAssertionsSigned` (`bool`, default `true`) — Whether assertions from the IdP must be signed.
* `OutboundSigningAlgorithm` (`string`, default RSA-SHA256) — The XML signature algorithm for outbound requests.

`SamlProvider` also inherits `Scheme`, `DisplayName`, `Enabled`, and the `Properties` dictionary from `IdentityProvider`.

For development and testing, use the in-memory store:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSamlDynamicProvider()
    .AddInMemorySamlProviders(new[]
    {
        new SamlProvider
        {
            Scheme = "corporate-idp",
            DisplayName = "Corporate ADFS",
            Enabled = true,
            IdpEntityId = "https://adfs.corporate.example.com",
            SingleSignOnServiceUrl = "https://adfs.corporate.example.com/adfs/ls/",
            SigningCertificateBase64 = "<base64-encoded certificate>",
        }
    });
```

For production, use the Entity Framework Core store. `SamlProvider` records are stored in the `IdentityProviers` table and managed via the `ConfigurationDbContext`.

### Callback Paths

For SAML dynamic providers, the module path is set to `~/federation/{scheme}/Saml2`.
The SAML handler registers its own ACS and SLO callback endpoints under that path automatically.

For your IdentityServer running at `https://sample.duendesoftware.com` and a SAML provider whose
scheme is "corporate-idp", the ACS endpoint would be at `https://sample.duendesoftware.com/federation/corporate-idp/Saml2/Acs`.

For static SAML provider registration (when you have a small, fixed set of SAML IdPs),
see [SAML 2.0 External Provider](/identityserver/ui/login/saml-provider.md) instead.

### Accessing SamlProvider Data in IConfigureNamedOptions

If your customization of SAML authentication options requires per-provider data available 
in the `SamlProvider`, Duende IdentityServer provides an abstraction for `IConfigureNamedOptions<SamlAuthenticationOptions>`.

This abstraction requires your code to derive from `ConfigureAuthenticationOptions<SamlAuthenticationOptions, SamlProvider>`
(rather than `IConfigureNamedOptions<SamlAuthenticationOptions>`).

The `SamlAuthenticationOptions` instance is pre-populated from the `SamlProvider` configuration.
Your overrides take priority over the stored provider values, which in turn take priority over defaults.

Here's an example implementation:

```csharp title="CustomSamlConfigureOptions.cs"
class CustomSamlConfigureOptions
    : ConfigureAuthenticationOptions<SamlAuthenticationOptions, SamlProvider>
{
    public CustomSamlConfigureOptions(IHttpContextAccessor httpContextAccessor,
        ILogger<CustomSamlConfigureOptions> logger) : base(httpContextAccessor, logger)
    {
    }

    protected override void Configure(
        ConfigureAuthenticationContext<SamlAuthenticationOptions, SamlProvider> context)
    {
        var samlProvider = context.IdentityProvider;
        var samlOptions = context.AuthenticationOptions;

        // TODO: configure samlOptions with values from samlProvider
    }
}
```

Register the options type in the service provider at startup:

```csharp
// Program.cs
builder.Services.ConfigureOptions<CustomSamlConfigureOptions>();
```

## Listing Providers on the Login Page

When working with dynamic providers, you'll typically want to display a list of the available providers on the login
page. The [identity provider store (`IIdentityProviderStore`)](/identityserver/reference/v8/stores/idp-store.md) can be used to query the database
containing the dynamic providers.

```csharp title="IIdentityProviderStore" {9}
/// <summary>
/// Interface to model storage of identity providers.
/// </summary>
public interface IIdentityProviderStore
{
    /// <summary>
    /// Gets the display names and scheme names of all registered identity providers.
    /// </summary>
    Task<IReadOnlyCollection<IdentityProviderName>> GetAllSchemeNamesAsync(CancellationToken ct);

    // other APIs omitted
}
```

The `GetAllSchemeNamesAsync` API returns a read-only collection of `IdentityProviderName` objects, which contain the scheme name and
display name of the provider and can be used on the login page, or in other places where you need this information.

In the [IdentityServer Quickstart UI](https://github.com/DuendeSoftware/products/tree/main/identity-server/templates/src/UI/Pages/Account/Login/Index.cshtml.cs#l193-l210),
dynamically registered identity providers will be automatically added to the list of providers on the login page by querying the identity provider store.
In custom UI implementations, you can use a similar approach to build and present a unified list of authentication providers to the end user:

```csharp title="Login.cshtml.cs"
var schemes = await _schemeProvider.GetAllSchemesAsync();

var providers = schemes
    .Where(x => x.DisplayName != null)
    .Select(x => new ExternalProvider
    {
        DisplayName = x.DisplayName ?? x.Name,
        AuthenticationScheme = x.Name
    }).ToList();

var dynamicSchemes = (await _identityProviderStore.GetAllSchemeNamesAsync(HttpContext.RequestAborted))
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


## Dynamic Provider Options

The `DynamicProviderOptions` is an options class in the IdentityServer options object model, and provides
[shared configuration options](/identityserver/reference/v8/options.md#dynamic-providers) for the dynamic identity providers
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

## Custom Authentication Handlers

Dynamic identity providers in Duende IdentityServer come with built-in implementations for OpenID Connect and SAML 2.0 providers.
In your solution, it may be necessary to support other authentication providers as well.

We have two samples that show how to use other authentication handlers with dynamic identity providers:

* Adding the [WS-Federation protocol type](/identityserver/samples/ui.mdx#adding-other-protocol-types-to-dynamic-providers)
* Adding the [Saml2 protocol type](/identityserver/samples/ui.mdx#using-sustainsyssaml2-with-dynamic-providers), using the [Sustainsys.Saml2](https://saml2.sustainsys.com/) open source library

:::note
The Sustainsys.Saml2 sample predates the built-in SAML SP support in IdentityServer v8. For new deployments, use `AddSamlDynamicProvider()` (see [SAML Providers](#saml-providers) above).
:::

In this section, we'll look at a minimal example of how to add other authentication handlers, such as the `GoogleHandler`, to dynamic identity providers.

The recommended way to register other authentication handlers is the `AddDynamicProvider<THandler, TOptions, TIdentityProvider, TConfigureOptions>` 
extension method on the IdentityServer builder. It takes care of provider type mapping, configure options registration,
and handler service registration in a single call.

The authentication handler type and options type will typically be provided by the authentication provider itself.
For example, the `GoogleHandler` and `GoogleOptions` types are provided by the `Microsoft.AspNetCore.Authentication.Google` NuGet package.
`TIdentityProvider` will typically be a model class that maps to the identity provider data in the database
and can either be IdentityServer's [`IdentityProvider`](/identityserver/reference/v8/models/idp.md) class, or a custom
type provided and implemented by you.

Let's add Google authentication support to dynamic identity providers in IdentityServer!

We'll assume you have already added the `Microsoft.AspNetCore.Authentication.Google` NuGet package to your project.

### 1. Implement A Custom IdentityProvider Type

While IdentityServer's [`IdentityProvider`](/identityserver/reference/v8/models/idp.md) class has a `Properties` bag that can be used
to store dynamic identity provider configuration data, it's recommended to use a custom type that is specific to the dynamic
identity provider.

The `GoogleIdentityProvider` class can extend IdentityServer's [`IdentityProvider`](/identityserver/reference/v8/models/idp.md) class,
and expose additional properties that are specific to the Google identity provider. For a minimal Google implementation,
that would be the `ClientId` and `ClientSecret`:

```csharp title="GoogleIdentityProvider.cs"
public class GoogleIdentityProvider : IdentityProvider
{
    public const string ProviderType = "google";

    public GoogleIdentityProvider()
        : base(ProviderType)
    {
    }

    public GoogleIdentityProvider(IdentityProvider other)
        : base(ProviderType, other)
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

:::note
The copy constructor (`GoogleIdentityProvider(IdentityProvider other)`) is required.
IdentityServer uses it to construct the correct derived type when loading providers from the store
(for example, the Entity Framework store stores all providers as base `IdentityProvider` entities
and reconstructs the derived type at runtime).
:::

### 2. Configure Authentication Handler Options

You need to implement a class that maps from your identity provider model to the authentication handler options.
Derive from `ConfigureAuthenticationOptions<TOptions, TIdentityProvider>`:

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

### 3. Register With AddDynamicProvider

Use the `AddDynamicProvider` extension method on the IdentityServer builder to register everything in one call.
This registers the provider type mapping, the configure options, and the authentication handler:

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer(options =>
    {
        // ...
    })
    .AddDynamicProvider<GoogleHandler, GoogleOptions, GoogleIdentityProvider, GoogleDynamicConfigureOptions>(
        GoogleIdentityProvider.ProviderType)
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

`AddDynamicProvider` handles:
* Registering the provider type mapping (`AddProviderType`)
* Registering the configure options as `IConfigureOptions<TOptions>`
* Registering the authentication handler in DI (via `TryAddTransient`)

:::note
For this specific `GoogleHandler` to work, you'll also need to register its `OAuthPostConfigureOptions<>`
to make sure data protection and state data formatters are registered. While this is an implementation detail of the
Google authentication handler, a similar implementation detail may exist for the custom dynamic provider type you are building.

```csharp title="Program.cs"
builder.Services.ConfigureOptions<OAuthPostConfigureOptions<GoogleOptions, GoogleHandler>>();
```
:::
