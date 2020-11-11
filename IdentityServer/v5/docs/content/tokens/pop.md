---
title: "Proof-of-Possession Access Tokens"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

By default, OAuth access tokens are so called *bearer* tokens. This means they are not bound to a client and anybody who possess the token can use it (compare to cash). 

The associated risk is, that if an application leaks its tokens, an attacker can potentially use them to call APIs.

*Proof-of-Possession* (short PoP) tokens are bound to the client that requested the token. 
If that token leaks, it cannot be used by anyone else (compare to a credit card - well at least in an ideal world).

See TODO this <https://leastprivilege.com/2020/01/15/oauth-2-0-the-long-road-to-proof-of-possession-access-tokens/>`_ blog post for more history and motivation.

Duende IdentityServer supports PoP tokens via the [Mutual TLS feature]({{< ref "/advanced/mtls" >}}).