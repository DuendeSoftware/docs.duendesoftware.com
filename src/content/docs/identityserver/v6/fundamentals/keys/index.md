---
title: "Key Management"
date: 2020-09-10T08:22:12+02:00
order: 50
---

Duende IdentityServer issues several types of tokens that are cryptographically
signed, including identity tokens, JWT access tokens, and logout tokens. To
create those signatures, IdentityServer needs key material. That key material
can be configured automatically, by using the Automatic Key Management feature,
or manually, by loading the keys from a secured location with static
configuration.

IdentityServer supports [signing](https://tools.ietf.org/html/rfc7515) tokens
using the *RS*, *PS* and *ES* family of cryptographic signing algorithms. 

TODO LIST CHILDREN HERE

