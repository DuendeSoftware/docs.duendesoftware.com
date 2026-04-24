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
  - /identityserver/reference/stores/resource-store/
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
    Task<IReadOnlyCollection<IdentityResource>> FindIdentityResourcesByScopeNameAsync(IEnumerable<string> scopeNames, CancellationToken ct);

    /// <summary>
    /// Gets API scopes by scope name.
    /// </summary>
    Task<IReadOnlyCollection<ApiScope>> FindApiScopesByNameAsync(IEnumerable<string> scopeNames, CancellationToken ct);

    /// <summary>
    /// Gets API resources by scope name.
    /// </summary>
    Task<IReadOnlyCollection<ApiResource>> FindApiResourcesByScopeNameAsync(IEnumerable<string> scopeNames, CancellationToken ct);

    /// <summary>
    /// Gets API resources by API resource name.
    /// </summary>
    Task<IReadOnlyCollection<ApiResource>> FindApiResourcesByNameAsync(IEnumerable<string> apiResourceNames, CancellationToken ct);

    /// <summary>
    /// Gets all resources.
    /// </summary>
    Task<Resources> GetAllResourcesAsync(CancellationToken ct);
}
```
