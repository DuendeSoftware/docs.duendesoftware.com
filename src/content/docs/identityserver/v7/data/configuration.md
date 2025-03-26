---
title: Configuration Data
sidebar:
  order: 10
---


Configuration data models the information for [Clients](/identityserver/v7/fundamentals/clients) and [Resources](/identityserver/v7/fundamentals/resources).

## Stores

Store interfaces are designed to abstract accessing the configuration data. 
The stores used in Duende IdentityServer are:
* [Client store](/identityserver/v7/reference/stores/client_store) for *Client* data.
* [CORS policy service](/identityserver/v7/reference/stores/cors_policy_service) for [CORS support](/identityserver/v7/tokens/cors). Given that this is so closely tied to the *Client* configuration data, the CORS policy service is considered one of the configuration stores.
* [Resource store](/identityserver/v7/reference/stores/resource_store) for *IdentityResource*, *ApiResource*, and *ApiScope* data.
* [Identity Provider store](/identityserver/v7/reference/stores/idp_store) for *IdentityProvider* data.

## Registering Custom Stores

Custom implementations of the stores must be registered in the DI system.
There are [convenience methods](/identityserver/v7/reference/di#configuration-stores) for registering these.
For example:

```cs
builder.Services.AddIdentityServer()
    .AddClientStore<YourCustomClientStore>()
    .AddCorsPolicyService<YourCustomCorsPolicyService>()
    .AddResourceStore<YourCustomResourceStore>()
    .AddIdentityProviderStore<YourCustomAddIdentityProviderStore>();

```

## Caching Configuration Data

Configuration data is used frequently during request processing.
If this data is loaded from a database or other external store, then it might be expensive to frequently re-load the same data.

Duende IdentityServer provides [convenience methods](/identityserver/v7/reference/di#caching-configuration-data) to enable caching data from the various stores.
The caching implementation relies upon an *ICache\<T>* service and must also be added to DI. 
For example:

```cs
builder.Services.AddIdentityServer()
    .AddClientStore<YourCustomClientStore>()
    .AddCorsPolicyService<YourCustomCorsPolicyService>()
    .AddResourceStore<YourCustomResourceStore>()
    .AddInMemoryCaching()
    .AddClientStoreCache<YourCustomClientStore>()
    .AddCorsPolicyCache<YourCustomCorsPolicyService>()
    .AddResourceStoreCache<YourCustomResourceStore>()
    .AddIdentityProviderStoreCache<YourCustomAddIdentityProviderStore>();

```

The duration of the data in the default cache is configurable on the [IdentityServerOptions](/identityserver/v7/reference/options#caching).
For example:

```cs
builder.Services.AddIdentityServer(options => {
    options.Caching.ClientStoreExpiration = TimeSpan.FromMinutes(5);
    options.Caching.ResourceStoreExpiration = TimeSpan.FromMinutes(5);
})
    .AddClientStore<YourCustomClientStore>()
    .AddCorsPolicyService<YourCustomCorsPolicyService>()
    .AddResourceStore<YourCustomResourceStore>()
    .AddInMemoryCaching()
    .AddClientStoreCache<YourCustomClientStore>()
    .AddCorsPolicyCache<YourCustomCorsPolicyService>()
    .AddResourceStoreCache<YourCustomResourceStore>();

```

Further customization of the cache is possible: 
* If you wish to customize the caching behavior for the specific configuration objects, you can replace the *ICache\<T>* service implementation in the dependency injection system.
* The default implementation of the *ICache\<T>* itself relies upon the *IMemoryCache* interface (and *MemoryCache* implementation) provided by .NET.
If you wish to customize the in-memory caching behavior, you can replace the *IMemoryCache* implementation in the dependency injection system.

## In-Memory Stores

The various [in-memory configuration APIs](/identityserver/v7/reference/di#configuration-stores) allow for configuring IdentityServer from an in-memory list of the various configuration objects.
These in-memory collections can be hard-coded in the hosting application, or could be loaded dynamically from a configuration file or a database.
By design, though, these collections are only created when the hosting application is starting up.

Use of these configuration APIs are designed for use when prototyping, developing, and/or testing where it is not necessary to dynamically consult database at runtime for the configuration data.
This style of configuration might also be appropriate for production scenarios if the configuration rarely changes, or it is not inconvenient to require restarting the application if the value must be changed.
