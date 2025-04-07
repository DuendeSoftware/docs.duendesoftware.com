---
title: "Upgrading"
description: "Upgrading BFF"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 1
redirect_from:
  - /bff/v2/upgrading/
  - /bff/v3/upgrading/
  - /identityserver/v7/bff/upgrading/
---

Upgrading to a new Duende.BFF version is done by updating the NuGet package and handling any breaking
changes. Some updates contain changes to the stores used by IdentityServer that requires database
schema updates. If you are using our Entity Framework based stores we recommend using Entity Framework
Migrations.
