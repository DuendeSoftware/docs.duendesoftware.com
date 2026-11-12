---
title: FIPS 140-3 Compliance in IdentityServer
description: Explains how Duende IdentityServer relates to FIPS 140-3, and what you need to configure to run it in a FIPS-compliant environment.
date: 2026-11-12T08:00:00+01:00
sidebar:
  label: FIPS compliance
  order: 90
---

The Federal Information Processing Standard (FIPS) Publication 140-3 is the U.S. and Canadian government standard for
validating cryptographic modules. It replaces FIPS 140-2: on September 21, 2026, all remaining FIPS 140-2 validations
moved to the [CMVP](https://csrc.nist.gov/projects/cryptographic-module-validation-program) historical list. If you're
working towards FedRAMP, CMMC, or a similar program, expect your assessor to ask for FIPS 140-3 validated modules.

## Is IdentityServer FIPS 140-3 validated?

IdentityServer doesn't implement any cryptographic algorithms itself, and it isn't a validated cryptographic module. When
it signs tokens, validates signatures, or protects cookies, it calls into .NET, and .NET in turn passes those calls
through to the cryptographic module provided by the operating system:

- **Windows**: Cryptography API: Next Generation (CNG)
- **Linux**: OpenSSL
- **macOS**: Apple's platform cryptography libraries

That means your FIPS posture is determined by the operating system module your application runs on, and by how you
configure it. Neither IdentityServer nor .NET enforces FIPS-approved algorithms or key sizes, and IdentityServer has no
"FIPS mode" setting. You're responsible for:

- Running on an operating system whose cryptographic module has a FIPS 140-3 validation, with FIPS mode enabled
- Configuring only FIPS-approved algorithms and key sizes
- Storing and managing key material appropriately
- Validating that your complete solution meets the requirements of your compliance program

## Building a FIPS-compliant deployment

### 1. Run on a FIPS 140-3 validated platform

Check that the specific operating system version you deploy to has an active FIPS 140-3 certificate on the
[CMVP validated modules list](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search),
and enable FIPS mode as described by your OS vendor. For Linux containers, the FIPS-validated module is the OpenSSL build
inside the image, so pick a base image whose vendor provides a FIPS 140-3 validated OpenSSL provider, and enable FIPS
mode for it.

Microsoft's [.NET FIPS compliance documentation](https://learn.microsoft.com/en-us/dotnet/standard/security/fips-compliance)
describes how .NET relies on the platform module.

:::note
Depending on the platform and cryptographic provider, non-approved operations may throw at runtime. Enabling FIPS
mode does not guarantee that non-approved algorithms will be rejected, so review algorithm use explicitly.
Test your full login, token, and logout flows on a FIPS-enabled machine before going to production.
:::

### 2. Use FIPS-approved signing algorithms

All the asymmetric signing algorithms IdentityServer supports are approved under FIPS 186-5, as long as you use
appropriate key sizes:

- `RS256`, `RS384`, `RS512` (RSASSA-PKCS1-v1_5) and `PS256`, `PS384`, `PS512` (RSASSA-PSS) with RSA keys of at least
  2048 bits
- `ES256`, `ES384`, `ES512` with the NIST P-256, P-384, and P-521 curves

Check whether your compliance program sets a stricter baseline, such as a minimum RSA key size of 3072 bits.

The [automatic key management](/identityserver/fundamentals/key-management.md) feature generates 2048-bit RSA keys by
default. To raise that, set `KeyManagement.RsaKeySize`, which applies to all `RS*` and `PS*` algorithms:

```csharp
builder.Services.AddIdentityServer(options =>
{
    options.KeyManagement.RsaKeySize = 3072;
});
```

You can also configure which signing algorithms it uses with `KeyManagement.SigningAlgorithms`, or manage keys yourself.

### 3. Protect your signing keys

Keep private signing keys in a module that is FIPS 140-3 validated, such as a hardware security module (HSM) or a
cloud key management service backed by validated HSMs. Check the CMVP list for the exact module and its validation
level.

### 4. Configure ASP.NET Core Data Protection

IdentityServer uses ASP.NET Core Data Protection for cookies, automatic key management, and other protected data. The
default algorithms (AES-256-CBC for encryption and HMAC-SHA256 for validation) are FIPS-approved, and they run on the
operating system's cryptographic module. Avoid swapping in non-approved algorithms, and protect the key ring at rest,
for example with a key encryption key held in a FIPS 140-3 validated module.

## Your responsibility

FIPS compliance applies to your whole deployment, not to a single library. Use the guidance above as a starting point,
and confirm with your assessor which modules, algorithms, and key sizes your compliance program requires.
