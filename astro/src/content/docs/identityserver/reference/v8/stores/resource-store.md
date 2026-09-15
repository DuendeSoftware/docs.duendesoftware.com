---
title: "Resource Store"
description: Documentation for the IResourceStore interface which dynamically loads identity resources, API scopes, and API resources for authorization decisions.
sidebar:
  label: Resource
  order: 32
redirect_from:
  - /identityserver/v5/reference/stores/resource_store/
  - /identityserver/v6/reference/stores/resource_store/
  - /identityserver/reference/stores/resource-store/
---

#### Duende.IdentityServer.Stores.IResourceStore

Used to dynamically load resource configuration.

:::note[This is a runtime interface, not a storage backend]
`IResourceStore` defines *how* IdentityServer loads identity resources, API scopes, and API resources during protocol
processing. It does not define *where* that data is stored. The same interface is used regardless of the backing store
you choose:

* **[Entity Framework Core](/identityserver/data/providers/entityframework-core.md)** stores configuration in relational
  tables such as `ApiResources`, `ApiScopes`, `ApiResourceScopes`, and their property tables. This is a fully supported
  provider and is not being removed.
* **[In-Memory](/identityserver/data/providers/in-memory.md)** loads configuration from objects registered at startup.
* **[Duende Storage](/identityserver/data/providers/duende-storage/index.mdx)** (preview) persists configuration as
  versioned documents. It is an opt-in alternative, not a replacement for the EF Core provider.
* **[Custom](/identityserver/data/providers/custom.md)** implementations back the interface with any store you choose.

Choosing a different provider does not change this interface or how the runtime consumes it.
:::

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
