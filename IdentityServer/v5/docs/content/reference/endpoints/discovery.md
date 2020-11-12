---
title: "Discovery Endpoint"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

The [discovery endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html) can be used to retrieve metadata about your IdentityServer - it returns information like the issuer name, key material, supported scopes etc. 

The discovery endpoint is available via */.well-known/openid-configuration* relative to the base address, e.g.:

    https://demo.identityserver.io/.well-known/openid-configuration

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically access the discovery endpoint from .NET code. 

```cs
var client = new HttpClient();

var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
```