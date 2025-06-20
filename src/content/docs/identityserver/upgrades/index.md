---
title: Upgrading IdentityServer
description: "Guide for upgrading between IdentityServer versions, including instructions for database migrations, breaking changes, and version-specific upgrade paths."
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /identityserver/v5/upgrades/
  - /identityserver/v6/upgrades/
  - /identityserver/v7/upgrades/
---


Upgrading to a new IdentityServer version is done by updating the NuGet package and handling any breaking
changes. Some updates contain changes to the stores used by IdentityServer that requires database
schema updates. If you are using our Entity Framework based stores we recommend using Entity Framework
Migrations.

## Upgrading from version 7.2 to 7.3

See [IdentityServer v7.2 to v7.3](/identityserver/upgrades/v7_2-to-v7_3.md).

## Upgrading from version 7.1 to 7.2

See [IdentityServer v7.1 to v7.2](/identityserver/upgrades/v7_1-to-v7_2.md).

## Upgrading from version 7.0 to 7.1

IdentityServer v7.1 includes support for **.NET 9** and many other smaller fixes and
enhancements. There are no schema changes needed for IdentityServer 7.1. There are two changes that may require small
code changes for a minority of users:

- *`IdentityModel`* package renamed to *`Duende.IdentityModel`* which may require code updates to referenced namespaces
  and types.
- `ClientConfigurationStore` now uses `IConfigurationDbContext`.

## Upgrading from version 6 to version 7

We recommend upgrading incrementally through each minor version of the 6.x release before upgrading from
6.3 to 7.0. At each step, update the NuGet package, apply database schema changes (if any), and check for
breaking changes that affect your implementation.

#### Upgrading from version 6.0

There are changes to the stores which requires database schema updates. If you use the Entity Framework
based stores you need to apply the upgrade and database migrations
from [6.0 - 6.1](/identityserver/upgrades/v6_0-to-v6_1.md). Then
continue with the [Upgrading from version 6.2](#upgrading-from-version-62) guide. If you are experienced with the Entity Framework
Migrations Tooling you may also create a single migration from 6.0 to 7.0.

#### Upgrading from version 6.1

There no schema changes or other breaking changes between 6.1 and 6.2.
Follow the [Upgrading from version 6.2](#upgrading-from-version-62) guide.

#### Upgrading from version 6.2

There are changes to the stores which requires database schema updates. If you use the Entity Framework
based stores you need to apply the upgrade and database migrations
from [6.2 - 6.3](/identityserver/upgrades/v6_2-to-v6_3.md). If you
are experienced with the Entity Framework Migrations Tooling you may also create a single migration from
6.2 to 7.0.

There were minor breaking changes in 6.3, most notably rotated refresh tokens are now deleted immediately
on use by default. Review
the [list in the upgrade guide](/identityserver/upgrades/v6_2-to-v6_3.md#step-4-breaking-changes) to check
if any of them affect your implementation.

Then continue with "Upgrading from version 6.3" below.

#### Upgrading from version 6.3

Follow the [upgrade guide version 6.3 - 7.0](/identityserver/upgrades/v6_3-to-v7_0.md)