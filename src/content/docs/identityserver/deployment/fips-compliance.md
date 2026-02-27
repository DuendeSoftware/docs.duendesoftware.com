---
title: Federal Information Processing Standard (FIPS) compliance
description: Explains Duende IdentityServer Federal Information Processing Standard (FIPS) compliance.
date: 2025-10-09-10T08:20:20+02:00
sidebar:
  label: FIPS compliance
  order: 90
---

The Federal Information Processing Standard (FIPS) Publication 140-2 is a U.S. government standard that defines minimum
security requirements for cryptographic modules in information technology products.

IdentityServer does not provide built-in FIPS enforcement or a configuration option to enable FIPS compliance. There is no toggle switch or configuration profile that will automatically make your solution FIPS-compliant.

You are solely responsible for ensuring FIPS compliance in your application and infrastructure. This includes:

- Configuring your operating system for FIPS mode
- Selecting and using only FIPS-validated cryptographic algorithms
- Properly managing and storing cryptographic key material
- Validating that your complete solution meets FIPS requirements

Duende IdentityServer does not contain its own cryptographic algorithm implementations. Instead, it relies on cryptographic primitives provided by:

-   The underlying .NET runtime
-   The operating system

When IdentityServer signs tokens or protects cookies, it uses the cryptographic modules provided by these underlying platforms. However, IdentityServer does not restrict or enforce which algorithms or key sizes you use. This is your responsibility to configure correctly.

To build a FIPS-compliant solution with Duende IdentityServer, here is some guidance:

1. **Configure your operating system and .NET Core codebase** for FIPS mode following the guidance in the [Microsoft documentation on .NET Core FIPS compliance](https://learn.microsoft.com/en-us/dotnet/standard/security/fips-compliance)

2. **Select only FIPS-validated algorithms** in your IdentityServer configuration:
   - **Do not use:** `RS256`, `RS384`, or `RS512`
   - **Use instead:** `PS*` or `ES*` token signing algorithms

3. **Use secure key storage** for private key material, such as:
   - Azure Key Vault Hardware Security Module (HSM)
   - Other FIPS 140-2 validated hardware security modules

4. **Configure ASP.NET Core Data Protection** appropriately:
   - Use FIPS-compliant algorithms for generating data protection keys
   - Store data protection keys securely in a FIPS-validated module

Remember, it is your responsibility to validate that your complete solution meets FIPS compliance requirements for your specific use case and regulatory environment.