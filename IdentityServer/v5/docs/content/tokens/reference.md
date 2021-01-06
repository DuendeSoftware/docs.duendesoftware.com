---
title: "Reference Tokens"
date: 2020-09-10T08:22:12+02:00
weight: 100
---

Access tokens can come in two flavours - self-contained or reference.

A JWT token would be a self-contained access token - it's a protected data structure with claims and an expiration.
Once an API has learned about the key material, it can validate self-contained tokens without needing to communicate with the issuer.
This makes JWTs hard to revoke. They will stay valid until they expire.

When using reference tokens - your IdentityServer will store the contents of the token in the [persisted grant]({{< ref "/data/persisted_grants" >}}) store and will only issue a unique identifier for this token back to the client.
The API receiving this reference must then open a back-channel communication to IdentityServer to validate the token.

![](../images/reference_tokens.png)

You can set the token type of a client using the following client setting:

```cs
client.AccessTokenType = AccessTokenType.Reference;
```

Duende IdentityServer provides an implementation of the OAuth 2.0 introspection [specification](https://tools.ietf.org/html/rfc7662) which allows consumers to de-reference the tokens. See [here]({{< ref "/apis/aspnetcore/reference" >}}) for more information on validating reference tokens using ASP.NET Core.

## Enabling an API to consume reference tokens
The introspection endpoint requires authentication - since the client of an introspection endpoint is typically an API, you configure the secret on the *ApiResource*:

```cs
    var api = new ApiResource("api1")
    {
        ApiSecrets = { new Secret("secret".Sha256()) }
        Scopes = { "read", "write" }
    }
```