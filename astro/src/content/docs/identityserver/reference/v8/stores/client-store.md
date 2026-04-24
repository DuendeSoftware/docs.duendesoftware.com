---
title: "Client Store"
description: Documentation for the IClientStore interface which is used to dynamically load client configuration by client ID.
sidebar:
  label: Client
  order: 36
redirect_from:
  - /identityserver/v5/reference/stores/client_store/
  - /identityserver/v6/reference/stores/client_store/
  - /identityserver/reference/stores/client-store/
---

#### Duende.IdentityServer.Stores.IClientStore

Used to dynamically load client configuration.

```csharp
/// <summary>
/// Retrieval of client configuration
/// </summary>
public interface IClientStore
{
    /// <summary>
    /// Finds a client by id
    /// </summary>
    /// <param name="clientId">The client id</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The client</returns>
    Task<Client?> FindClientByIdAsync(string clientId, CancellationToken ct);

    /// <summary>
    /// Returns all clients for enumeration purposes (e.g., conformance assessment).
    /// </summary>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>An async enumerable of all clients.</returns>
    IAsyncEnumerable<Client> GetAllClientsAsync(CancellationToken ct);
}
```

`GetAllClientsAsync` returns all configured clients as an async enumerable. <span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

Used by the [conformance report](/identityserver/diagnostics/conformance-report.md) and configuration validation features. Custom `IClientStore` implementations must implement this method — see the [upgrade guide](/identityserver/upgrades/v7_4-to-v8_0.md#iclientstoregetallclientsasync-now-required) for details.
