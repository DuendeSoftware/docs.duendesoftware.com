---
title: "SAML Service Provider Store"
description: Documentation for the ISamlServiceProviderStore interface which retrieves SAML Service Provider configuration.
date: 2026-03-02
sidebar:
  label: SAML Service Provider
  order: 45
  badge:
    text: v8.0
    variant: tip
redirect_from:
  - /identityserver/reference/stores/saml-service-provider-store/
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

The `ISamlServiceProviderStore` interface is the contract for a service that retrieves
[SAML 2.0 Service Provider](/identityserver/saml/service-providers/) configuration by entity identifier.
It is part of the SAML 2.0 Identity Provider feature added in v8.0 (Enterprise Edition).

#### Duende.IdentityServer.Stores.ISamlServiceProviderStore

```csharp
/// <summary>
/// Interface for retrieval of SAML Service Provider configuration.
/// </summary>
public interface ISamlServiceProviderStore
{
    /// <summary>
    /// Finds a SAML Service Provider by its entity identifier.
    /// </summary>
    /// <param name="entityId">The entity identifier of the Service Provider.</param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns>The Service Provider, or null if not found.</returns>
    Task<SamlServiceProvider?> FindByEntityIdAsync(string entityId, CancellationToken ct);
}
```

#### Members

| Name                                                                                    | Description                                                                 |
|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `Task<SamlServiceProvider?> FindByEntityIdAsync(string entityId, CancellationToken ct)` | Retrieves a SAML Service Provider by its entity ID, or `null` if not found. |

For full details on the `SamlServiceProvider` model and how to register service providers,
see the [SAML Service Providers](/identityserver/saml/service-providers/) page.
