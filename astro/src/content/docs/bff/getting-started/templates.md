---
title: Getting Started - Templates
description: A guide on how to install the BFF project templates.
sidebar:
  order: 200
  label: "Templates"
---

Project templates for Duende BFF are shipped as part of the Duende .NET project templates.
Refer the [templates documentation](/identityserver/overview/packaging.mdx#templates) for more information on how to install the templates.

## Available templates

### BFF Remote API

```shell
dotnet new duende-bff-remoteapi
```

Creates a basic JavaScript-based BFF host that configures and invokes a [remote API via the BFF proxy](/bff/fundamentals/apis/remote.mdx).

### BFF Local API

```shell
dotnet new duende-bff-localapi
```

Creates a basic JavaScript-based BFF host that invokes a [local API](/bff/fundamentals/apis/local.mdx) co-hosted with the BFF.

### BFF Blazor

```shell
dotnet new duende-bff-blazor
```

Creates a Blazor application that [uses the interactive auto render mode](/bff/fundamentals/blazor/index.md),
and secures the application across all render modes consistently using Duende.BFF.Blazor.