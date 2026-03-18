---
title: Client Assertions
description: How to use client assertions (private_key_jwt / client_secret_jwt) for client authentication in protocol requests.
sidebar:
  order: 8
  label: Client Assertions
---

Client assertions are an alternative to client secrets for authenticating
confidential clients at token endpoints. Instead of sending a shared secret,
the client creates a signed JWT (or SAML assertion) and includes it in the
request. This is defined in
[RFC 7523 — JSON Web Token (JWT) Profile for OAuth 2.0 Client Authentication](https://datatracker.ietf.org/doc/html/rfc7523)
and is commonly known as the `private_key_jwt` or `client_secret_jwt`
authentication methods defined in
[OpenID Connect Core §9](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication).

All protocol request types that derive from `ProtocolRequest` expose two
properties for setting client assertions: `ClientAssertion` and
`ClientAssertionFactory`.

## ClientAssertion

The `ClientAssertion` property lets you attach a pre-built assertion to any
protocol request. Set its `Type` and `Value` and they will be included as the
`client_assertion_type` and `client_assertion` parameters:

```csharp
var response = await client.RequestClientCredentialsTokenAsync(
    new ClientCredentialsTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client",

        ClientAssertion =
        {
            Type = OidcConstants.ClientAssertionTypes.JwtBearer,
            Value = mySignedJwt
        },

        ClientCredentialStyle = ClientCredentialStyle.PostBody
    });
```

:::note
When using a client assertion, set `ClientCredentialStyle` to
`ClientCredentialStyle.PostBody`. Client assertions are not compatible with
`AuthorizationHeader` style and an `InvalidOperationException` will be thrown if
both are combined with a `ClientId`.
:::

## ClientAssertionFactory

*Added in IdentityModel 7.2.0*

The `ClientAssertionFactory` property accepts a `Func<Task<ClientAssertion>>`
— a factory function that creates a **fresh** `ClientAssertion` on demand. This
was introduced to support scenarios where a protocol request may need to be
**retried**, and each attempt requires a new assertion with unique `jti` and
`iat` claims.

The primary motivating scenario is **DPoP** (Demonstrating Proof of Possession).
When a DPoP token request receives a `use_dpop_nonce` error, the HTTP handler
retries the request with an updated DPoP proof. If the client assertion were
static, the server could reject the retry because it has already seen that
assertion's `jti`. The factory solves this by generating a new assertion for
each attempt.

```csharp
var response = await client.RequestClientCredentialsTokenAsync(
    new ClientCredentialsTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client",

        ClientAssertionFactory = () => Task.FromResult(new ClientAssertion
        {
            Type = OidcConstants.ClientAssertionTypes.JwtBearer,
            Value = CreateSignedJwt() // generates a fresh JWT each time
        }),

        ClientCredentialStyle = ClientCredentialStyle.PostBody
    });
```

When `ClientAssertionFactory` is set, the factory is stored on the
`HttpRequestMessage.Options` so that DPoP retry handlers (and other delegating
handlers in the pipeline) can invoke it to obtain a new assertion on each
attempt.

:::note
If both `ClientAssertion` and `ClientAssertionFactory` are set, the factory
takes precedence during request preparation.
:::

### Usage with Duende.IdentityModel.OidcClient

Both the `ClientAssertion` and `ClientAssertionFactory` properties exist on
`ProtocolRequest` to support
[Duende.IdentityModel.OidcClient](/identitymodel-oidcclient/). The OidcClient
library builds on IdentityModel's protocol requests internally, and when
configured with client assertion-based authentication, it sets these properties
on the underlying requests it creates.

When `ClientAssertionFactory` is set, it is used during both:

- **Pushed Authorization Requests (PAR)** — the factory is invoked to produce a
  fresh assertion for the PAR endpoint request.
- **Token requests** — the factory is invoked again to produce a fresh assertion
  for the token endpoint request.

This ensures each request carries its own unique assertion, which is essential
when the authorization server enforces `jti` uniqueness across requests.
