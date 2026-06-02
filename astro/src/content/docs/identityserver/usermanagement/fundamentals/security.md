---
title: Security Considerations
description: Security best practices, rate limiting values, authentication throttling, passkey properties, and data protection guidance for Duende User Management.
date: 2026-05-25
sidebar:
  label: Security Considerations
  order: 5
---

This page covers security best practices and design decisions in User Management's authentication system, including verified rate limiting values, authentication throttling configuration, and passkey security properties.

## Data Protection

### Encryption at Rest

User Management encrypts sensitive user data using [ASP.NET Core Data Protection](/general/data-protection.md):

* **One-Time Password (OTP) codes**: Encrypted before storage, decrypted only during verification
* **Time-Based One-Time Password (TOTP) secrets**: Stored encrypted, decrypted only for code generation and verification
* **Recovery codes**: Hashed (not encrypted) using PBKDF2. They cannot be retrieved, only verified.

### Data Protection Configuration

Ensure [ASP.NET Core Data Protection](/general/data-protection.md) is configured for key persistence:

```csharp title="Program.cs"
builder.Services.AddDataProtection()
    .SetApplicationName("MyApp")
    .PersistKeysToFileSystem(new DirectoryInfo("/keys"));
```

:::caution
Without persistent data protection keys, encrypted data such as OTP tokens and TOTP secrets becomes unreadable after an application restart. Always configure key persistence in production.
:::

## Password Security

### Hashing

User Management uses **PBKDF2** (RFC 2898) with the following parameters, verified from source:

* **Pseudorandom function**: HMAC-SHA-512
* **Iteration count**: 210,000 (following the [OWASP recommendation](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) for PBKDF2-HMAC-SHA512)
* **Salt**: Unique per password, generated using a cryptographically secure random number generator

### Password Validation Defaults

The default `PasswordOptions` enforces the following constraints:

| Property     | Default      | Description                                      |
|--------------|--------------|--------------------------------------------------|
| `MinLength`  | `8`          | Minimum password length                          |
| `MinLower`   | `2`          | Minimum lowercase characters                     |
| `MinUpper`   | `2`          | Minimum uppercase characters                     |
| `MinDigits`  | `2`          | Minimum numeric digit characters                 |
| `MinSymbols` | `2`          | Minimum symbol characters                        |
| `MaxLength`  | PBKDF2 limit | Maximum length based on HMAC-SHA-512 digest size |

Override these defaults during registration:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(um => um
        .Authentication(auth => auth.Configure(options =>
        {
            options.Passwords.MinLength = 12;
            options.Passwords.MinSymbols = 1;
        }))
    );
```

### ASP.NET Identity Password Hash Compatibility

The ASP.NET Identity import job preserves existing password hashes. Users migrated from ASP.NET Identity can continue using their existing passwords without forced resets.

### Timing Attack Protection

Password verification uses constant-time comparison, preventing attackers from determining whether a username exists by measuring response times.

## Authentication Throttling

User Management includes a per-authenticator throttling policy that limits repeated failed authentication attempts. The policy is controlled by `AuthenticationThrottlingOptions`, accessible via `UserAuthenticationOptions.Throttling`.

### `AuthenticationThrottlingOptions`

| Property                      | Type                       | Default      | Description                                                                                                                                                                                     |
|-------------------------------|----------------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `MaxFailedAttempts`           | `int`                      | `5`          | Maximum number of failed attempts before throttling activates.                                                                                                                                  |
| `FailureWindow`               | `TimeSpan`                 | `15 minutes` | Window after the last failure during which the failure count is relevant. If `LastFailedAtUtc + FailureWindow` has elapsed, the count resets to zero.                                           |
| `ThrottleDuration`            | `TimeSpan`                 | `5 minutes`  | How long to block after exceeding the threshold, measured from `LastFailedAtUtc`.                                                                                                               |
| `EscalatingThrottleDurations` | `IReadOnlyList<TimeSpan>?` | `null`       | Per-lockout durations for escalating lockout behavior. When set, each successive lockout uses the next duration in the list. When `null` or empty, `ThrottleDuration` applies for all lockouts. |

Configure throttling during registration:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(um => um
        .Authentication(auth => auth.Configure(options =>
        {
            options.Throttling.MaxFailedAttempts = 3;
            options.Throttling.FailureWindow = TimeSpan.FromMinutes(30);
            options.Throttling.ThrottleDuration = TimeSpan.FromMinutes(10);
        }))
    );
```

The default policy allows an attempt when:

* The failure count is below `MaxFailedAttempts`, or
* `LastFailedAtUtc + FailureWindow` has elapsed (the window has expired), or
* `LastFailedAtUtc + ThrottleDuration` has elapsed (the block period has ended)

Implement `IAuthenticationAttemptPolicy` to replace the default policy with custom logic.

### Velocity-Based Throttling

In addition to failure-based throttling, User Management can limit the total rate of authentication attempts (both successful and failed) within a sliding window. This protects against high-frequency automated attacks that might not trigger failure-based throttling because they occasionally succeed.

The following properties on `AuthenticationThrottlingOptions` control velocity-based throttling:

| Property                   | Type       | Default    | Description                                                                                       |
|----------------------------|------------|------------|---------------------------------------------------------------------------------------------------|
| `MaxAttemptsPerWindow`     | `int`      | `5`        | Maximum total authentication attempts (successful and failed) allowed within the `VelocityWindow` |
| `VelocityWindow`           | `TimeSpan` | `00:00:10` | Sliding window duration for counting total attempts                                               |
| `VelocityThrottleDuration` | `TimeSpan` | `00:00:30` | How long to block further attempts after the velocity threshold is exceeded                       |

Configure velocity-based throttling during registration:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(um => um
        .Authentication(auth => auth.Configure(options =>
        {
            options.Throttling.MaxAttemptsPerWindow = 3;
            options.Throttling.VelocityWindow = TimeSpan.FromSeconds(15);
            options.Throttling.VelocityThrottleDuration = TimeSpan.FromMinutes(1);
        }))
    );
```

The `AuthenticatorAttemptInfo` record now includes a `RecentAttemptTimestamps` property (`IReadOnlyList<DateTimeOffset>`) that stores the timestamps of recent attempts. The velocity policy uses this list to count attempts within the sliding window and determine whether to block further attempts.

### Escalating Lockout

By default, every lockout applies the same flat `ThrottleDuration`. You can make repeated lockouts progressively longer by setting `EscalatingThrottleDurations` to a list of `TimeSpan` values.

When `EscalatingThrottleDurations` is set, the lockout duration is chosen by indexing into the list using the user's current lockout count:

* The first lockout uses the first duration in the list.
* The second lockout uses the second duration, and so on.
* Once the list is exhausted, the last duration is reused for all subsequent lockouts.

`AuthenticatorAttemptInfo.LockoutCount` tracks how many times the user has been locked out for a given authenticator since their last successful authentication. The throttling policy reads this value to select the appropriate duration from the list.

When `EscalatingThrottleDurations` is `null` or empty, the flat `ThrottleDuration` applies as before.

```csharp
// Program.cs
options.Throttling.EscalatingThrottleDurations = [
    TimeSpan.FromMinutes(5),
    TimeSpan.FromMinutes(15),
    TimeSpan.FromHours(1)
];
```

With this configuration, the first lockout blocks for 5 minutes, the second for 15 minutes, and every subsequent lockout for 1 hour.

## OTP Security

### Rate Limiting

User Management includes built-in rate limiting for OTP operations. The following values are verified from source (`OtpWorkflow.cs`):

| Protection                | Value         | Purpose                     |
|---------------------------|---------------|-----------------------------|
| Max verification attempts | `5` per token | Prevents code brute-forcing |
| Min time between sends    | `1 minute`    | Prevents request flooding   |
| Code expiration           | `5 minutes`   | Limits the attack window    |

These values are fixed in the OTP workflow and are not configurable. The OTP code is hashed using PBKDF2 before storage and verified using constant-time comparison.

### Delivery Channel Risks

**Email:**

* Codes are sent in plain text via email
* Email may be stored or forwarded by mail servers
* Consider adding "do not forward" warnings in email templates

**SMS:**

* Subject to SIM swapping attacks
* SMS may be intercepted or stored by carriers
* Less secure than email for sensitive applications

## TOTP Security

* **Secret key generation** uses a cryptographically secure random number generator
* **Time window tolerance** accepts codes from the current 30-second step and one step in each direction (±30 seconds)
* **Rate limiting** for TOTP verification is enforced by the authentication throttling policy described above. Apply `AuthenticationThrottlingOptions` to limit brute-force attempts against the 1,000,000 possible 6-digit codes per 30-second window.

## Passkey Security

Passkeys (WebAuthn/FIDO2) provide the strongest authentication guarantees available in User Management.

### Security Properties

* **Origin-bound**: Credentials are cryptographically bound to the specific relying party domain and cannot be phished or reused on a different origin.
* **No shared secrets**: The private key never leaves the authenticator device; only a public key is stored server-side.
* **Replay-resistant**: Each authentication uses a unique server-generated challenge signed by the device; replaying a captured response is rejected.
* **Challenge expiry**: Challenges expire after 5 minutes (300 seconds) by default and are single-use.

### `PasskeyOptions`

Passkey behavior is controlled by `PasskeyOptions`, accessible via `UserAuthenticationOptions.Passkeys`. The following defaults are verified from source:

| Property                          | Default                   | Description                                                                                            |
|-----------------------------------|---------------------------|--------------------------------------------------------------------------------------------------------|
| `ChallengeSize`                   | `32` bytes (256 bits)     | Size of the server-generated challenge                                                                 |
| `ChallengeTimeout`                | `300` seconds (5 minutes) | Maximum validity period for a passkey challenge                                                        |
| `UserVerificationRequirement`     | `"preferred"`             | Whether user verification (PIN, biometric) is required during authentication                           |
| `AttestationConveyancePreference` | `"none"`                  | Whether the authenticator must provide an attestation statement during registration                    |
| `ResidentKeyRequirement`          | `"preferred"`             | Whether a discoverable (resident) credential is required                                               |
| `AuthenticatorAttachment`         | `null` (any)              | Restricts authenticator type: `"platform"` (built-in), `"cross-platform"` (roaming), or `null` for any |
| `SupportedAlgorithms`             | `[]` (all)                | COSE algorithm identifiers to accept, in preference order                                              |
| `ServerDomain`                    | `null`                    | Explicit relying party ID; set when sharing passkeys across subdomains                                 |
| `AllowedOrigins`                  | Required                  | Fully-qualified origins permitted to use passkeys with this relying party                              |

Configure passkey options during registration:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(um => um
        .Authentication(auth => auth.Configure(options =>
        {
            options.Passkeys.UserVerificationRequirement = "required";
            options.Passkeys.ResidentKeyRequirement = "required";
            options.Passkeys.AllowedOrigins = ["https://auth.example.com"];
            options.Passkeys.ServerDomain = "example.com";
        }))
    );
```

### User Verification Requirement Values

| Value           | Meaning                                                   |
|-----------------|-----------------------------------------------------------|
| `"required"`    | User verification (PIN, biometric) must be performed      |
| `"preferred"`   | User verification is preferred but not required (default) |
| `"discouraged"` | User verification should not be performed                 |

### Resident Key Requirement Values

| Value           | Meaning                                                  |
|-----------------|----------------------------------------------------------|
| `"required"`    | Authenticator must create a discoverable credential      |
| `"preferred"`   | Discoverable credential preferred if supported (default) |
| `"discouraged"` | Non-discoverable credential preferred                    |

### Attestation Conveyance Values

| Value          | Meaning                                                      |
|----------------|--------------------------------------------------------------|
| `"none"`       | No attestation statement required (default)                  |
| `"indirect"`   | Attestation statement may be anonymized                      |
| `"direct"`     | Attestation statement provided directly by the authenticator |
| `"enterprise"` | Enterprise attestation for managed authenticators            |

## Encryption Algorithms

Detailed coverage of the encryption algorithms used for password hashing, recovery code storage, and data protection keys, including their strengths and configuration options, is planned for a future update.

## Recovery Code Security

* Codes are **hashed** (not encrypted) in storage using PBKDF2. They cannot be retrieved, only verified.
* Each code is **single-use**, consumed on successful verification.
* **Generate new codes** to invalidate all previous codes.
* Warn users when the remaining code count drops below a safe threshold.

## Recommendations

* **Prefer passkeys** for the strongest security. They are phishing-resistant and require no shared secrets.
* **Use OTP** as the default passwordless method for consumer applications.
* **Add TOTP** as an optional second factor for users who prefer authenticator apps.
* **Always generate recovery codes** when enabling two-factor authentication.
* **Configure [Data Protection](/general/data-protection.md) key persistence** in production to prevent data loss on restart.
* **Set `AllowedOrigins`** explicitly in `PasskeyOptions` to restrict which origins can use passkeys.
* **Set `ServerDomain`** when sharing passkeys across subdomains (for example, `"example.com"` for `auth.example.com` and `app.example.com`).
* **Set `UserVerificationRequirement` to `"required"`** for high-assurance scenarios.
* **Never store passwords** in logs, error messages, or telemetry.
