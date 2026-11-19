---
title: "SAML Registration Extension Methods"
description: "Reference for the dependency injection extension methods that register SAML stores, caches, and providers in IdentityServer v8."
date: 2026-11-16
sidebar:
  label: SAML Registration
  order: 1
---

These extension methods on `IIdentityServerBuilder` register SAML services. For other registration methods, see [Dependency Injection Extension Methods](/identityserver/reference/v8/di.md).

SAML in IdentityServer works in two directions, and the registration methods differ for each:

* **IdentityServer as the SAML identity provider (IdP).** Your applications are *service providers* (SPs) that rely on IdentityServer to sign users in. These SPs are downstream of IdentityServer, and each one is a `SamlServiceProvider`.
* **IdentityServer as a SAML service provider.** Users sign in with an *external* SAML identity provider, which is upstream of IdentityServer, and each one is a `SamlProvider` (a dynamic provider).

## Serving downstream service providers

| Method | Description |
|---|---|
| `AddSaml()` / `AddSaml(Action<SamlOptions>)` | Adds SAML 2.0 support to IdentityServer. Registers all SAML services and endpoints, and enables the SAML endpoints in `EndpointsOptions`. The overload with a `configureSaml` action adds SAML 2.0 support to IdentityServer with custom endpoint configuration. `configureSaml` is the action to configure SAML options. Endpoint paths configured here are used for routing registration. Returns the builder, to allow chaining. |
| `AddInMemorySamlServiceProviders(IEnumerable<SamlServiceProvider>)` | Adds the in-memory SAML service provider store. `serviceProviders` are the SAML service providers. Returns the builder, to allow chaining. Validation applies, duplicate entity IDs throw `ArgumentException`, and `FindByEntityIdAsync` doesn't return disabled SPs. |
| `AddSamlServiceProviderStore<T>()` | Adds a custom SAML service provider store. The store is wrapped in a `ValidatingSamlServiceProviderStore<T>` that validates service provider configuration on load using the registered [`ISamlServiceProviderConfigurationValidator`](/identityserver/reference/v8/saml/saml-service-provider-configuration-validator.md). `T` is the type of the [`ISamlServiceProviderStore`](/identityserver/reference/v8/saml/saml-service-provider-store.md) implementation. Returns the builder, to allow chaining. The registration is transient. |
| `AddSamlServiceProviderStoreCache<T>()` | Registers a caching decorator around a custom `ISamlServiceProviderStore` implementation. `T` is the type of the concrete service provider store class that is registered in DI. Returns the builder, to allow chaining. The decorator caches `SamlServiceProvider` configuration objects in a `HybridCache` to reduce repeated store lookups. The cache duration is configured with `SamlServiceProviderStoreExpiration` on `IdentityServerOptions.Caching`. `GetAllSamlServiceProvidersAsync` isn't cached. |
| `AddSamlSigninStateStore<T>()` | Registers a custom [`ISamlSigninStateStore`](/identityserver/reference/v8/saml/saml-signin-state-store.md) implementation for persisting SAML authentication state during the single sign-on flow. Replace the default in-memory store with a durable implementation for production use. The registration is transient. |
| `AddSamlLogoutSessionStore<T>()` | Registers a custom [`ISamlLogoutSessionStore`](/identityserver/reference/v8/saml/saml-logout-session-store.md) implementation for persisting SAML logout session tracking state during the single logout flow. Replace the default in-memory store with a durable implementation for production use. The registration is transient. |

## Signing in with external identity providers

| Method | Description |
|---|---|
| `AddSamlDynamicProvider()` | Adds the SAML 2.0 dynamic provider feature. It registers the SAML SP authentication handler for dynamic providers, so IdentityServer can act as the SP toward dynamically managed, external SAML identity providers (see [Dynamic Providers](/identityserver/ui/login/dynamicproviders.mdx#saml-providers)). For downstream `SamlServiceProvider` entries, use the methods in the previous section. |
| `AddInMemorySamlProviders(IEnumerable<SamlProvider>)` | Adds the in-memory SAML provider store. Providers registered by multiple calls to any in-memory identity provider registration method are accumulated rather than replacing one another. The supplied collection is retained by reference, so callers may mutate their own collection at runtime and have the changes observed by the store. The `SamlProvider` entries describe the external SAML identity providers that users sign in with. They're separate from `SamlServiceProvider` entries. |

## Registration behavior

* `AddSaml()` registers its defaults without overwriting services you've already registered. The exception is `ISamlLogoutNotificationService`, which it replaces, so register a custom logout notification service after `AddSaml()`.
* `AddIdentityServer()` registers `ISamlSigningService`, `ISaml2IssuerNameService`, `ISaml2SloResponseGenerator`, and the in-memory `ISamlLogoutSessionStore` as defaults, so they're available even before `AddSaml()`.
* Defaults for the validators, response generators, resource resolver, NameID generator, metadata generator, front-channel logout request builder, and IdP-initiated service are transient. `ISamlSigningService` is scoped. The in-memory sign-in state and logout session stores are singletons.
* `AddIdentityServer()` also registers an empty `ISamlServiceProviderStore` and a no-op `ISamlLogoutNotificationService`. `AddSaml()` replaces the no-op notification service.
* `AddConfigurationStore()` and `AddOperationalStore()` from `Duende.IdentityServer.EntityFramework` register the EF Core stores for service providers, sign-in state, and logout session stores.
