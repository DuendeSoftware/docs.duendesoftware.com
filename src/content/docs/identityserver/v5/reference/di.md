---
title: "DI Extension Methods"
date: 2020-09-10T08:22:12+02:00
order: 20
---

*AddIdentityServer* return a builder object that provides many extension methods to add IdentityServer specific services to DI. Here's a list grouped by feature areas.

```cs
public void ConfigureServices(IServiceCollection services)
{
    var builder = services.AddIdentityServer();
}
```

:::note
Many of the fundamental configuration settings can be set on the options. See the *[IdentityServerOptions](../reference/options)* reference for more details.
:::


## Configuration Stores

Several convenience methods are provided for registering custom stores:

* ***AddClientStore<T>***
    
    Registers a custom *IClientStore* implementation.

* ***AddCorsPolicyService<T>***
    
    Registers a custom *ICorsPolicyService* implementation.

* ***AddResourceStore<T>***
    
    Registers a custom *IResourceStore* implementation.

* ***AddIdentityProviderStore<T>***
    
    Registers a custom *IIdentityProviderStore* implementation.


The [in-memory configuration stores](/identityserver/v5/data/configuration#in-memory-stores) can be registered in DI with the following extension methods.


* ***AddInMemoryClients***
    
    Registers *IClientStore* and *ICorsPolicyService* implementations based on the in-memory collection of *Client* configuration objects.

* ***AddInMemoryIdentityResources***

    Registers *IResourceStore* implementation based on the in-memory collection of *IdentityResource* configuration objects.

* ***AddInMemoryApiScopes***

    Registers *IResourceStore* implementation based on the in-memory collection of *ApiScope* configuration objects.

* ***AddInMemoryApiResources***

    Registers *IResourceStore* implementation based on the in-memory collection of *ApiResource* configuration objects.

## Caching Configuration Data

Extension methods to enable [caching for configuration data](/identityserver/v5/data/configuration#caching-configuration-data):

* ***AddInMemoryCaching<T>***
    
    To use any of the caches described below, an implementation of *ICache<T>* must be registered in DI.
    This API registers a default in-memory implementation of *ICache<T>* that's based on ASP.NET Core's *MemoryCache*.

* ***AddClientStoreCache<T>***
    Registers a *IClientStore* decorator implementation which will maintain an in-memory cache of *Client* configuration objects.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.

* ***AddResourceStoreCache<T>***
    
    Registers a *IResourceStore* decorator implementation which will maintain an in-memory cache of *IdentityResource* and *ApiResource* configuration objects.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.

* ***AddCorsPolicyCache<T>***
    
    Registers a *ICorsPolicyService* decorator implementation which will maintain an in-memory cache of the results of the CORS policy service evaluation.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.

* ***AddIdentityProviderStoreCache<T>***
    
    Registers a *IIdentityProviderStore* decorator implementation which will maintain an in-memory cache of *IdentityProvider* configuration objects.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.
    
## Test Stores
The *TestUser* class models a user, their credentials, and claims in IdentityServer. 

Use of *TestUser* is similar to the use of the "in-memory" stores in that it is intended for when prototyping, developing, and/or testing.
The use of *TestUser* is not recommended in production.

* ***AddTestUsers***
    
    Registers *TestUserStore* based on a collection of *TestUser* objects.
    *TestUserStore* is e.g. used by the default quickstart UI.
    Also registers implementations of *IProfileService* and *IResourceOwnerPasswordValidator* that uses the test users as a backing store.

## Signing keys
Duende IdentityServer needs some signing key material to sign tokens.
This key material either comes from the built-in automatic key management feature (todo link) or can be configured statically.

:::note
It is recommended to use the [automatic key management](/identityserver/v5/fundamentals/keys), this section covers the extensions methods for the static configuration.
:::

Duende IdentityServer supports X.509 certificates (both raw files and a reference to the certificate store), 
RSA keys and EC keys for token signatures and validation. Each key can be configured with a (compatible) signing algorithm, 
e.g. RS256, RS384, RS512, PS256, PS384, PS512, ES256, ES384 or ES512.

You can configure the key material with the following methods:

* ***AddSigningCredential***
    
    Adds a signing key that provides the specified key material to the various token creation/validation services.

* ***AddDeveloperSigningCredential***
    
    Creates temporary key material at startup time. This is for dev scenarios. The generated key will be persisted in the local directory by default (or just kept in memory).

* ***AddValidationKey***
    
    Adds a key for validating tokens. They will be used by the internal token validator and will show up in the discovery document.

## Additional services
The following are convenient to add additional features to your IdentityServer.

* ***AddExtensionGrantValidator***

    Adds an *IExtensionGrantValidator* implementation for use with extension grants.

* ***AddSecretParser***
    
    Adds an *ISecretParser* implementation for parsing client or API resource credentials.

* ***AddSecretValidator***
    
    Adds an *ISecretValidator* implementation for validating client or API resource credentials against a credential store.

* ***AddResourceOwnerValidator***
    
    Adds an *IResourceOwnerPasswordValidator* implementation for validating user credentials for the resource owner password credentials grant type.

* ***AddProfileService***

    Adds an *[IProfileService](/identityserver/v5/Users/maartenba/Desktop/starlight/docs/src/content/docs//reference/services/profile_service.md)* implementation.
    The default implementation (found in *DefaultProfileService*) relies upon the authentication cookie as the only source of claims for issuing in tokens.

* ***AddAuthorizeInteractionResponseGenerator***
    
    Adds an *IAuthorizeInteractionResponseGenerator* implementation to customize logic at authorization endpoint for when a user must be shown a UI for error, login, consent, or any other custom page.
    The default implementation can be found in the *AuthorizeInteractionResponseGenerator* class, so consider deriving from this existing class if you need to augment the existing behavior.

* ***AddCustomAuthorizeRequestValidator***
    
    Adds an *ICustomAuthorizeRequestValidator* implementation to customize request parameter validation at the authorization endpoint.

* ***AddCustomTokenRequestValidator***
    
    Adds an *ICustomTokenRequestValidator* implementation to customize request parameter validation at the token endpoint.

* ***AddRedirectUriValidator***
    
    Adds an *IRedirectUriValidator* implementation to customize redirect URI validation.

* ***AddAppAuthRedirectUriValidator***
    
    Adds an "AppAuth" (OAuth 2.0 for Native Apps) compliant redirect URI validator (does strict validation but also allows http://127.0.0.1 with random port).

* ***AddJwtBearerClientAuthentication***
    
    Adds support for client authentication using JWT bearer assertions.

* ***AddMutualTlsSecretValidators***
    
    Adds the X509 secret validators for mutual TLS.


