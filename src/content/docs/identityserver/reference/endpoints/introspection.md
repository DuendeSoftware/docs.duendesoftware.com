---
title: "Introspection Endpoint"
description: "Documentation for the RFC 7662 compliant introspection endpoint used to validate reference tokens, JWTs, and refresh tokens."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Introspection
  order: 6
redirect_from:
  - /identityserver/v5/reference/endpoints/introspection/
  - /identityserver/v6/reference/endpoints/introspection/
  - /identityserver/v7/reference/endpoints/introspection/
---

The introspection endpoint is an implementation of [RFC 7662](https://tools.ietf.org/html/rfc7662).

It can be used to validate reference tokens, JWTs (if the consumer does not have support for appropriate JWT or
cryptographic libraries) and refresh tokens. Refresh tokens can only be introspected by the client that requested them.

The introspection endpoint requires authentication. Since the request to the introspection endpoint is typically done by an API, which is not an OAuth client, the [`ApiResource`](/identityserver/fundamentals/resources/api-resources.md) is used to configure credentials:

```csharp
new ApiResource("resource1")
{
    Scopes = { "scope1", "scope2" }, // Replace "scope1", "scope2" with the actual scopes required for your API

    ApiSecrets =
    {
        new Secret("secret".Sha256())
    }
}
```
Here the id used for authentication is the name of the `ApiResource`: "resource1" and the secret the configured secret. The introspection endpoint uses HTTP basic auth to communicate these credentials:

```text
POST /connect/introspect
Authorization: Basic xxxyyy

token=<token>
```

A successful response will return a status code of 200, the token claims, the token type, and a flag indicating the token is active:

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

## JWT Response from Introspection Endpoint :badge[v7.3]

IdentityServer supports [RFC 9701](https://www.rfc-editor.org/rfc/rfc9701.html) to return a JWT response from the
introspection endpoint.

To return a JWT response, set the `Accept` header in the HTTP request to `application/token-introspection+jwt`:

```text
POST /connect/introspect
Accept: application/token-introspection+jwt
Authorization: Basic xxxyyy

token=<token>
```

A successful response will return a status code of 200 and has a `Content-Type: application/token-introspection+jwt` header,
indicating that the response body contains a raw JWT instead. The base64 decoded JWT will have a `typ` claim in the header with 
the value `token-introspection+jwt`. The token's payload contains a `token_introspection` JSON object similar to the default response type:  

```json
{
  "alg": "RS256",
  "kid": "BE9D78519A8BBCB28A65FADEECF49CBC",
  "typ": "token-introspection+jwt"
}.{
  "iss": "https://localhost:5001",
  "iat": 1729599599,
  "aud": "api1",
  "token_introspection": {
    "iss": "https://localhost:5001",
    "nbf": 1729599599,
    "iat": 1729599599,
    "exp": 1729603199,
    "aud": [ "api1" ],
    "client_id": "client",
    "jti": "44FD2DE9E9F8E9F4DDD141CD7C244BE9",
    "active": true,
    "scope": "api1"
  }
}.[Signature]
```

## .NET Client Library

You can use the [Duende IdentityModel](/identitymodel/index.mdx) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using Duende.IdentityModel.Client;

var client = new HttpClient();

var response = await client.IntrospectTokenAsync(new TokenIntrospectionRequest
{
    Address = "https://demo.duendesoftware.com/connect/introspect",
    ClientId = "resource1",
    ClientSecret = "secret",

    Token = "<PLACEHOLDER_TOKEN>" // Replace with the actual token
});
```