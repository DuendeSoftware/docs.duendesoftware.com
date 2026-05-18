---
title: Configuration Reference
description: Complete reference for all configuration options in Duende User Management, including authentication, passwords, passkeys, TOTP, throttling, and endpoint routing.
date: 2026-04-29
sidebar:
  label: Configuration Reference
  order: 1
---

Duende User Management is configured through a set of strongly-typed options classes. This page documents every configurable property, its type, default value, and purpose.

## Registration

Register User Management services in `Program.cs` using the builder pattern:

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication(auth => auth.Configure(options =>
    {
        options.Passwords.MinLength = 10;
        options.Passkeys.RelyingPartyName = "My Application";
        options.Passkeys.AllowedOrigins = ["https://app.example.com"];
        options.Throttling.MaxFailedAttempts = 3;
    }))
    .EnableProfiles()
);
```

To configure both options and the feature builder in a single call:

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication(auth =>
    {
        auth.Configure(options =>
        {
            options.Passkeys.RelyingPartyName = "My Application";
            options.Passkeys.AllowedOrigins = ["https://app.example.com"];
        });
        auth.ConfigureEndpoints(endpoints =>
        {
            endpoints.Passkeys.Route = "/auth/passkeys";
        });
    })
);
```

## `UserAuthenticationOptions`

Top-level options class for the `EnableAuthentication()` call. Accessed via `IOptions<UserAuthenticationOptions>`.

| Property     | Type                              | Description                                                                  |
|--------------|-----------------------------------|------------------------------------------------------------------------------|
| `Totp`       | `TotpOptions`                     | Configuration for Time-Based One-Time Password (TOTP) authenticator storage. |
| `Passkeys`   | `PasskeyOptions`                  | Configuration for passkey registration and authentication.                   |
| `Passwords`  | `PasswordOptions`                 | Configuration for the password validator.                                    |
| `Throttling` | `AuthenticationThrottlingOptions` | Configuration for per-authenticator attempt throttling.                      |

All sub-option objects are initialized with their defaults automatically. You only need to set the properties you want to override.

## `PasswordOptions`

Controls the built-in password complexity validator. Accessed via `UserAuthenticationOptions.Passwords`.

| Property     | Type  | Default | Description                                                                                                                   |
|--------------|-------|---------|-------------------------------------------------------------------------------------------------------------------------------|
| `MinLength`  | `int` | `8`     | Minimum required password length in characters.                                                                               |
| `MaxLength`  | `int` | `64`    | Maximum allowed password length. Capped at 64 characters (512 bits) to avoid PBKDF2 pre-hashing vulnerabilities with SHA-512. |
| `MinLower`   | `int` | `2`     | Minimum number of lowercase letters required.                                                                                 |
| `MinUpper`   | `int` | `2`     | Minimum number of uppercase letters required.                                                                                 |
| `MinDigits`  | `int` | `2`     | Minimum number of numeric digit characters required.                                                                          |
| `MinSymbols` | `int` | `2`     | Minimum number of symbol characters required.                                                                                 |

Example (relaxed password policy):

```csharp title="Program.cs"
.EnableAuthentication(auth => auth.Configure(options =>
{
    options.Passwords.MinLength = 12;
    options.Passwords.MinLower = 1;
    options.Passwords.MinUpper = 1;
    options.Passwords.MinDigits = 1;
    options.Passwords.MinSymbols = 0;
}))
```

## `PasskeyOptions`

Controls WebAuthn/passkey registration and authentication behavior. Accessed via `UserAuthenticationOptions.Passkeys`.

| Property                          | Type                     | Default       | Description                                                                                                                                                                                 |
|-----------------------------------|--------------------------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `RelyingPartyName`                | `string`                 | Assembly name | Human-readable display name of the relying party shown to the user during registration. Does not affect security.                                                                           |
| `ServerDomain`                    | `string?`                | `null`        | The effective domain used as the WebAuthn Relying Party ID. Set explicitly to share passkeys across subdomains (e.g. `"example.com"` for `auth.example.com` and `app.example.com`).         |
| `AllowedOrigins`                  | `IReadOnlyList<string>?` | `null`        | Required. One or more fully-qualified origins (scheme + host + optional port) permitted to use passkeys. The `clientDataJSON.origin` from the authenticator is validated against this list. |
| `ChallengeSize`                   | `int`                    | `32`          | Size of the WebAuthn challenge in bytes (256 bits).                                                                                                                                         |
| `ChallengeTimeout`                | `TimeSpan`               | `00:05:00`    | Maximum lifetime of a passkey challenge. Challenges are single-use and rejected after this duration.                                                                                        |
| `UserVerificationRequirement`     | `string`                 | `"preferred"` | User verification requirement for authentication. See [User Verification Values](#user-verification-values).                                                                                |
| `AttestationConveyancePreference` | `string`                 | `"none"`      | Attestation conveyance preference for credential creation. See [Attestation Conveyance Values](#attestation-conveyance-values).                                                             |
| `AuthenticatorAttachment`         | `string?`                | `null`        | Restricts the authenticator attachment modality. `null` allows any authenticator type. See [Authenticator Attachment Values](#authenticator-attachment-values).                             |
| `ResidentKeyRequirement`          | `string`                 | `"preferred"` | Discoverable credential (resident key) requirement for registration. See [Resident Key Values](#resident-key-values).                                                                       |
| `SupportedAlgorithms`             | `IReadOnlyList<int>`     | `[]`          | COSE algorithm identifiers to support, in preference order. An empty list accepts all algorithms supported by the library. Use `CoseAlgorithms` constants to specify values.                |

### User Verification Values

The `UserVerificationRequirement` property accepts the following string values:

* `"required"`: User verification must be performed (PIN, biometric, etc.).
* `"preferred"`: User verification is preferred but not required. **(default)**
* `"discouraged"`: User verification should not be performed.

### Attestation Conveyance Values

The `AttestationConveyancePreference` property accepts the following string values:

* `"none"`: No attestation statement is needed. **(default)**
* `"indirect"`: Attestation statement may be anonymized by the browser.
* `"direct"`: Attestation statement should be provided directly by the authenticator.
* `"enterprise"`: Enterprise attestation for managed authenticators.

### Authenticator Attachment Values

The `AuthenticatorAttachment` property accepts the following string values:

* `null`: Any authenticator type is allowed. **(default)**
* `"platform"`: Built-in authenticators only (Windows Hello, Touch ID, Face ID).
* `"cross-platform"`: Roaming authenticators only (USB security keys, Bluetooth).

### Resident Key Values

The `ResidentKeyRequirement` property accepts the following string values:

* `"preferred"`: Discoverable credential is preferred if the authenticator supports it. **(default)**
* `"required"`: Discoverable credential is required.
* `"discouraged"`: Non-discoverable credential is preferred.

### Passkey Configuration Example

```csharp title="Program.cs"
.EnableAuthentication(auth => auth.Configure(options =>
{
    options.Passkeys.RelyingPartyName = "ACME Corporation";
    options.Passkeys.ServerDomain = "example.com";
    options.Passkeys.AllowedOrigins =
    [
        "https://app.example.com",
        "https://auth.example.com"
    ];
    options.Passkeys.UserVerificationRequirement = "required";
    options.Passkeys.AuthenticatorAttachment = "platform";
    options.Passkeys.ChallengeTimeout = TimeSpan.FromMinutes(3);
}))
```

## `TotpOptions`

Controls TOTP authenticator app configuration. Accessed via `UserAuthenticationOptions.Totp`.

| Property  | Type             | Description                           |
|-----------|------------------|---------------------------------------|
| `Storage` | `StorageOptions` | Controls how TOTP secrets are stored. |

### `StorageOptions`

Nested within `TotpOptions`. Controls TOTP secret storage behavior.

| Property      | Type   | Default | Description                                                                                                                                                                                            |
|---------------|--------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ProtectKeys` | `bool` | `true`  | When `true`, TOTP secrets are encrypted at rest using [ASP.NET Core Data Protection](/general/data-protection.md) before being stored. Disable only if your storage layer provides its own encryption. |

Example (disable key protection; not recommended unless storage is encrypted externally):

```csharp title="Program.cs"
.EnableAuthentication(auth => auth.Configure(options =>
{
    options.Totp.Storage.ProtectKeys = false;
}))
```

## `AuthenticationThrottlingOptions`

Controls the built-in per-authenticator failed-attempt throttling policy. Accessed via `UserAuthenticationOptions.Throttling`.

| Property                   | Type       | Default    | Description                                                                                                                                                 |
|----------------------------|------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `MaxFailedAttempts`        | `int`      | `5`        | Number of failed attempts allowed within the `FailureWindow` before throttling is applied.                                                                  |
| `FailureWindow`            | `TimeSpan` | `00:15:00` | Rolling window from the last failure during which the failure count is tracked. If `LastFailedAtUtc + FailureWindow` has elapsed, the count resets to zero. |
| `ThrottleDuration`         | `TimeSpan` | `00:05:00` | How long to block further attempts after the threshold is exceeded, measured from the last failed attempt.                                                  |
| `MaxAttemptsPerWindow`     | `int`      | `5`        | Maximum total authentication attempts (successful and failed) allowed within the `VelocityWindow`.                                                          |
| `VelocityWindow`           | `TimeSpan` | `00:00:10` | Sliding window for counting total authentication attempts.                                                                                                  |
| `VelocityThrottleDuration` | `TimeSpan` | `00:00:30` | How long to block further attempts after the velocity threshold is exceeded.                                                                                |

Example (stricter throttling):

```csharp title="Program.cs"
.EnableAuthentication(auth => auth.Configure(options =>
{
    options.Throttling.MaxFailedAttempts = 3;
    options.Throttling.FailureWindow = TimeSpan.FromMinutes(30);
    options.Throttling.ThrottleDuration = TimeSpan.FromMinutes(15);
    options.Throttling.MaxAttemptsPerWindow = 5;
    options.Throttling.VelocityWindow = TimeSpan.FromSeconds(10);
    options.Throttling.VelocityThrottleDuration = TimeSpan.FromSeconds(30);
}))
```

## `UserAuthenticationEndpointOptions`

Controls the HTTP endpoint routes exposed by the web layer. Configure via `ConfigureEndpoints()` on the authentication builder:

```csharp title="Program.cs"
.EnableAuthentication(auth =>
{
    auth.Configure(options => { /* UserAuthenticationOptions */ });
    auth.ConfigureEndpoints(endpoints =>
    {
        endpoints.Passkeys.Route = "/auth/passkeys";
    });
})
```

Or bind from configuration:

```csharp title="Program.cs"
.EnableAuthentication(auth =>
{
    auth.Configure(options => { });
    auth.ConfigureEndpoints(
        builder.Configuration.GetSection("UserAuthentication:Endpoints")
    );
})
```

| Property   | Type                   | Description                                    |
|------------|------------------------|------------------------------------------------|
| `Passkeys` | `PasskeysRouteOptions` | Route configuration for all passkey endpoints. |

## `PasskeysRouteOptions`

Controls the individual route paths for passkey HTTP endpoints. All paths under `Passkeys` are relative to the `Route` prefix. Accessed via `UserAuthenticationEndpointOptions.Passkeys`.

| Property                          | Type     | Default                              | Description                                                                                                                                                           |
|-----------------------------------|----------|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Route`                           | `string` | `"/passkeys"`                        | Base route prefix for all passkey endpoints.                                                                                                                          |
| `BeginRegistration`               | `string` | `"/register/begin"`                  | Path for the passkey registration initiation endpoint (relative to `Route`). Full default: `/passkeys/register/begin`.                                                |
| `CompleteRegistration`            | `string` | `"/register/complete"`               | Path for the passkey registration completion endpoint (relative to `Route`). Full default: `/passkeys/register/complete`.                                             |
| `BeginAuthentication`             | `string` | `"/authenticate/begin"`              | Path for the passkey authentication initiation endpoint (relative to `Route`). Full default: `/passkeys/authenticate/begin`.                                          |
| `BeginDiscoverableAuthentication` | `string` | `"/authenticate/discoverable/begin"` | Path for the discoverable (usernameless) passkey authentication initiation endpoint (relative to `Route`). Full default: `/passkeys/authenticate/discoverable/begin`. |
| `CompleteAuthentication`          | `string` | `"/authenticate/complete"`           | Path for the passkey authentication completion endpoint (relative to `Route`). Full default: `/passkeys/authenticate/complete`.                                       |
| `PasskeysJavaScript`              | `string` | `"/js"`                              | Path for the passkeys JavaScript helper endpoint (relative to `Route`). Full default: `/passkeys/js`.                                                                 |

Example (custom route prefix):

```csharp title="Program.cs"
auth.ConfigureEndpoints(endpoints =>
{
    endpoints.Passkeys.Route = "/auth/webauthn";
})
```

This changes all passkey endpoints to use `/auth/webauthn` as the base, so registration begins at `/auth/webauthn/register/begin`, and so on.

## Membership Module

The membership module provides administrative services for managing users, roles, and groups within your application. It is an optional add-on to the core User Management stack; register it when your application needs to programmatically create or modify users, assign roles, or manage group membership from server-side code (for example, in admin UIs or API endpoints).

The module is registered by calling `EnableMembership()` through `AddUserManagement()`:

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services.AddUserManagement(um => um
    .EnableAuthentication()
    .EnableMembership()
);
```

Calling `EnableMembership()` registers the following services with the service provider:

| Service            | Description                                                                                                 |
|--------------------|-------------------------------------------------------------------------------------------------------------|
| `IMembershipAdmin` | Provides administrative operations for user accounts: creating, updating, deleting, and querying users.     |
| `IRoleAdmin`       | Provides administrative operations for roles: creating, updating, deleting, and assigning roles to users.   |
| `IGroupAdmin`      | Provides administrative operations for groups: creating, updating, deleting, and managing group membership. |

All three services are registered with scoped lifetime and can be injected wherever you need to perform administrative operations on the user store.
