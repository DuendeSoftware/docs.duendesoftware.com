---
title: "CORS Policy Service"
sidebar:
  order: 36
---

#### Duende.IdentityServer.Stores.ICorsPolicyService

Used to determine if CORS requests are allowed to certain protocol endpoints.

```cs
    /// <summary>
    /// Service that determines if CORS is allowed.
    /// </summary>
    public interface ICorsPolicyService
    {
        /// <summary>
        /// Determines whether origin is allowed.
        /// </summary>
        /// <param name="origin">The origin.</param>
        /// <returns></returns>
        Task<bool> IsOriginAllowedAsync(string origin);
    }
```
