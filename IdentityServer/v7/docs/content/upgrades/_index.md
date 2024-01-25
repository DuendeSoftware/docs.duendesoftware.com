+++
title = "Upgrading"
weight = 120
chapter = true
+++

# Upgrading

Upgrading to a new IdentityServer version is done by updating the Nuget package and handling any breaking
changes. If you are using the Entity Framework based stores you might also need to apply database schema
updates.

## Upgrading from version 6 to version 7

#### Upgrading from version 6.0
If you use the Entity Framework based stores you need to apply the upgrade and database migrations from
[6.0 - 6.1](v6.0_to_v6.1) first. Then continue on Upgrading from version 6.2.

#### Upgrading from version 6.1
Follow the guide from 6.2.

#### Upgrading from version 6.2
If you use the Entity Framework based stores you need to apply the upgrade and database migrations from
[6.2 - 6.3](v6.2_to_v6.3).

6.3 came with some breaking changes. Review the list in the upgrade guide to verify if any of them affect
your deployments.

Then continue on Upgrading from version 6.3.

#### Upgrading from version 6.3
Follow the [upgrade guide version 6.3 - 7.0](v6.3_to_v7.0)

## All upgrade guides
Here is a list of all upgrade guides.

{{%children style="h4" /%}}
