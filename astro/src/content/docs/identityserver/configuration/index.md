---
title: Configuration API
description: Documentation for the Configuration API endpoints that enable management and configuration of IdentityServer implementations
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /identityserver/v5/configuration/
  - /identityserver/v6/configuration/
  - /identityserver/v7/configuration/
---

:::tip
Added in Duende IdentityServer 6.3
:::

The Configuration API is a collection of endpoints that allow for management and configuration of an IdentityServer
implementation. The Configuration API can be hosted either separately or within the IdentityServer implementation, and is
distributed through the separate [Duende.IdentityServer.Configuration NuGet package](https://www.nuget.org/packages/Duende.IdentityServer.Configuration).

Currently, the Configuration API supports the [Dynamic Client Registration](/identityserver/configuration/dcr.mdx) protocol.

:::note
This feature is part of the [Duende IdentityServer Business and Enterprise Edition](https://duendesoftware.com/products/identityserver).
:::

The Configuration API source code is available [on GitHub](https://github.com/DuendeSoftware/products/tree/main/identity-server/src/Configuration).

Samples of the Configuration API are available [here](/identityserver/samples/configuration.mdx).
