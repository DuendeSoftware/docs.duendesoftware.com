---
title: "Key Management"
description: "Learn how to manage cryptographic keys for token signing in IdentityServer using automatic or static key management"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 50
redirect_from:
  - /identityserver/v5/fundamentals/keys/
  - /identityserver/v6/fundamentals/keys/
  - /identityserver/v6/fundamentals/keys/migration/
  - /identityserver/v6/fundamentals/keys/automatic_key_management/
  - /identityserver/v6/fundamentals/keys/static_key_management/
  - /identityserver/v7/fundamentals/keys/
  - /identityserver/v7/fundamentals/keys/migration/
  - /identityserver/v7/fundamentals/keys/automatic_key_management/
  - /identityserver/v7/fundamentals/keys/static_key_management/
---

Duende IdentityServer issues several types of tokens that are cryptographically
signed, including identity tokens, JWT access tokens, and logout tokens. To
create those signatures, IdentityServer needs key material. That key material
can be configured automatically, by using the Automatic Key Management feature,
or manually, by loading the keys from a secured location with static
configuration.

IdentityServer supports [signing](https://tools.ietf.org/html/rfc7515) tokens
using the `RS`, `PS` and `ES` family of cryptographic signing algorithms.

## Automatic Key Management

Duende IdentityServer can manage signing keys for you using the Automatic
Key Management feature.

Automatic Key Management follows best practices for handling signing key
material, including

* automatic rotation of keys
* secure storage of keys at rest using data protection
* announcement of upcoming new keys
* maintenance of retired keys

Automatic Key Management is included in [IdentityServer](https://duendesoftware.com/products/identityserver) Business
Edition or higher.

### Configuration

Automatic Key Management is configured by the options in the `KeyManagement`
property on the [`IdentityServerOptions`](/identityserver/reference/options.md#key-management).

### Managed Key Lifecycle

Keys created by Automatic Key Management move through several phases. First, new
keys are announced, that is, they are added to the list of keys in discovery,
but not yet used for signing. After a configurable amount of `PropagationTime`,
keys are promoted to be signing credentials, and will be used by IdentityServer
to sign tokens. Eventually, enough time will pass that the key is older than the
configurable `RotationTime`, at which point the key is retired, but kept in
discovery for a configurable `RetentionDuration`. After the `RetentionDuration`
has passed, keys are removed from discovery, and optionally deleted.

The default is to rotate keys every 90 days, announce new keys with 14 days of
propagation time, retain old keys for a duration of 14 days, and to delete keys
when they are retired. All of these options are configurable in the
`KeyManagement` options. For example:

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{   
    // new key every 30 days
    options.KeyManagement.RotationInterval = TimeSpan.FromDays(30);
    
    // announce new key 2 days in advance in discovery
    options.KeyManagement.PropagationTime = TimeSpan.FromDays(2);
    
    // keep old key for 7 days in discovery for validation of tokens
    options.KeyManagement.RetentionDuration = TimeSpan.FromDays(7);

    // don't delete keys after their retention period is over
    options.KeyManagement.DeleteRetiredKeys = false;
});
```

### Key Storage

Automatic Key Management stores keys through the abstraction of the
[ISigningKeyStore](/identityserver/data/operational.md#keys). You can implement this
extensibility point to customize the storage of your keys (perhaps using a key
vault of some kind), or use one of the two implementations of the
`ISigningKeyStore` that we provide:

- the default `FileSystemKeyStore`, which writes keys to the file system.
- the [EntityFramework operational store](/identityserver/data/ef.md#operational-store) which writes keys to a database
  using
  EntityFramework.

The default `FileSystemKeyStore` writes keys to the `KeyPath` directory
configured in your IdentityServer host, which defaults to the directory
`~/keys`. This directory should be excluded from source control.

If you are deploying in a load balanced environment and wish to use the
`FileSystemKeyStore`, all instances of IdentityServer will need read/write
access to the `KeyPath`.

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{   
    // set path to store keys
    options.KeyManagement.KeyPath = "/home/shared/keys";
});
```

### Encryption Of Keys at Rest

The keys created by Automatic Key Management are sensitive cryptographic secrets
that should be encrypted at rest. By default, keys managed by Automatic Key
Management are protected at rest using ASP.NET Core Data Protection. This is
controlled with the `DataProtectKeys` flag, which is on by default. We recommend
leaving this flag on unless you are using a custom `ISigningKeyStore` to store
your keys in a secure location that will ensure keys are encrypted at rest. For
example, if you implement the `ISigningKeyStore` to store your keys in Azure Key
Vault, you could safely disabled `DataProtectKeys`, relying on Azure Key Vault
to encrypt your signing keys at rest.

See the [deployment](/identityserver/deployment/index.md) section for more information
about setting up data protection.

### Manage Multiple Keys

By default, Automatic Key Management will maintain a signing credential and
validation keys for a single cryptographic algorithm (`RS256`). You can specify
multiple keys, algorithms, and if those keys should additionally get wrapped in
an X.509 certificate. Automatic key management will create and rotate keys for
each signing algorithm you specify.

:::note
*X.509 certificates* have an expiration date, but IdentityServer does
not use this data to validate the certificate and throw an exception. If a certificate has expired then you
must decide whether to continue using it or replace it with a new certificate.
:::

```cs
options.KeyManagement.SigningAlgorithms = new[]
{
    // RS256 for older clients (with additional X.509 wrapping)
    new SigningAlgorithmOptions(SecurityAlgorithms.RsaSha256) { UseX509Certificate = true },
    
    // PS256
    new SigningAlgorithmOptions(SecurityAlgorithms.RsaSsaPssSha256),
    
    // ES256
    new SigningAlgorithmOptions(SecurityAlgorithms.EcdsaSha256)
};
```

:::note
When you register multiple signing algorithms, the first in the list will be the
default used for signing tokens. Client and API resource definitions both have
an `AllowedTokenSigningAlgorithm` property to override the default on a per
resource and client basis.
:::

## Static Key Management

Instead of using [Automatic Key Management](#automatic-key-management), IdentityServer's signing keys can be set
manually. Automatic Key Management is generally recommended, but if you want to
explicitly control your keys statically, or you have a license that does not
include the feature (e.g. the Starter Edition), you will need to manually manage
your keys. With static configuration you are responsible for secure storage,
loading and rotation of keys.

## Disabling Key Management

The automatic key management feature can be disabled by setting the `Enabled`
flag to `false` on the `KeyManagement` property of
[`IdentityServerOptions`](/identityserver/reference/options.md#key-management):

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{
    options.KeyManagement.Enabled = false;
});
```

## Key Creation

Without automatic key management, you are responsible for creating your own
cryptographic keys. Such keys can be created with many tools. Some options
include:

- Use the PowerShell commandlet
  [New-SelfSignedCertificate](https://learn.microsoft.com/en-us/powershell/module/pki/new-selfsignedcertificate?view=windowsserver2022-ps)
  to self-sign your own certificate
- Create certificates
  using [Azure KeyVault](https://learn.microsoft.com/en-us/azure/key-vault/certificates/certificate-scenarios)
- Create certificates using your Public Key Infrastructure.
- Create certificates using C# (see below)

```csharp
var name = "MySelfSignedCertificate";

// Generate a new key pair
using var rsa = RSA.Create(keySizeInBits: 2048);

// Create a certificate request
var request = new CertificateRequest(
    subjectName: $"CN={name}",
    rsa,
    HashAlgorithmName.SHA256,
    RSASignaturePadding.Pkcs1
);

// Self-sign the certificate
var certificate = request.CreateSelfSigned(
    DateTimeOffset.Now,
    DateTimeOffset.Now.AddYears(1)
);

// Export the certificate to a PFX file
var pfxBytes = certificate.Export(
    // TODO: pick a format
    X509ContentType.Pfx,
    // TODO: change the password
    password: "password"
);
File.WriteAllBytes($"{name}.pfx", pfxBytes);
Console.Write(certificate);
Console.WriteLine("Self-signed certificate created successfully.");
Console.WriteLine($"Certificate saved to {name}.pfx");
```

## Adding Keys

Signing keys are added with the [`AddSigningCredential`](/identityserver/reference/di.md#signing-keys) configuration
method:

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer();
var key = LoadKeyFromVault(); // (Your code here)
idsvrBuilder.AddSigningCredential(key, SecurityAlgorithms.RsaSha256);
```

You can call `AddSigningCredential` multiple times if you want to register more
than one signing key. When you register multiple signing algorithms, the first
one added will be the default used for signing tokens. Client and API resource
definitions both have an `AllowedTokenSigningAlgorithm` property to override the
default on a per resource and client basis.

Another configuration method called `AddValidationKey` can
be called to register public keys that should be accepted for token validation.

## Key Storage

With automatic key management disabled, secure storage of the key material is
left to you. This key material should be treated as highly sensitive. Key
material should be encrypted at rest, and access to it should be restricted.

Loading a key from disk into memory can be done using the `X509CertificateLoader`
found in .NET assuming your hosting environment has proper security practices in
place.

```csharp
// load certificate from disk
var bytes = File.ReadAllBytes("mycertificate.pfx");
var importedCertificate = X509CertificateLoader.LoadPkcs12(bytes, "password");
```

You may also choose to load a certificate from the current environment's
key store using the `X509Store` class.

```csharp
// Pick the appropriate StoreName and StoreLocation
var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
store.Open(OpenFlags.ReadWrite);

var certificate = store
    .Certificates
    .First(c => c.Thumbprint == "<thumbprint>");
```

If you're generating self-signed certificates using C#, you can use the `X509Store`
to store the certificate into the current hosting environment as well.

```csharp
// Pick the appropriate StoreName and StoreLocation
var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
store.Open(OpenFlags.ReadWrite);

// push certificate into store
var certificate = CreateCertificate();
store.Add(certificate);
```

## Manual Key Rotation

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

### Solution 1: Invalidate All Caches When Keys Are Rotated

One solution to these problems is to invalidate the caches in all the client
applications and APIs immediately after the key is rotated. In ASP.NET, the
simplest way to do so is to restart the hosting process, which clears the cached
signing keys of the authentication middleware.

This is only appropriate if all the following are true:

- You have control over the deployment of all the client applications.
- You can tolerate a maintenance window in which your services are all
  restarted.
- You don't mind that users will need to log in again after the key is rotated.

### Solution 2: Phased Rotation

A more robust solution is to gradually transition from the old to the new key.
This requires three phases.

#### Phase 1: Announce The New Key

First, announce a new key that will be used for signing in the future. During
this phase, continue to sign tokens with the old key. The idea is to allow for
all the applications and APIs to update their caches without any interruption in
service. Configure IdentityServer for phase 1 by registering the new
key as a validation key.

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var oldKey = LoadOldKeyFromVault();
var newKey = LoadNewKeyFromVault();
idsvrBuilder.AddSigningCredential(oldKey, SecurityAlgorithms.RsaSha256);
idsvrBuilder.AddValidationKey(newKey, SecurityAlgorithms.RsaSha256)
```

Once IdentityServer is updated with the new key as a validation key, wait to
proceed to phase 2 until all the applications and services have updated their
signing key caches. The default cache duration in .NET is 24 hours, but this is
customizable. You may also need to support clients or APIs built with other
platforms or that were customized to use a different value. Ultimately you have
to decide how long to wait to proceed to phase 2 in order to ensure that all
clients and APIs have updated their caches.

#### Phase 2: Start Signing With The New Key

Next, start signing tokens with the new key, but continue to publish the public
key of the old key so that tokens that were signed with that key can continue to
be validated. The IdentityServer configuration change needed is to swap
the signing credential and validation key.

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var oldKey = LoadOldKeyFromVault();
var newKey = LoadNewKeyFromVault();
idsvrBuilder.AddSigningCredential(newKey, SecurityAlgorithms.RsaSha256);
idsvrBuilder.AddValidationKey(oldKey, SecurityAlgorithms.RsaSha256)
```

Again, you need to wait to proceed to phase 3. The delay here is typically
shorter, because the reason for the delay is to ensure that tokens signed with
the old key remain valid until they expire. IdentityServer's token lifetime
defaults to 1 hour, though it is configurable.

#### Phase 3: Remove The Old Key

Once enough time has passed that there are no unexpired tokens signed with the
old key, it is safe to completely remove the old key.

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var newKey = LoadNewKeyFromVault();
idsvrBuilder.AddSigningCredential(newKey, SecurityAlgorithms.RsaSha256);
```

## Migrating From Static Keys To Automatic Key Management

To migrate from static to automatic key management, you can set keys manually
and enable automatic key management at the same time. This allows the automatic
key management feature to begin creating keys and announce them in discovery,
while you continue to use the old statically configured key. Eventually you can
transition from the statically configured key to the automatically managed keys.

A signing key registered with `AddSigningCredential` will take precedence over
any keys created by the automatic key management feature. IdentityServer will
sign tokens with the credential specified in `AddSigningCredential`, but also
automatically create and manage validation keys.

Validation keys registered manually with `AddValidationKey` are added to the
collection of validation keys along with the keys produced by automatic key
management. When automatic key management is enabled and there are keys
statically specified with `AddValidationkey`, the set of validation keys will
include:

- new keys created by automatic key management that are not yet used for signing
- old keys created by automatic key management that are retired
- the keys added explicitly with calls to `AddValidationKey`.

The migration path from manual to automatic keys is a three-phase process,
similar to the phased approach to [manual key rotation](#manual-key-rotation). The
difference here is that you are phasing out the old key and allowing the
automatically generated keys to phase in.

### Phase 1: Announce New (Automatic) Key

First, enable automatic key management while continuing to register your old key
as the signing credential. In this phase, the new automatically managed key will be
announced so that as client apps and APIs update their caches, they get the new
key. IdentityServer will continue to sign keys with your old static key.

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = true;
});

var oldKey = LoadOldKeyFromVault();
idsvrBuilder.AddSigningCredential(oldKey, SecurityAlgorithms.RsaSha256);
```

Wait until all APIs and applications have updated their signing key caches, and
then proceed to phase 2.

### Phase 2: Start Signing With The New (Automatic) Key

Next, switch to using the new automatically managed keys for signing, but still
keep the old key for validation purposes.

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = true;
});

var oldKey = LoadOldKeyFromVault();
idsvrBuilder.AddValidationKey(oldKey, SecurityAlgorithms.RsaSha256);
```

Keep the old key as a validation key until all tokens signed with that key are
expired, and then proceed to phase 3.

### Phase 3: Drop the old key

Now the static key configuration can be removed entirely.

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = true;
});
```
