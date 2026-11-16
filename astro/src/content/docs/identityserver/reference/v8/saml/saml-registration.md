---
title: "SAML Registration Extension Methods"
description: "Reference for the dependency injection extension methods that register SAML stores, caches, and providers in IdentityServer v8."
date: 2026-11-16
sidebar:
  label: SAML Registration
  order: 1
---

These extension methods on `IIdentityServerBuilder` register SAML services. For other registration methods, see [Dependency Injection Extension Methods](/identityserver/reference/v8/di.md).

| Method | Description |
|---|---|
| `AddSaml()` / `AddSaml(Action<SamlOptions>)` | Adds the SAML identity provider and enables the five SAML endpoints. |
| `AddInMemorySamlServiceProviders(IEnumerable<SamlServiceProvider>)` | Registers an in-memory service provider store. Validation applies, duplicate entity IDs throw `ArgumentException`, and disabled SPs aren't returned. |
| `AddSamlServiceProviderStore<T>()` | Registers a custom [`ISamlServiceProviderStore`](/identityserver/reference/v8/saml/saml-service-provider-store.md), wrapped by `ValidatingSamlServiceProviderStore<T>` (transient). |
| `AddSamlServiceProviderStoreCache<T>()` | Caches the store using `HybridCache`. `GetAllSamlServiceProvidersAsync` isn't cached. |
| `AddSamlSigninStateStore<T>()` | Registers a custom [`ISamlSigninStateStore`](/identityserver/reference/v8/saml/saml-signin-state-store.md). |
| `AddSamlLogoutSessionStore<T>()` | Registers a custom [`ISamlLogoutSessionStore`](/identityserver/reference/v8/saml/saml-logout-session-store.md) (transient). |
| `AddSamlDynamicProvider()` | Adds dynamic SAML service provider support. |
| `AddInMemorySamlProviders(IEnumerable<SamlProvider>)` | Registers in-memory dynamic SAML providers. |

## Registration behavior

* `AddSaml()` registers its defaults with `TryAdd`, except `ISamlLogoutNotificationService`, which it registers with `Replace` (scoped). Register a custom logout notification service after `AddSaml()`.
* `AddIdentityServer()` registers `ISamlSigningService`, `ISaml2IssuerNameService`, `ISaml2SloResponseGenerator`, and the in-memory `ISamlLogoutSessionStore` with `TryAdd`, so they're available even before `AddSaml()`.
* Defaults for the validators, response generators, resource resolver, NameID generator, metadata generator, front-channel logout request builder, and IdP-initiated service are transient. `ISamlSigningService` is scoped. The in-memory sign-in state and logout session stores are singletons.
* `AddConfigurationStore()` and `AddOperationalStore()` from `Duende.IdentityServer.EntityFramework` register the EF Core service provider, sign-in state, and logout session stores.
