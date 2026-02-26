---
title: "OAuth Metadata Endpoint"
description: "Learn about the OAuth metadata endpoint that provides information about your IdentityServer configuration, including issuer name, key material, and supported scopes."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: OAuth Metadata
  order: 2
---

The [OAuth Metadata Endpoint](https://www.rfc-editor.org/rfc/rfc8414.html) is a standardized way to retrieve metadata
about your IdentityServer.

The discovery endpoint is available via `/.well-known/oauth-authorization-server` relative to the base address, e.g.:

```text
https://demo.duendesoftware.com/.well-known/oauth-authorization-server
```

## Issuer Name and Path Base

When hosting IdentityServer in an application that uses [ASP.NET Core's `PathBaseMiddleware`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.extensions.usepathbasemiddleware), the base path will be
included in the issuer name and discovery document URLs.

Refer the [Discovery Endpoint](/identityserver/reference/endpoints/discovery.md#issuer-name-and-path-base)
for more information.
