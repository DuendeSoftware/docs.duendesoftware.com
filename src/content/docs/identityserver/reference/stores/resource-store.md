---
title: "Resource Store"
description: Documentation for the IResourceStore interface which dynamically loads identity resources, API scopes, and API resources for authorization decisions.
sidebar:
  label: Resource
  order: 32
redirect_from:
  - /identityserver/v5/reference/stores/resource_store/
  - /identityserver/v6/reference/stores/resource_store/
  - /identityserver/v7/reference/stores/resource_store/
---

#### Duende.IdentityServer.Stores.IResourceStore

Used to dynamically load resource configuration.

```csharp
/// <summary>
/// Resource retrieval
/// </summary>
public interface IResourceStore
{
    /// <summary>
    /// Gets identity resources by scope name.
    /// </summary>
    Task<IEnumerable<IdentityResource>> FindIdentityResourcesByScopeNameAsync(IEnumerable<string> scopeNames);

    /// <summary>
    /// Gets API scopes by scope name.
    /// </summary>
    Task<IEnumerable<ApiScope>> FindApiScopesByNameAsync(IEnumerable<string> scopeNames);

    /// <summary>
    /// Gets API resources by scope name.
    /// </summary>
    Task<IEnumerable<ApiResource>> FindApiResourcesByScopeNameAsync(IEnumerable<string> scopeNames);

    /// <summary>
    /// Gets API resources by API resource name.
    /// </summary>
    Task<IEnumerable<ApiResource>> FindApiResourcesByNameAsync(IEnumerable<string> apiResourceNames);

    /// <summary>
    /// Gets all resources.
    /// </summary>
    Task<Resources> GetAllResourcesAsync();
}
```
