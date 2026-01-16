---
title: "Identity Provider Store"
description: Documentation for the IIdentityProviderStore interface which dynamically loads identity provider configurations for external authentication.
sidebar:
  label: Identity Provider
  order: 36
redirect_from:
  - /identityserver/v5/reference/stores/idp_store/
  - /identityserver/v6/reference/stores/idp_store/
  - /identityserver/v7/reference/stores/idp_store/
---

#### Duende.IdentityServer.Stores.IIdentityProviderStore

Used to dynamically load [identity provider configuration](/identityserver/reference/models/idp.md).

```csharp
/// <summary>
/// Interface to model storage of identity providers.
/// </summary>
public interface IIdentityProviderStore
{
    /// <summary>
    /// Gets all identity providers name.
    /// </summary>
    Task<IEnumerable<IdentityProviderName>> GetAllSchemeNamesAsync();

    /// <summary>
    /// Gets the identity provider by scheme name.
    /// </summary>
    /// <param name="scheme"></param>
    /// <returns></returns>
    Task<IdentityProvider> GetBySchemeAsync(string scheme);
}
```

The `IdentityProvider` is intended to be a base class to model arbitrary identity providers.
The default implementation included in *Duende IdentityServer* will return a derived class for OpenID Connect providers,
via the `OidcProvider` class.
