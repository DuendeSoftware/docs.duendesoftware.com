---
title: "Automatic Key Management"
date: 2022-11-21T11:24:12-05:00
order: 50
---

Duende IdentityServer can manage signing keys for you using the Automatic
Key Management feature. 

Automatic Key Management follows best practices for handling signing key
material, including

* automatic rotation of keys
* secure storage of keys at rest using data protection
* announcement of upcoming new keys
* maintenance of retired keys

Automatic Key Management is included in [IdentityServer](https://duendesoftware.com/products/identityserver) Business Edition or higher. 

### Configuration
Automatic Key Management is configured by the options in the *KeyManagement*
property on the [*IdentityServerOptions*](/identityserver/v6/reference/options#key-management). 

### Managed Key Lifecycle
Keys created by Automatic Key Management move through several phases. First, new
keys are announced, that is, they are added to the list of keys in discovery,
but not yet used for signing. After a configurable amount of *PropagationTime*,
keys are promoted to be signing credentials, and will be used by IdentityServer
to sign tokens. Eventually, enough time will pass that the key is older than the
configurable *RotationTime*, at which point the key is retired, but kept in
discovery for a configurable *RetentionDuration*. After the *RetentionDuration*
has passed, keys are removed from discovery, and optionally deleted.

The default is to rotate keys every 90 days, announce new keys with 14 days of
propagation time, retain old keys for a duration of 14 days, and to delete keys
when they are retired. All of these options are configurable in the
*KeyManagement* options. For example:

```cs
var builder = services.AddIdentityServer(options =>
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

### Key storage
Automatic Key Management stores keys through the abstraction of the
[ISigningKeyStore](/identityserver/v6/data/operational/keys). You can implement this
extensibility point to customize the storage of your keys (perhaps using a key
vault of some kind), or use one of the two implementations of the
*ISigningKeyStore* that we provide:
 - the default *FileSystemKeyStore*, which writes keys to the file system.
 - the [EntityFramework operational store](/identityserver/v6/data/ef#operational-store) which writes keys to a database using
   EntityFramework.

The default *FileSystemKeyStore* writes keys to the *KeyPath* directory
configured in your IdentityServer host, which defaults to the directory
*~/keys*. This directory should be excluded from source control. 

If you are deploying in a load balanced environment and wish to use the
*FileSystemKeyStore*, all instances of IdentityServer will need read/write
access to the *KeyPath*.

```cs
var builder = services.AddIdentityServer(options =>
{   
    // set path to store keys
    options.KeyManagement.KeyPath = "/home/shared/keys";
});
```

### Encryption of Keys at Rest
The keys created by Automatic Key Management are sensitive cryptographic secrets
that should be encrypted at rest. By default, keys managed by Automatic Key
Management are protected at rest using ASP.NET Core Data Protection. This is
controlled with the *DataProtectKeys* flag, which is on by default. We recommend
leaving this flag on unless you are using a custom *ISigningKeyStore* to store
your keys in a secure location that will ensure keys are encrypted at rest. For
example, if you implement the *ISigningKeyStore* to store your keys in Azure Key
Vault, you could safely disabled *DataProtectKeys*, relying on Azure Key Vault
to encrypt your signing keys at rest.

See the [deployment](/identityserver/v6/deployment) section for more information
about setting up data protection.

### Manage multiple keys
By default, Automatic Key Management will maintain a signing credential and
validation keys for a single cryptographic algorithm (*RS256*). You can specify
multiple keys, algorithms, and if those keys should additionally get wrapped in
an X.509 certificate. Automatic key management will create and rotate keys for
each signing algorithm you specify.

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
an *AllowedTokenSigningAlgorithm* property to override the default on a per
resource and client basis.

:::



    





