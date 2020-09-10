---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

The quickstarts provide step by step instructions for various common IdentityServer scenarios. They start with the absolute basics and become more complex - it is recommended you do them in order.

* adding IdentityServer to an ASP.NET Core application
* configuring IdentityServer
* issuing tokens for various clients
* securing web applications and APIs
* adding support for EntityFramework based configuration
* adding support for ASP.NET Identity

Every quickstart has a reference solution - you can find the code in the samples folder.

## Preparation
The first thing you should do is install our templates:

```
dotnet new -i IdentityServer4.Templates
```

They will be used as a starting point for the various tutorials.

{{% notice note %}}
If you are using private NuGet sources do not forget to add the `–nuget-source` parameter: `–nuget-source https://api.nuget.org/v3/index.json`
{{% /notice %}}


[See part 2]({{< ref "/quickstarts/2_interactive" >}})

[See part 2]({{< ref "2_interactive.md" >}})

[See part 1 - defining an API scope]({{< ref "1_client_credentials#defining-an-api-scope" >}})

{{< param qs_base >}}

