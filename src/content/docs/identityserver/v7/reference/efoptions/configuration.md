---
title: "Configuration Options"
description: "Entity Framework"
sidebar:
  order: 20
---

#### Duende.IdentityServer.EntityFramework.Options.ConfigurationStoreOptions

These options are configurable when using the Entity Framework Core for
the [configuration store](../data/configuration):

You set the options at startup time in your `AddConfigurationStore` method:

```cs
var builder = services.AddIdentityServer()
    .AddConfigurationStore(options =>
    {
        // configure options here..
    })
```

## Pooling

Settings that affect the DbContext pooling feature of Entity Framework Core.

* **`EnablePooling`**

  Gets or set if EF DbContext pooling is enabled. Defaults to `false`.


* **`PoolSize`**

  Gets or set the pool size to use when DbContext pooling is enabled. If not set, the EF default is used.

## Schema

Settings that affect the database schema and table names.

* **`DefaultSchema`**

  Gets or sets the default schema. Defaults to `null`.

`TableConfiguration` settings for each individual table (schema and name) managed by this feature:

Identity Resource related tables:

* **`IdentityResource`**
* **`IdentityResourceClaim`**
* **`IdentityResourceProperty`**

API Resource related tables:

* **`ApiResource`**
* **`ApiResourceSecret`**
* **`ApiResourceScope`**
* **`ApiResourceClaim`**
* **`ApiResourceProperty`**

Client related tables:

* **`Client`**
* **`ClientGrantType`**
* **`ClientRedirectUri`**
* **`ClientPostLogoutRedirectUri`**
* **`ClientScopes`**
* **`ClientSecret`**
* **`ClientClaim`**
* **`ClientIdPRestriction`**
* **`ClientCorsOrigin`**
* **`ClientProperty`**

API Scope related tables:

* **`ApiScope`**
* **`ApiScopeClaim`**
* **`ApiScopeProperty`**

Identity provider related tables:

* **`IdentityProvider`**

