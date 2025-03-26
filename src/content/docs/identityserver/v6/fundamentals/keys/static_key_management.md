---
title: "Manual Key Management"
date: 2022-11-21T11:24:12-05:00
weight: 50
---

Instead of using [Automatic Key Management](automatic_key_management), IdentityServer's signing keys can be set
manually. Automatic Key Management is generally recommended, but if you want to
explicitly control your keys statically, or you have a license that does not
include the feature (e.g. the Starter Edition), you will need to manually manage
your keys. With static configuration you are responsible for secure storage,
loading and rotation of keys.

## Disabling Key Management
The automatic key management feature can be disabled by setting the *Enabled*
flag to *false* on the the *KeyManagement* property of
[*IdentityServerOptions*](/identityserver/v6/reference/options#key-management):

```cs
var builder = services.AddIdentityServer(options =>
{
    options.KeyManagement.Enabled = false;
});
```
## Key Creation
Without automatic key management, you are responsible for creating your own
cryptographic keys. Such keys can be created with many tools. Some options
include:

- Use the PowerShell commandlet
  [New-SelfSignedCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/new-selfsignedcertificate?view=windowsserver2022-ps) to self-sign your own certificate
- Create certificates using [Azure KeyVault](https://learn.microsoft.com/en-us/azure/key-vault/certificates/certificate-scenarios)
- Create certificates using your Public Key Infrastructure.

## Adding Keys
Signing keys are added with the [*AddSigningCredential*](/identityserver/v6/reference/di#signing-keys) configuration method:

```cs
var builder = services.AddIdentityServer();
var key = LoadKeyFromVault(); // (Your code here)
builder.AddSigningCredential(key, SecurityAlgorithms.RsaSha256);
```

You can call *AddSigningCredential* multiple times if you want to register more
than one signing key. When you register multiple signing algorithms, the first
one added will be the default used for signing tokens. Client and API resource
definitions both have an *AllowedTokenSigningAlgorithm* property to override the
default on a per resource and client basis.

Another configuration method called *AddValidationKey* can
be called to register public keys that should be accepted for token validation.

## Key Storage
With automatic key management disabled, secure storage of the key material is
left to you. This key material should be treated as highly sensitive. Key
material should be encrypted at rest, and access to it should be restricted.

## Manual Key Rotation {#rotation}
With automatic key management disabled, you will need to rotate your keys
manually. The rotation process must be done carefully for two reasons:

1. Client applications and APIs cache key material. If you begin using a new key
   too quickly, new tokens will be signed with a key that is not yet in their
   caches. This will cause clients to not be able to validate the signatures of
   new id tokens which will prevent users from logging in, and APIs will not be
   able to validate signatures of access tokens, which will prevent
   authorization of calls to those APIs.
2. Tokens signed with the old key material probably exist. If you tell APIs to
   stop using the old key too quickly, APIs will reject the signatures of old
   tokens, again causing authorization failures at your APIs. 

There are two solutions to these problems. Which one is right for you depends
on the level of control you have over client applications, the amount of
downtime that is acceptable, and the degree to which invalidating old tokens
matters to you.

### Solution 1: Invalidate all caches when keys are rotated
One solution to these problems is to invalidate the caches in all the client
applications and APIs immediately after the key is rotated. In ASP.NET, the
simplest way to do so is to restart the hosting process, which clears the cached
signing keys of the authentication middleware.

This is only appropriate if all of the following are true:
- You have control over the deployment of all of the client applications.
- You can tolerate a maintenance window in which your services are all
  restarted.
- You don't mind that users will need to log in again after the key is rotated.

### Solution 2: Phased Rotation
A more robust solution is to gradually transition from the old to the new key.
This requires three phases.

#### Phase 1: Announce the new key

First, announce a new key that will be used for signing in the future. During
this phase, continue to sign tokens with the old key. The idea is to allow for
all the applications and APIs to update their caches without any interruption in
service. Configure IdentityServer for phase 1 by registering the new
key as a validation key.

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var oldKey = LoadOldKeyFromVault();
var newKey = LoadNewKeyFromVault();
builder.AddSigningCredential(oldKey, SecurityAlgorithms.RsaSha256);
builder.AddValidationKey(newKey, SecurityAlgorithms.RsaSha256)
```

Once IdentityServer is updated with the new key as a validation key, wait to
proceed to phase 2 until all the applications and services have updated their
signing key caches. The default cache duration in .NET is 24 hours, but this is
customizable. You may also need to support clients or APIs built with other
platforms or that were customized to use a different value. Ultimately you have
to decide how long to wait to proceed to phase 2 in order to ensure that all
clients and APIs have updated their caches.


#### Phase 2: Start signing with the new key

Next, start signing tokens with the new key, but continue to publish the public
key of the old key so that tokens that were signed with that key can continue to
be validated. The IdentityServer configuration change needed is simply to swap
the signing credential and validation key. 

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var oldKey = LoadOldKeyFromVault();
var newKey = LoadNewKeyFromVault();
builder.AddSigningCredential(newKey, SecurityAlgorithms.RsaSha256);
builder.AddValidationKey(oldKey, SecurityAlgorithms.RsaSha256)
```

Again, you need to wait to proceed to phase 3. The delay here is typically
shorter, because the reason for the delay is to ensure that  tokens signed with
the old key remain valid until they expire. IdentityServer's token lifetime
defaults to 1 hour, though it is configurable.

#### Phase 3: Remove the old key

Once enough time has passed that there are no unexpired tokens signed with the
old key, it is safe to completely remove the old key. 

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var newKey = LoadNewKeyFromVault();
builder.AddSigningCredential(newKey, SecurityAlgorithms.RsaSha256);
```

