---
title: "Proof-of-Possession Access Tokens"
date: 2020-09-10T08:22:12+02:00
order: 100
chapter: true
---

By default, OAuth access tokens are so called *bearer* tokens. This means they are not bound to a client and anybody who possesses the token can use it. The security concern here is that a leaked token could be used by a (malicious) third party to impersonate the client and/or user.

On the other hand, *Proof-of-Possession* (PoP) tokens are bound to the client that requested the token. This is also often called sender constraining. This is done by using cryptography to prove that the sender of the token knows an additional secret only known to the client. 

This proof is called the *confirmation method* and is expressed via the standard [*cnf* claim](https://tools.ietf.org/html/rfc7800),e.g.:

```json
{
  "iss": "https://localhost:5001",
  "iat": 1609932801,
  "exp": 1609936401,
  "aud": "urn:resource1",

  "client_id": "web_app",
  "sub": "88421113",
  
  "cnf": "confirmation_method"
}
```

:::note
When using reference tokens, the cnf claim will be returned from the introspection endpoint.
:::

## Proof-of-Possession Styles

IdentityServer supports two styles of proof of possession tokens:

* [Mutual TLS](../tokens/pop/mtls)
* [DPoP](../tokens/pop/dpop)
