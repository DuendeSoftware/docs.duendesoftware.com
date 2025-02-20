---
title: "Dynamic Providers"
weight: 65
---

## Dynamic Identity Providers

Normally authentication handlers for external providers are added into your IdentityServer using *AddAuthentication()* and *AddOpenIdConnect()*. This is fine for a handful of schemes, but the authentication handler architecture in ASP.NET Core was not designed for dozens or more statically registered in the DI system. At some point you will incur a performance penalty for having too many. Also, as you need to add or change this configuration you will need to re-compile and re-run your startup code for those changes to take effect.

Duende IdentityServer provides support for dynamic configuration of OpenID Connect providers loaded from a store. This is designed to address the performance concern as well as allowing changes to the configuration to a running server.

Support for Dynamic Identity Providers is included in [IdentityServer](https://duendesoftware.com/products/identityserver) Enterprise Edition. 

### Listing and displaying the dynamic providers on the login page

The [identity provider store]({{<ref "/reference/stores/idp_store">}}) can be used to query the database containing the dynamic providers.

```cs
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

These results can then be used to populate the list of options presented to the user on the login page.

This API is deliberately separate than the *IAuthenticationSchemeProvider* provided by ASP.NET Core, which returns the list of statically configured providers (from *Startup.cs*).
This allows the developer to have more control over the customization on the login page (e.g. there might be hundreds or thousands on dynamic providers, and therefore you would not want them displayed on the login page, but you might have a few social providers statically configured that you would want to display).

Here is an example of how the [IdentityServer Quickstart UI](https://github.com/DuendeSoftware/products/tree/main/identity-server/templates/src/UI/Pages/Account/Login/Index.cshtml.cs#L193-L210) uses both interfaces to then present a merged and unified list to the end user:


```cs
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

### Store and Configuration Data

To use the dynamic providers feature an [identity provider store]({{<ref "/reference/stores/idp_store">}}) must be provided that will load [model data]({{<ref "/reference/models/idp">}}) for the OIDC identity provider to be used.
If you're using the [Entity Framework Integration]({{<ref "/data/ef">}}) then this is implemented for you.

{{% notice note %}}
Like other configuration data in IdentityServer, by default the dynamic provider configuration is loaded from the store on every request unless caching is enabled. 
If you use a custom store, there is an [extension method to enable caching]({{<ref "/data/configuration#caching-configuration-data">}}).
If you use the EF stores, there is general helper [to enable caching for all configuration data]({{<ref "/data/ef#enabling-caching-for-configuration-store">}}).
{{% /notice %}}

The configuration data for the OIDC provider is used to assign the configuration on the ASP.NET Core [OpenID Connect Options](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions) class, much like you would if you were to statically configure the options when using *AddOpenIdConnect()*.
The [identity provider model documentation]({{<ref "/reference/models/idp">}}) provides details for the model properties and how they are mapped to the options.


#### Customizing OpenIdConnectOptions

If it is needed to further customize the *OpenIdConnectOptions*, you can register in the DI system an instance of *IConfigureNamedOptions\<OpenIdConnectOptions>*. For example:

```cs
    public class CustomConfig : IConfigureNamedOptions<OpenIdConnectOptions>
    {
        public void Configure(string name, OpenIdConnectOptions options)
        {
            if (name == "MyScheme")
            {
                options.ClaimActions.MapAll();
            }
        }

        public void Configure(OpenIdConnectOptions options)
        {
        }
    }
```

And to register this in the DI system:

```cs
builder.Services.ConfigureOptions<CustomConfig>();
```

#### Accessing OidcProvider data in IConfigureNamedOptions

If your customization of the *OpenIdConnectOptions* requires per-provider data that you are storing on the *OidcProvider*, then we provide an abstraction for the *IConfigureNamedOptions\<OpenIdConnectOptions>*.
This abstraction requires your code to derive from *ConfigureAuthenticationOptions\<OpenIdConnectOptions, OidcProvider>* (rather than *IConfigureNamedOptions\<OpenIdConnectOptions>*).
For example:

```cs
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

The above class would need to be configured in DI (as before):

```cs
builder.Services.ConfigureOptions<CustomOidcConfigureOptions>();
```

### Callback Paths

As part of the architecture of the dynamic providers feature, the various callback paths are required and are automatically set to follow a convention.
The convention of these paths follows the form of *~/federation/{scheme}/{suffix}*.

These are three paths that are set on the *OpenIdConnectOptions*:

* [CallbackPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.remoteauthenticationoptions.callbackpath). This is the OIDC redirect URI protocol value. The suffix "/signin" is used for this path.
* [SignedOutCallbackPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.signedoutcallbackpath). This is the OIDC post logout redirect URI protocol value. The suffix "/signout-callback" is used for this path.
* [RemoteSignOutPath](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.remotesignoutpath). This is the OIDC front channel logout URI protocol value. The suffix "/signout" is used for this path.

This means for your IdentityServer running at "https://sample.duendesoftware.com" and an OIDC identity provider whose scheme is "idp1", your client configuration with the external OIDC identity provider would be:

* The redirect URI would be "https://sample.duendesoftware.com/federation/idp1/signin"
* The post logout redirect URI would be "https://sample.duendesoftware.com/federation/idp1/signout-callback"
* The front channel logout URI would be "https://sample.duendesoftware.com/federation/idp1/signout"

### DynamicProviderOptions

The *DynamicProviderOptions* is a new options class in the IdentityServer options object model.
It provides [shared settings]({{< ref "/reference/options#dynamic-providers">}}) for the dynamic identity providers feature.
