---
title: "Introspection Endpoint"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 5
redirect_from:
  - /identityserver/v5/reference/endpoints/introspection/
  - /identityserver/v6/reference/endpoints/introspection/
  - /identityserver/v7/reference/endpoints/introspection/
---

The introspection endpoint is an implementation of [RFC 7662](https://tools.ietf.org/html/rfc7662).

It can be used to validate reference tokens, JWTs (if the consumer does not have support for appropriate JWT or
cryptographic libraries) and refresh tokens. Refresh tokens can only be introspected by the client that requested them.

The introspection endpoint requires authentication - since the client of an introspection endpoint is an API, you
configure the secret on the `ApiResource`.

```text
POST /connect/introspect
Authorization: Basic xxxyyy

token=<token>
```

A successful response will return a status code of 200, the token claims, the token type and a flag indicating the token
is active:

```json
{
  "iss": "https://localhost:5001",
  "nbf": 1729599599,
  "iat": 1729599599,
  "exp": 1729603199,
  "client_id": "client",
  "jti": "44FD2DE9E9F8E9F4DDD141CD7C244BE9",
  "scope": "api1",
  "token_type": "access_token",
  "active": true
}
```

Unknown or expired tokens will be marked as inactive:

```json
{
  "active": false
}
```

An invalid request will return a 400, an unauthorized request 401.

## .NET client library

You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using IdentityModel.Client;

var client = new HttpClient();

var response = await client.IntrospectTokenAsync(new TokenIntrospectionRequest
{
    Address = "https://demo.duendesoftware.com/connect/introspect",
    ClientId = "api1",
    ClientSecret = "secret",

    Token = accessToken
});
```