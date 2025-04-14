---
title: "Discovery Endpoint"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 1
redirect_from:
  - /identityserver/v5/reference/endpoints/discovery/
  - /identityserver/v6/reference/endpoints/discovery/
  - /identityserver/v7/reference/endpoints/discovery/
---

The [discovery endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html) can be used to retrieve metadata
about your IdentityServer - it returns information like the issuer name, key material, supported scopes etc.

The discovery endpoint is available via `/.well-known/openid-configuration` relative to the base address, e.g.:

    https://demo.duendesoftware.com/.well-known/openid-configuration

## .NET Client Library

You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
var client = new HttpClient();

var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
```