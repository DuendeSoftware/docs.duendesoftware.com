+++
title = "Upgrading"
weight = 120
chapter = true
+++

# Upgrading

Upgrading to a new IdentityServer version is done by updating the Nuget package and handling any breaking
changes. Some updates contain changes to the stores used by IdentityServer that requires database
schema updates. If you are using our Entity Framework based stores we recommend using Entity Framwork
Migrations.

## Upgrading from version 6 to version 7

#### Upgrading from version 6.0
There are changes to the stores which requires database schema updates. If you use the Entity Framework 
based stores you need to apply the upgrade and database migrations from [6.0 - 6.1](v6.0_to_v6.1). Then
continue on Upgrading from version 6.2. If you are experienced with the Entity Framework Migrations 
Tooling you may also create a single migration 6.0-7.0.

#### Upgrading from version 6.1
Follow the guide from 6.2.

#### Upgrading from version 6.2
There are changes to the stores which requires database schema updates. If you use the Entity Framework 
based stores you need to apply the upgrade and database migrations from [6.2 - 6.3](v6.2_to_v6.3). 
If you are experienced with the Entity Framework Migrations Tooling you may also create a single migration 6.2-7.0.

6.3 came with some breaking changes. Review the list in the upgrade guide to verify if any of them affect
your deployments.

Then continue on Upgrading from version 6.3.

#### Upgrading from version 6.3
Follow the [upgrade guide version 6.3 - 7.0](v6.3_to_v7.0)

## All upgrade guides
Here is a list of all upgrade guides.

{{%children style="h4" /%}}
