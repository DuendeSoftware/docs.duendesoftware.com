---
title: "Key Management"
date: 2020-09-10T08:22:12+02:00
weight: 35
---

You need key material to sign issued tokens, e.g. identity tokens, JWT access tokens, logout tokens etc.

Duende IdentityServer supports signing tokens using the RS*, PS* and ES* family of cryptographic signing algorithms. You can configure the keys either statically by loading them from a secured location manually, or using the automatic key management feature (recommended).

## Automatic key management
The automatic key management feature follows best practices for handling signing key material:

* automatic key rotation
* secure storage of keys at rest
* announce upcoming new keys
* maintain a history of retired keys for a certain amount of time

{{% notice note %}}
Automatic key management is on by default, and stores an RSA key for RS256 usage in the *~/keys* folder on the filesystem.
The key is automatically rotated every 90 days, announced 14 days in advance, and retained for 14 days after it expires.
{{% /notice %}}

You can configure the key management parameters on the [*IdentityServerOptions*]({{< ref "/reference/options#key-management" >}}), e.g.:

```cs
var builder = services.AddIdentityServer(options =>
{
    // set path where to store keys
    options.KeyManagement.KeyPath = "/home/shared/keys";
    
    // new key every 30 days
    options.KeyManagement.RotationInterval = TimeSpan.FromDays(30);
    
    // announce new key 2 days in advance in discovery
    options.KeyManagement.PropagationTime = TimeSpan.FromDays(2);
    
    // keep old key for 7 days in discovery for validation of tokens
    options.KeyManagement.RetentionDuration = TimeSpan.FromDays(7);
});
```

### Manage multiple keys
If no specific signing algorithms are configured, key management will auto-maintain an RSA key for the RS256 signing algorithm. You can specify multiple keys, algorithm, and if those keys should additionally get wrapped into an X.509 certificate (sometime a requirement for SAML-based clients).

```cs
options.KeyManagement.SigningAlgorithms = new[]
{
    // RS256 for older clients (with additional X.509 wrapping)
    new SigningAlgorithmOptions(SecurityAlgorithms.RsaSha256) {  UseX509Certificate = true },
    
    // PS256
    new SigningAlgorithmOptions(SecurityAlgorithms.RsaSsaPssSha256),
    
    // ES256
    new SigningAlgorithmOptions(SecurityAlgorithms.EcdsaSha256)
};
```

### Key storage and protection
By default the keys will be protected at rest with the ASP.NET Core Data Protection mechanism. Key storage itself is extensible - see here for more information TODO.

## Static key configuration
You can also statically configure your key material. A common scenario would be keys that you load from a key vault or other secured locations at startup. With static configuration you are responsible of secure storage, loading and rotation.

For this purpose you disable the automatic key management, and load the keys manually with the [*AddSigningCredential*]({{< ref "/reference/di#signing-keys" >}}) DI extension method:

```cs
var builder = services.AddIdentityServer(options =>
{  
    options.KeyManagement.Enabled = false;
});

var key = LoadKeyFromVault();
builder.AddSigningCredential(key, SecurityAlgorithms.RsaSha256);
```

You can all *AddSigningCredential* multiple times if you want to register more than one signing key. Another extension method called *AddValidationKey* can be called to register public keys, that should be accepted for token validation.
