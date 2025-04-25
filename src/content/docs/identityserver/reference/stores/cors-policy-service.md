---
title: "CORS Policy Service"
description: Documentation for the ICorsPolicyService interface which determines if CORS requests from specific origins are allowed to access protocol endpoints.
sidebar:
  label: CORS Policy
  order: 36
redirect_from:
  - /identityserver/v5/reference/stores/cors_policy_service/
  - /identityserver/v6/reference/stores/cors_policy_service/
  - /identityserver/v7/reference/stores/cors_policy_service/
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
