---
title: "IdentityServer Admin UI"
description: "Documentation for implementing an administrative UI for IdentityServer."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Admin
  order: 5
---

Duende IdentityServer is an OAuth 2.0 and OpenID Connect protocol engine and framework, and does not include any UI beyond what is available in the [project templates](/identityserver/overview/packaging/#templates).
These contain UI for the login and consent pages, among others, but do not currently include an administrative UI as part of the product.

In this section, we will cover a couple of approaches to configure and administer Duende IdentityServer.

## In-Memory vs. Database Configuration

[Configuration data](/identityserver/data/configuration/) in Duende IdentityServer is stored in a configuration store.

IdentityServer supports in-memory configuration, where clients, resources, scopes, and other configuration options are stored in memory.
This approach is valuable, as configuration can be maintained and linked from a specific commit in source control, and deployed as a single unit with IdentityServer.

The downside of this approach is that to change configuration, the application will have to be restarted or redeployed.
To allow for dynamic configuration changes, you can [store configuration in a database](/identityserver/data/ef/).

## Build Your Own Admin UI

When using a database-backed configuration store, you can use one of several [general-purpose solutions](#third-party-identityserver-admin-ui).
It is worth considering building your own solution, though.

A configuration and administration UI allows you to configure your production system manually.
You may want to consider reducing the number of available options in this UI, to prevent accidental configuration errors.
For example, you may want to limit the options to only those that are relevant to your production environment, and not support editing all the various protocol, client, and resource options.
A limited subset of the available options may be enough.

:::tip[Duende IdentityServer AdminUI Templates]
Creating custom, specialized admin UI functionality is demonstrated in the [EntityFramework-based template](https://github.com/DuendeSoftware/products/tree/main/templates).
You can use its UI to manage clients and scopes as a starting point.
:::

## Third-Party IdentityServer Admin UI

A number of third-party projects and products have created IdentityServer Admin UIs. These are general-purpose and offer
access to the Duende IdentityServer configuration data in a forms-over-data style.

| Project                                                                               | Description                                                                                                                                                   |
|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Duende.IdentityServer.Admin](https://github.com/skoruba/Duende.IdentityServer.Admin) | ASP.NET Core Admin UI for Duende IdentityServer by Jan Škoruba                                                                                                |
| [Aguafrommars TheIdServer](https://github.com/Aguafrommars/TheIdServer)               | OpenID/Connect, OAuth2, WS-Federation and SAML 2.0 server based on Duende IdentityServer and ITFoxtec Identity SAML 2.0 with its admin UI by Olivier Lefebvre |
| [RockSolidKnowledge AdminUI](https://www.identityserver.com/products/adminui)         | UI and APIs for managing your Duende IdentityServer                                                                                                           |
