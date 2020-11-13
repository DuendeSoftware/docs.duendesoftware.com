---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

Duende IdentityServer is a token service engine based on OAuth 2.x and OpenID Connect.

## How to request tokens
OIDC and OAuth contain two endpoints that can return tokens - *authorize* and *token*. TODO link to endpoint reference

While the *authorize* endpoint can be used for some special cases, you typically use the *token* endpoint for issuing tokens.
See the [application types]({{< ref "/basics/application_types" >}}) chapter for more general information on protocol flows and TODO for concrete examples of token requests.

## Token Types
The following token types are supported.

### Identity Token
[OpenID Connect Identity Token](https://openid.net/specs/openid-connect-core-1_0.html#IDToken)

In OpenID Connect, the token service needs to send data about “what happened during authentication” back to the client applications, e.g. authentication method, authentication time, some protocol information and a unique identifier for the user that was authenticated (sub claim). This might also include additional identity information about the user, but this is optional.

This data must be sent in a format that is both tamper proof and that allows the client to authenticate the issuer. In OIDC this format is JSON – and the way how you add the above security properties to a JSON object is by wrapping it in a JWT (along with JWS, JWA and JWK) – hence the name identity *token*.

This data is solely for the client application that initiated the authentication request (the audience claim in the identity token points to the client id), and you never send it to an API to consume. The identity token also contains a nonce (a number used once) to make sure it is only consumed once at the client.

todo: sample id_token

### Access Token
[OAuth Access Token](https://tools.ietf.org/html/rfc6749#section-1.4)

An access token is a data structure that allows a client to access a resource (e.g. an API - see the [protecting APIs]({{< ref "/apis" >}}) section for more details).

The data associated with an access token typically includes the client ID, a used ID (if present), the allowed scopes and an expiration time. Access tokens come in two flavours: as a JSON Web Token (JWT) or as a reference token.

The main difference between the two is, that in the JWT format all data is embedded into the token itself, whereas reference tokens only contain a pointer to the token data stored in the token service. 

Reference tokens allow for immediate revocation, whereas a JWT can only be invalidated via expiration.

todo: sample access token in JWT format / reference token

### Refresh Token
[OAuth Refresh Token](https://tools.ietf.org/html/rfc6749#section-1.5)

Refresh tokens allow for token lifetime management of access tokens. Since an access token has a finite lifetime, the refresh token (usually with a significantly longer lifetime) can be used to request new access tokens. This mechanism server three purposes

* it allows similar semantics as *sliding expiration* for cookies - just with access tokens 
* lifetime management does not need to involve the end-user and thus provides a good UX
* refresh tokens can be revoked and thus provide a way to revoke long-lived API access (while allowing the above two features)