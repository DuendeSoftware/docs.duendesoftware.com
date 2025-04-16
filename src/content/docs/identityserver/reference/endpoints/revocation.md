---
title: "Revocation Endpoint"
description: "Learn about the revocation endpoint that allows invalidating access and refresh tokens according to RFC 7009 specification."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 6
redirect_from:
  - /identityserver/v5/reference/endpoints/revocation/
  - /identityserver/v6/reference/endpoints/revocation/
  - /identityserver/v7/reference/endpoints/revocation/
---

This endpoint allows revoking access tokens (reference tokens only) and refresh token.
It implements the token revocation specification [(RFC 7009)](https://tools.ietf.org/html/rfc7009).

* **`token`**

  the token to revoke (required)

* **`token_type_hint`**

  either `access_token` or `refresh_token` (optional)

```text
POST /connect/revocation HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=...&token_type_hint=refresh_token
```

## .NET Client Library

You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using IdentityModel.Client;

var client = new HttpClient();

var result = await client.RevokeTokenAsync(new TokenRevocationRequest
{
    Address = "https://demo.duendesoftware.com/connect/revocation",
    ClientId = "client",
    ClientSecret = "secret",

    Token = token
});
```
