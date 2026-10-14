---
title: "Reference Tokens"
description: "Documentation about reference tokens in Duende IdentityServer, including how they are stored, accessed, and configured for both clients and APIs."
date: 2026-10-14T08:22:12+02:00
sidebar:
  label: Reference Tokens
  order: 100
redirect_from:
  - /identityserver/v5/tokens/reference/
  - /identityserver/v6/tokens/reference/
  - /identityserver/v7/tokens/reference/
---

When using reference tokens, Duende IdentityServer stores the contents of the token in
the [persisted grant](/identityserver/data/operational.md#grants) store and issues a unique identifier for this token
back to the client. See [what gets cleaned up at logout](/identityserver/ui/logout/cleanup-overview.md) for details on when these tokens are removed.

The consumer of the token must use the [introspection](/identityserver/reference/v8/endpoints/introspection.md) endpoint to
validate the token.

![reference tokens diagram](images/reference_tokens.svg)

You can set the client's token type using the following client setting:

```csharp
client.AccessTokenType = AccessTokenType.Reference;
```

## Enabling An API To Consume Reference Tokens

The introspection endpoint requires authentication - since the client of an introspection endpoint is typically an API,
you configure the secret on the `ApiResource`:

```csharp
    var api = new ApiResource("api1")
    {
        ApiSecrets = { new Secret("secret".Sha256()) }
        Scopes = { "read", "write" }
    }
```

## Store Keys And Handles

Reference tokens have a key, which is an internal identifier used in the data store, and a handle, which is an external
value that is given to the client and never stored. The handle is 32 bytes of cryptographically strong random data
encoded as a hex string with a suffix to indicate the encoding ("-1"). This is the value that clients use as the access
token. The handle, plus additional metadata indicating the type of grant, is hashed with the SHA-256 algorithm to
produce the key.

When IdentityServer is presented with a handle, it recomputes the key in order to retrieve the
persisted grant record for the reference token. The intention of this separation of key and handle is that read access
to the store will not reveal sensitive data. An attacker could read the keys in the data store, but those keys were
produced using a one-way hash, so the attacker would not be able to use the keys to recover the handles (the actual
access tokens). 

## Trade-Offs: Immediate Revocation vs. Network Dependency

Because the token's claims live in the persisted grant store rather than inside the token itself, an API cannot validate a reference token on its own. It must call IdentityServer's [introspection](/identityserver/reference/v8/endpoints/introspection.md) endpoint over the network to exchange the opaque handle for the token's claims and active status.

This gives you a clear trade-off compared to self-contained JWT access tokens:

- **Immediate revocation:** Removing the record from the persisted grant store invalidates the token right away. With JWTs, an already-issued token remains valid until it expires.
- **Network dependency:** The API needs a live connection to IdentityServer whenever it validates a token (or whenever its introspection cache entry expires). If IdentityServer is unreachable, or if the API runs in an offline, air-gapped, or intermittently connected environment, reference tokens cannot be validated. Use JWT access tokens in those scenarios instead.
