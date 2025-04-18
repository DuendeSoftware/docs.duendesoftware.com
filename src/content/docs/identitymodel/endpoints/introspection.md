---
title: Token Introspection Endpoint
description: Learn how to use the OAuth 2.0 token introspection endpoint to validate and inspect access tokens using HttpClient extensions.
sidebar:
  order: 4
  label: Token Introspection
redirect_from:
  - /foss/identitymodel/endpoints/introspection/
---

The client library for [OAuth 2.0 token
introspection](https://tools.ietf.org/html/rfc7662) is provided as an
extension method for *HttpClient*.

The following code sends a reference token to an introspection endpoint:

```csharp
var client = new HttpClient();

var response = await client.IntrospectTokenAsync(new TokenIntrospectionRequest
{
    Address = "https://demo.duendesoftware.com/connect/introspect",
    ClientId = "api1",
    ClientSecret = "secret",

    Token = accessToken
});
```

The response is of type *TokenIntrospectionResponse* and has properties
for the standard response parameters. You also have access to the
raw response and to a parsed JSON document (via the *Raw* and
*Json* properties).

Before using the response, you should always check the *IsError*
property to make sure the request was successful:

```csharp
if (response.IsError) throw new Exception(response.Error);

var isActive = response.IsActive;
var claims = response.Claims;
```
