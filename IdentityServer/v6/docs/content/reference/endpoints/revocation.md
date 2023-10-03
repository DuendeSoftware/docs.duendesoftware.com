---
title: "Revocation Endpoint"
date: 2020-09-10T08:22:12+02:00
weight: 6
---

This endpoint allows revoking access tokens (reference tokens only) and refresh token. 
It implements the token revocation specification [(RFC 7009)](https://tools.ietf.org/html/rfc7009).

* ***token***
    
    the token to revoke (required)

* ***token_type_hint***
    
    either *access_token* or *refresh_token* (optional)

```
POST /connect/revocation HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW

token=...&token_type_hint=refresh_token
```

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with the protocol endpoint from .NET code.

```
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
