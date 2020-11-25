---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

The quickstarts provide step by step instructions for various common Duende IdentityServer scenarios. They start with the absolute basics and become more complex - it is recommended you do them in order.

* adding Duende IdentityServer to an ASP.NET Core application
* configuring Duende IdentityServer
* issuing tokens for various clients
* securing web applications and APIs
* adding support for EntityFramework based configuration
* adding support for ASP.NET Identity

Every quickstart has a reference solution - you can find the code in the [samples]({{< param qs_base >}}) folder.

## Preparation
The first thing you should do is install our templates:

```
dotnet new --install Duende.IdentityServer.Templates::5.0.0-preview.2
```

They will be used as a starting point for the various tutorials.

{{% notice note %}}
If you are using private NuGet sources do not forget to add the `–nuget-source` parameter: `–nuget-source https://api.nuget.org/v3/index.json`
{{% /notice %}}
