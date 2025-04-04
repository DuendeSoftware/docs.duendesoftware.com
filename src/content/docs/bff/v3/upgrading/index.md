---
title: "Upgrading"
description: "Upgrading BFF"
date: 2020-09-10T08:22:12+02:00
order: 1
---

Upgrading to a new Duende.BFF version is done by updating the NuGet package and handling any breaking
changes. Some updates contain changes to the stores used by IdentityServer that requires database
schema updates. If you are using our Entity Framework based stores we recommend using Entity Framework
Migrations.
