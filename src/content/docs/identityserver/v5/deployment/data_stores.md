---
title: "IdentityServer Data Stores"
date: 2020-09-10T08:22:12+02:00
order: 30
---

IdentityServer itself is stateless and does not require server affinity - but there is data that needs to be shared between in multi-instance deployments.

## Configuration data
This typically includes:

* resources
* clients
* startup configuration, e.g. key material, external provider settings etc…

The way you store that data depends on your environment. In situations where configuration data rarely changes we recommend using the in-memory stores and code or configuration files. In highly dynamic environments (e.g. Saas) we recommend using a database or configuration service to load configuration dynamically.

## Operational data
For certain operations, IdentityServer needs a persistence store to keep state, this includes:

* issuing authorization codes
* issuing reference and refresh tokens
* storing consent
* automatic management for signing keys

You can either use a traditional database for storing operational data, or use a cache with persistence features like Redis.

Duende IdentityServer includes storage implementations for above data using EntityFramework, and you can build your own. See the [data stores](../data) section for more information.