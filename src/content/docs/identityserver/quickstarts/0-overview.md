---
title: "IdentityServer Quickstarts"
description: "Step-by-step tutorials for implementing common Duende IdentityServer scenarios, from basic setup to advanced features."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /quickstarts/
  - /identityserver/quickstarts/
  - /identityserver/v5/quickstarts/
  - /identityserver/v5/quickstarts/0_overview/
  - /identityserver/v6/quickstarts/
  - /identityserver/v6/quickstarts/0_overview/
  - /identityserver/v7/quickstarts/
  - /identityserver/v7/quickstarts/0_overview/
---

The quickstarts provide step-by-step instructions for various common Duende IdentityServer scenarios. They start with
the absolute basics and become more complex - it is recommended you do them in order.

* adding Duende IdentityServer to an ASP.NET Core application
* configuring Duende IdentityServer
* issuing tokens for various clients
* securing web applications and APIs
* adding support for EntityFramework based configuration
* adding support for ASP.NET Identity

Every quickstart has a reference solution - you can find the code in
the [samples](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Quickstarts) folder.

## Preparation

The first thing you should do is install our templates:

```bash title=Terminal
dotnet new install Duende.Templates
```

They will be used as a starting point for the various tutorials.

:::note
You may have a previous version of Duende templates (`Duende.Templates`) installed on your machine.
To uninstall the previous template package, and install the latest version, use the following command:

```bash title=Terminal
dotnet new uninstall Duende.Templates
dotnet new install Duende.Templates
```
:::

<iframe width="853" height="505" src="https://www.youtube.com/embed/cxYmODQHErM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
