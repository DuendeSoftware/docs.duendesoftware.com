---
title: "Client Store"
weight: 36
---

#### Duende.IdentityServer.Stores.IClientStore

Used to dynamically load client configuration.

```cs
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

