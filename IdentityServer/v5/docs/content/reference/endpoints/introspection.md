---
title: "Introspection Endpoint"
date: 2020-09-10T08:22:12+02:00
weight: 5
---

The introspection endpoint is an implementation of [RFC 7662](https://tools.ietf.org/html/rfc7662).

It can be used to validate reference tokens (or JWTs if the consumer does not have support for appropriate JWT or cryptographic libraries).
The introspection endpoint requires authentication - since the client of an introspection endpoint is an API, you configure the secret on the *ApiResource*.

```
POST /connect/introspect
Authorization: Basic xxxyyy

token=<token>
```

A successful response will return a status code of 200 and either an active or inactive token::

```
{
    "active": true,
    "sub": "123"
}
```

Unknown or expired tokens will be marked as inactive::

```
{
    "active": false,
}
```

An invalid request will return a 400, an unauthorized request 401.

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically create with the protocol endpoint from .NET code. 

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