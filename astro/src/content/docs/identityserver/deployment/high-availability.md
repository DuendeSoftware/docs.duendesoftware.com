---
title: High Availability and Disaster Recovery
description: Run IdentityServer as a stateless, horizontally scalable cluster, make every instance resolve the same issuer and keys, and understand the consistency constraints of active-active deployments.
date: 2026-10-13
sidebar:
  label: High Availability
  order: 15
---

A highly available Duende IdentityServer deployment rests on these ground rules: keep the runtime stateless, put shared state in the right external stores, and make every instance and region behave identically.

## Stateless Runtime and External Stores

Treat the IdentityServer process as stateless and horizontally scalable. Anything that is created or changed at runtime and must survive a restart, a redeploy, or a failover belongs in an external store rather than in process memory or on local disk. That includes grants, consent, signing keys under automatic key management, and any persisted server-side sessions.

Configuration data (clients, resources, and scopes) is the exception when you define it in code or configuration files and register it with the in-memory stores. Every instance then starts with the same configuration, as long as all instances run the same build and settings. Use a configuration store instead when configuration must change at runtime, for example through an admin UI or dynamic client registration.

This separation lets you add, remove, or replace instances without losing state, and it is a prerequisite for every failover and active-active pattern described below. For the mechanics, see [IdentityServer Data Stores](/identityserver/deployment/index.md#identityserver-data-stores).

## Configuration Data and Operational Data

The two categories of external data have different consistency requirements, which determines how safely you can cache or replicate each of them.

* **Configuration data** (clients, resources, scopes, identity providers) changes rarely and tolerates short propagation delays between instances and regions. See [Configuration Data](/identityserver/data/configuration.mdx).
* **Operational data** (persisted grants, consent, device flow codes, and signing keys when using automatic key management) changes continuously. A code or token issued by one instance must be redeemable by any other instance almost immediately, or logins and refreshes fail intermittently. Use synchronous replication or a single authoritative store reachable from every active instance. See [Operational Data](/identityserver/data/operational.md).

User accounts and credentials are a separate concern. They live in a user store outside IdentityServer's configuration and operational stores, with their own consistency and backup requirements, so plan their replication separately.

## Consistent Issuer Across Instances and Regions

By default, IdentityServer derives the `iss` claim from the host that served the request. If a primary region and a failover region are reached through different host names, they can issue tokens with different issuer values, which breaks validation for APIs that expect a specific issuer. The requirement is not a single issuer, but that every instance resolves the same issuer for the same request.

With [Multi-Issuer](/identityserver/tokens/issuer.mdx#multi-issuer) or [Spaces](/identityserver/spaces/index.mdx), the issuer legitimately varies per host name or space. Every instance must still resolve it identically, so keep host names and path bases stable through the proxy, and leave `IssuerUri` unset when you use Spaces.

In any deployment with more than one instance, region, or failover target:

* Ensure that every instance resolves the same issuer for a given request: make sure the proxy in front of IdentityServer always forwards the same public host name and path base. With a single issuer, you can also set `IdentityServerOptions.IssuerUri` to a fixed value. Leave it unset when you use Multi-Issuer or Spaces, because they infer the issuer per request. See [Issuer Claim](/identityserver/tokens/issuer.mdx) and [Proxy Servers and Load Balancers](/identityserver/deployment/index.md#proxy-servers-and-load-balancers).
* Share the signing keys across all nodes and regions, using a [shared key store](/identityserver/fundamentals/key-management.md#key-storage).
* Share the ASP.NET Core Data Protection keys across all nodes and regions. See [ASP.NET Core Data Protection](/identityserver/deployment/index.md#aspnet-core-data-protection).

:::note
Varying the issuer per host name only changes the `iss` value. It does not isolate data, keys, or administration between those hosts. See [Issuer Claim](/identityserver/tokens/issuer.mdx).
:::

## Active-Active Constraints

An active-active deployment, where several regions or clusters accept traffic for the same hostname(s), must meet at least these constraints:

* **Consistent issuer resolution.** Every active region resolves the same issuer for a given host name or space.
* **Operational store visibility.** A grant, authorization code, or refresh token created in one region must be visible in every other active region before a client can plausibly redeem it. With asynchronous replication, a redemption that reaches a region that has not yet received the write fails with `invalid_grant`. This also affects one-time-use artifacts such as authorization codes and refresh tokens that are rotated on use.
* **Shared signing keys.** Every region must be able to produce and validate tokens signed by every other region. With automatic key management, all regions should share the same signing key store, or an equivalently synchronized one.
* **Shared Data Protection keys,** so that cookies, protected grants, and protected state can be read by any node.
* **Synchronized clocks** across regions, so token lifetimes and time-based validation behave consistently.

If synchronous consistency across regions is not achievable, prefer an active-passive or regional-failover topology with a defined recovery point and recovery time objective over silently accepting eventual consistency for operational data.
