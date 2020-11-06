---
title: "DI Extension Methods"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

*AddIdentityServer* return a builder object that provides many extension methods to add IdentityServer specific services to DI. Here's a list grouped by feature areas.

```cs
public void ConfigureServices(IServiceCollection services)
{
    var builder = services.AddIdentityServer();
}
```

{{% notice note %}}
Many of the fundamental configuration settings can be set on the options. See the *[IdentityServerOptions]({{< ref "options" >}})* reference for more details.
{{% /notice %}}


## Configuration stores
Duende IdentityServer needs certain configuration data at runtime, namely clients and resources.

The various "in-memory" configuration APIs allow for configuring IdentityServer from an in-memory list of configuration objects.
These "in-memory" collections can be hard-coded in the hosting application, or could be loaded dynamically from a configuration file or a database.
By design, though, these collections are only created when the hosting application is starting up.

Use of these configuration APIs are designed for use when prototyping, developing, and/or testing where it is not necessary to dynamically consult database at runtime for the configuration data.
This style of configuration might also be appropriate for production scenarios if the configuration rarely changes, or it is not inconvenient to require restarting the application if the value must be changed.

TODO: add links to pages explaining the concepts

* ***AddInMemoryClients***
    
    Registers *IClientStore* and *ICorsPolicyService* implementations based on the in-memory collection of *Client* configuration objects.

* ***AddInMemoryIdentityResources***

    Registers *IResourceStore* implementation based on the in-memory collection of *IdentityResource* configuration objects.

* ***AddInMemoryApiScopes***

    Registers *IResourceStore* implementation based on the in-memory collection of *ApiScope* configuration objects.

* ***AddInMemoryApiResources***

    Registers *IResourceStore* implementation based on the in-memory collection of *ApiResource* configuration objects.

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

{{% notice note %}}
It is recommended to use the automatic key management, this section covers the extensions methods for the static configuration.
{{% /notice %}}

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

    Adds an *[IProfileService]({{< ref "profile_service" >}})* implemenation.
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
    
    Adds a an "AppAuth" (OAuth 2.0 for Native Apps) compliant redirect URI validator (does strict validation but also allows http://127.0.0.1 with random port).

* ***AddJwtBearerClientAuthentication***
    
    Adds support for client authentication using JWT bearer assertions.

* ***AddMutualTlsSecretValidators***
    
    Adds the X509 secret validators for mutual TLS.

## Caching
Client and resource configuration data is used frequently by during request processing.
If this data is being loaded from a database or other external store, then it might be expensive to frequently re-load the same data.

* ***AddInMemoryCaching***
    
    To use any of the caches described below, an implementation of *ICache<T>* must be registered in DI.
    This API registers a default in-memory implementation of *ICache<T>* that's based on ASP.NET Core's *MemoryCache*.

* ***AddClientStoreCache***
    Registers a *IClientStore* decorator implementation which will maintain an in-memory cache of *Client* configuration objects.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.

* ***AddResourceStoreCache***
    
    Registers a *IResourceStore* decorator implementation which will maintain an in-memory cache of *IdentityResource* and *ApiResource* configuration objects.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.

* ***AddCorsPolicyCache***
    
    Registers a *ICorsPolicyService* decorator implementation which will maintain an in-memory cache of the results of the CORS policy service evaluation.
    The cache duration is configurable on the *Caching* configuration options on the *IdentityServerOptions*.

Further customization of the cache is possible:

The default caching relies upon the *ICache<T>* implementation.
If you wish to customize the caching behavior for the specific configuration objects, you can replace this implementation in the dependency injection system.

The default implementation of the *ICache<T>* itself relies upon the *IMemoryCache* interface (and *MemoryCache* implementation) provided by .NET.
If you wish to customize the in-memory caching behavior, you can replace the *IMemoryCache* implementation in the dependency injection system.