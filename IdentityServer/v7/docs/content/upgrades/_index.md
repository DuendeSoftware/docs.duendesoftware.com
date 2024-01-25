+++
title = "Upgrading"
weight = 120
chapter = true
+++

# Upgrading

Upgrading to a new IdentityServer version is done by updating the Nuget package and handling any breaking
changes. Some updates contain changes to the stores used by IdentityServer that requires database
schema updates. If you are using our Entity Framework based stores we recommend using Entity Framework
Migrations.

## Upgrading from version 6 to version 7
We recommend upgrading incrementally through each minor version of the 6.x release before upgrading from
6.3 to 7.0. At each step, update the nuget package, apply database schema changes (if any), and check for
breaking changes that affect your implementation.

#### Upgrading from version 6.0
There are changes to the stores which requires database schema updates. If you use the Entity Framework
based stores you need to apply the upgrade and database migrations from [6.0 - 6.1](v6.0_to_v6.1). Then
continue with "Upgrading from version 6.2" below. If you are experienced with the Entity Framework
Migrations Tooling you may also create a single migration 6.0-7.0.

#### Upgrading from version 6.1
There no schema changes or other breaking changes between 6.1 abd 6.2. Follow the "Upgrading from
version 6.2" guide below.

#### Upgrading from version 6.2
There are changes to the stores which requires database schema updates. If you use the Entity Framework
based stores you need to apply the upgrade and database migrations from [6.2 - 6.3](v6.2_to_v6.3). If you
are experienced with the Entity Framework Migrations Tooling you may also create a single migration
6.2-7.0.

There were minor breaking changes in 6.3, most notably rotated refresh tokens are now deleted immediately
on use by default. Review the [list in the upgrade guide](v6.2_to_v6.3#step-4-breaking-changes) to check
if any of them affect your implementation.

Then continue with "Upgrading from version 6.3" below.

#### Upgrading from version 6.3
Follow the [upgrade guide version 6.3 - 7.0](v6.3_to_v7.0)

## All upgrade guides
Here is a list of all upgrade guides.

{{%children style="h4" /%}}
