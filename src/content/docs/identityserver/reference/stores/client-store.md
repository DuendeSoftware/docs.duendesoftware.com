---
title: "Client Store"
description: Documentation for the IClientStore interface which is used to dynamically load client configuration by client ID.
sidebar:
  label: Client
  order: 36
redirect_from:
  - /identityserver/v5/reference/stores/client_store/
  - /identityserver/v6/reference/stores/client_store/
  - /identityserver/v7/reference/stores/client_store/
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
    /// <returns>The client</returns>
    Task<Client> FindClientByIdAsync(string clientId);
}
```
