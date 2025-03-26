---
title: "ASP.NET Core Data Protection"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

Duende IdentityServer relies on the built-in [data protection](https://docs.microsoft.com/en-us/aspnet/core/security/data-protection/) feature of ASP.NET for

* protecting keys at rest (if [automatic key management](/identityserver/v5/fundamentals/keys) is used and enabled)
* protecting [persisted grants](/identityserver/v5/data/operational/grants) at rest (if enabled)
* session management (because ASP.NET Core cookies require it)

It is crucial that you setup ASP.NET Core data protection correctly before you start using your IdentityServer in production. Please consult the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview) for more details.