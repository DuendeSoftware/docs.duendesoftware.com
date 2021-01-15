---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

Duende IdentityServer is a token service engine based on OAuth 2.x and OpenID Connect.

## How to request tokens
OIDC and OAuth contain two endpoints that can issue tokens - the [authorize endpoint]({{< ref "/reference/endpoints/authorize" >}}) and the [token endpoint]({{< ref "/reference/endpoints/token" >}}).

While the *authorize* endpoint can be used for some special cases, you typically use the *token* endpoint for issuing tokens.

## Token Types
The following token types are supported.

### Identity Token
During user authentication, your IdentityServer collects data about the user, e.g. authentication method, authentication time, some protocol information and a unique identifier for the user that was authenticated, to communicate back to the client application “what happened at the token service”.

This data must be sent in a format that is both tamper proof and that allows the client to authenticate the issuer. In OIDC this format is JSON – and the way how you add the above security properties to a JSON object is by wrapping it in a JWT (along with JWS, JWA and JWK) – hence the name identity *token*.

The data includes token lifetime information (*exp*, *iat*, *nbf*), the authentication method (*amr*) and time (*auth_time*), the authentication source (*idp*), the session ID (*sid*) and information about the user (*sub* and *name*).

```json
{
  "iss": "https://localhost:5001",
  "nbf": 1609932802,
  "iat": 1609932802,
  "exp": 1609933102,
  "aud": "web_app",
  "amr": [
    "pwd"
  ],
  "nonce": "63745529591...I3ZTIyOTZmZTNj",
  "sid": "F6E6F2EDE86EB8731EF609A4FE40ED89",
  "auth_time": 1609932794,
  "idp": "local",
  "sub": "88421113",
  "name": "Bob",
}
```

This data is solely for the client application (the *aud* claim) that initiated the authentication request, and you never send it to an API to consume. The identity token also contains a nonce (a number used once) to make sure it is only consumed once at the client.

See the [OpenID Connect specification](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) for more information on identity tokens.

### Access Token
An access token is a data structure that allows a client to access a resource (e.g. an API - see the [protecting APIs]({{< ref "/apis" >}}) section for more details).

The data associated with an access token typically includes the client ID, the requested scopes, an expiration time, and user information in case of an interactive application. Access tokens come in two flavours: JSON Web Tokens (JWT) or reference tokens.

In the case of JWTs, all claims are embedded into the token itself, e.g.:

```json
{
  "iss": "https://localhost:5001",
  "nbf": 1609932801,
  "iat": 1609932801,
  "exp": 1609936401,
  "aud": "urn:resource1",
  "scope": "openid resource1.scope1 offline_access",
  "amr": [
    "pwd"
  ],
  "client_id": "web_app",
  "sub": "88421113",
  "auth_time": 1609932794,
  "idp": "local",
  "sid": "F6E6F2EDE86EB8731EF609A4FE40ED89",
  "jti": "2C56A356A306E64AFC7D2C6399E23A17"
}
```

A reference token does not contain any data, but is a pointer to the token data stored in the token service. Reference tokens allow for immediate revocation (by deleting the token data from your IdentityServer data store), whereas a JWT can only be invalidated via expiration.

{{% notice note %}}
You can control the access token format on a per-client basis using the [AccessTokenType]({{< ref "/reference/models/client#token" >}}) setting.
{{% /notice %}}

See the [OAuth specification](https://tools.ietf.org/html/rfc6749#section-1.4) for more information on access tokens.

### Refresh Token
Refresh tokens allow for token lifetime management of access tokens. Since an access token has a finite lifetime, the refresh token (usually with a significantly longer lifetime) can be used to request new access tokens. This mechanism serves three purposes

* it allows similar semantics as *sliding expiration* for cookies - just with access tokens 
* lifetime management does not need to involve the end-user and thus provides a good UX
* refresh tokens can be revoked and thus provide a way to revoke long-lived API access (while allowing the above two features)

See the [OAuth specification](https://tools.ietf.org/html/rfc6749#section-1.5) for more information on refresh tokens.