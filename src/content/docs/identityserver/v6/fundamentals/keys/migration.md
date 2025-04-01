---
title: "Migrating from Static Keys to Automatic Key Management"
date: 2022-11-21T11:24:12-05:00
order: 50
---

To migrate from static to automatic key management, you can set keys manually
and enable automatic key management at the same time. This allows the automatic
key management feature to begin creating keys and announce them in discovery,
while you continue to use the old statically configured key. Eventually you can
transition from the statically configured key to the automatically managed keys.

A signing key registered with *AddSigningCredential* will take precedence over
any keys created by the automatic key management feature. IdentityServer will
sign tokens with the credential specified in *AddSigningCredential*, but also
automatically create and manage validation keys. 

Validation keys registered manually with *AddValidationKey* are added to the
collection of validation keys along with the keys produced by automatic key
management. When automatic key management is enabled and there are keys
statically specified with *AddValidationkey*, the set of validation keys will
include:
- new keys created by automatic key management that are not yet used for signing
- old keys created by automatic key management that are retired 
- the keys added explicitly with calls to *AddValidationKey*.

The migration path from manual to automatic keys is a three phase process,
similar to the phased approach to [manual key rotation](static_key_management#rotation). The
difference here is that you are phasing out the old key and allowing the
automatically generated keys to phase in.

## Phase 1: Announce new (automatic) key

First, enable automatic key management while continuing to register your old key
as the signing credential. In this phase, the new automatically managed key will be
announced so that as client apps and APIs update their caches, they get the new
key. IdentityServer will continue to sign keys with your old static key.

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = true;
});

var oldKey = LoadOldKeyFromVault();
builder.AddSigningCredential(oldKey, SecurityAlgorithms.RsaSha256);
```

Wait until all APIs and applications have updated their signing key caches, and
then proceed to phase 2.

## Phase 2: Start signing with the new (automatic) key

Next, switch to using the new automatically managed keys for signing, but still
keep the old key for validation purposes.

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = true;
});

var oldKey = LoadOldKeyFromVault();
builder.AddValidationKey(oldKey, SecurityAlgorithms.RsaSha256);
```

Keep the old key as a validation key until all tokens signed with that key are
expired, and then proceed to phase 3.

## Phase 3: Drop the old key
Now the static key configuration can be removed entirely.

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = true;
});
```
