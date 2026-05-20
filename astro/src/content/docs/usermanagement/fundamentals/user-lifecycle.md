---
title: User Management Operations
description: Programmatic interfaces for managing user accounts in Duende User Management, including IUserSelfService, IUserAdmin, UserAuthenticators, and value objects.
date: 2026-04-29
sidebar:
  label: User Management Operations
  order: 6
---

User Management exposes two service interfaces for managing user accounts: `IUserSelfService` for operations users perform on their own accounts, and `IUserAdmin` for administrative operations. Both interfaces work with strongly-typed value objects and return `bool` results to indicate success or failure.

## `IUserSelfService`

`IUserSelfService` provides operations that users perform on their own accounts. Inject this interface into your application services to allow users to manage their username and deregister.

```csharp
public interface IUserSelfService
{
    Task<bool> TrySetUserNameAsync(UserSubjectId subjectId, UserName userName, Ct ct);

    Task<bool> TryRemoveUserNameAsync(UserSubjectId subjectId, Ct ct);

    Task<bool> TryDeregisterAsync(UserSubjectId subjectId, Ct ct);
}
```

### Methods

* **`TrySetUserNameAsync`**: Assigns a username to the user identified by `subjectId`. Returns `false` if the username is already taken or the user does not exist.
* **`TryRemoveUserNameAsync`**: Removes the username from the user identified by `subjectId`. Returns `false` if the user does not exist or has no username set.
* **`TryDeregisterAsync`**: Permanently removes the user identified by `subjectId` and all associated data. Returns `false` if the user does not exist.

### Usage

```csharp
// Set a username
var userName = UserName.Parse("jane.doe");
var success = await userSelfService.TrySetUserNameAsync(subjectId, userName, ct);

// Remove a username
var removed = await userSelfService.TryRemoveUserNameAsync(subjectId, ct);

// Deregister the user
var deregistered = await userSelfService.TryDeregisterAsync(subjectId, ct);
```

## `IUserAdmin`

`IUserAdmin` provides administrative operations for managing user accounts. Inject this interface into admin interfaces or background jobs that need to manage users on their behalf.

```csharp
public interface IUserAdmin
{
    Task<bool> TrySetUserNameAsync(UserSubjectId subjectId, UserName userName, Ct ct);

    Task<bool> TryRemoveUserNameAsync(UserSubjectId subjectId, Ct ct);

    Task<bool> TryRemoveAsync(UserSubjectId subjectId, Ct ct);
}
```

### Methods

* **`TrySetUserNameAsync`**: Assigns a username to the user identified by `subjectId`. Returns `false` if the username is already taken or the user does not exist.
* **`TryRemoveUserNameAsync`**: Removes the username from the user identified by `subjectId`. Returns `false` if the user does not exist or has no username set.
* **`TryRemoveAsync`**: Permanently removes the user identified by `subjectId` and all associated data. Returns `false` if the user does not exist.

### Difference From `IUserSelfService`

`IUserAdmin` and `IUserSelfService` expose the same username operations. The key difference is `TryRemoveAsync` (admin) versus `TryDeregisterAsync` (self-service). Both permanently delete the user, but the naming reflects the actor: an administrator removing a user versus a user deregistering themselves. Apply appropriate authorization to each interface in your application.

## `UserAuthenticators` Record

`UserAuthenticators` is a read-only snapshot of all authenticators registered for a user. It is returned by `IUserAuthenticatorsSelfService` and `IUserAuthenticatorsAdmin` query methods.

```csharp
public sealed record UserAuthenticators
{
    public UserSubjectId SubjectId { get; }
    public IReadOnlyCollection<OtpAddress> OtpAddresses { get; }
    public IReadOnlyCollection<ExternalAuthenticator> ExternalAuthenticators { get; }
    public IReadOnlyCollection<TotpAuthenticatorName> TotpAuthenticatorNames { get; }
    public IReadOnlyCollection<UserPasskey> Passkeys { get; }
    public int RecoveryCodeCount { get; }
    public bool HasPassword { get; }
    public UserName? UserName { get; }
}
```

### Properties

| Property                 | Type                                         | Description                                                                                                                                   |
|--------------------------|----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `SubjectId`              | `UserSubjectId`                              | The unique identifier of the user                                                                                                             |
| `OtpAddresses`           | `IReadOnlyCollection<OtpAddress>`            | Email addresses and phone numbers registered for One-Time Password (OTP) delivery                                                             |
| `ExternalAuthenticators` | `IReadOnlyCollection<ExternalAuthenticator>` | External identity providers linked to this account (for example, Google, GitHub)                                                              |
| `TotpAuthenticatorNames` | `IReadOnlyCollection<TotpAuthenticatorName>` | Names of registered Time-Based One-Time Password (TOTP) authenticators; a non-empty collection indicates two-factor authentication is enabled |
| `Passkeys`               | `IReadOnlyCollection<UserPasskey>`           | Registered passkeys, each with a credential ID, display name, and creation timestamp                                                          |
| `RecoveryCodeCount`      | `int`                                        | Number of unused recovery codes remaining                                                                                                     |
| `HasPassword`            | `bool`                                       | Whether the user has a password set                                                                                                           |
| `UserName`               | `UserName?`                                  | The user's username, or `null` if no username has been assigned                                                                               |

### Usage

```csharp
var authenticators = await userAuthenticatorsSelfService.TryGetAsync(subjectId, ct);

if (authenticators is not null)
{
    // Check whether two-factor authentication is enabled
    var hasTwoFactor = authenticators.TotpAuthenticatorNames.Count > 0
        || authenticators.Passkeys.Count > 0;

    // Check remaining recovery codes
    if (authenticators.RecoveryCodeCount < 3)
    {
        // Prompt user to regenerate recovery codes
    }
}
```

## Value Objects

User Management uses strongly-typed value objects for all identifiers. These types prevent mixing up different kinds of identifiers at compile time and enforce format constraints at parse time.

### `UserSubjectId`

The unique identifier for a user. Stored as a string value (maximum 200 characters), compliant with [RFC 9493](https://www.rfc-editor.org/rfc/rfc9493.html).

```csharp
// Parse from an existing string identifier
var subjectId = UserSubjectId.Parse("some-existing-id");

// Generate a new unique identifier (creates a GUID string internally)
var newId = UserSubjectId.New();

// Access the underlying string value
string value = subjectId.Value;
```

### `UserName`

A validated username string. Whitespace is trimmed automatically. Maximum length is 320 characters (to accommodate email addresses used as usernames).

```csharp
// Parse: throws FormatException on invalid input
var userName = UserName.Parse("jane.doe");

// TryParse: returns false on invalid input
if (UserName.TryParse("jane.doe", out var result))
{
    // result is valid here
}
```

### `OtpAddress`

A combination of an `OtpChannel` (email or phone) and a `SubjectId` (the address itself). Represents a delivery channel for one-time passwords.

```csharp
// Construct from a channel and address
var emailAddress = EmailAddress.Parse("jane@example.com");
var otpAddress = new OtpAddress(OtpChannel.Email, emailAddress);

var phoneNumber = PhoneNumber.Parse("+12025550100");
var otpPhone = new OtpAddress(OtpChannel.Sms, phoneNumber);
```

### `EmailAddress`

A validated email address. Whitespace is trimmed automatically. Minimum length is 3 characters; maximum length is 320 characters.

```csharp
// Parse: throws FormatException on invalid input
var email = EmailAddress.Parse("jane@example.com");

// TryParse: returns false on invalid input
if (EmailAddress.TryParse("jane@example.com", out var result))
{
    // result is valid here
}
```

### `PhoneNumber`

A validated phone number. Leading `+` and `0` characters are stripped, whitespace is removed, and only digit characters are accepted. Maximum length is 15 digits (per ITU-T E.164).

```csharp
// Parse: throws FormatException on invalid input
var phone = PhoneNumber.Parse("+12025550100");

// TryParse: returns false on invalid input
if (PhoneNumber.TryParse("+12025550100", out var result))
{
    // result is valid here
}
```

### `ExternalAuthenticatorName`

The name of an external identity provider (for example, `"Google"` or `"GitHub"`). Whitespace is trimmed automatically. Maximum length is 255 characters.

```csharp
// Parse: throws FormatException on invalid input
var name = ExternalAuthenticatorName.Parse("Google");

// TryParse: returns false on invalid input
if (ExternalAuthenticatorName.TryParse("Google", out var result))
{
    // result is valid here
}
```

### `OpaqueSubjectId`

An opaque string identifier, used as the subject ID issued by an external identity provider. Whitespace is trimmed automatically. Maximum length is 255 characters.

```csharp
// Parse: throws FormatException on invalid input
var id = OpaqueSubjectId.Parse("1234567890");

// TryParse: returns false on invalid input
if (OpaqueSubjectId.TryParse("1234567890", out var result))
{
    // result is valid here
}
```

`UserSubjectId` and `OpaqueSubjectId` both implement the `ISubjectId` interface but are independent types. Use `UserSubjectId` when referring to users within User Management, and `OpaqueSubjectId` when working with external provider subject IDs.

## Extensibility and Maintenance Boundaries

Understanding what Duende maintains internally versus what you can customize helps you build integrations correctly and avoid reimplementing functionality that is already provided.

### Maintained by Duende (internal)

The following are implemented and maintained by Duende and updated with each release. You call these interfaces but do not implement them:

* **`IUserSelfService`**: lifecycle operations users perform on their own accounts (`TrySetUserNameAsync`, `TryRemoveUserNameAsync`, `TryDeregisterAsync`)
* **`IUserAdmin`**: administrative lifecycle operations (`TrySetUserNameAsync`, `TryRemoveUserNameAsync`, `TryRemoveAsync`)
* **`IUserAuthenticatorsSelfService` / `IUserAuthenticatorsAdmin`**: authenticator management (OTP addresses, TOTP, passkeys, recovery codes)
* **Core storage**: the underlying user store, credential storage, and session state are internal to Duende and not designed for replacement or override
* **Authentication logic and lifecycle state machine**: the rules governing registration, login, MFA enrollment, and deregistration are managed internally and are not extensible

You do not need to implement any of these; inject them where needed and call their methods.

### Extensible by developers

The following extension points are designed for you to implement or configure:

| Extension point           | Interface                 | Purpose                                                                                                    |
|---------------------------|---------------------------|------------------------------------------------------------------------------------------------------------|
| OTP delivery              | `IOtpSender`              | Implement to send one-time password codes via your preferred channel (email, SMS, push notification, etc.) |
| Password validation       | `IPasswordValidator`      | Implement custom password strength or policy rules beyond the built-in defaults                            |
| Custom profile attributes | `IUserProfileSchemaAdmin` | Add application-specific attributes to the user profile schema                                             |

These interfaces are registered with the service provider. Provide your own implementation during application startup to override the default behavior.

### Not extensible

The following are internal to Duende and are not designed for override or extension:

* Core user storage and the database schema backing it
* The authentication and credential verification logic
* The lifecycle state machine (registration flow, deregistration cascade, authenticator enrollment rules)

Attempting to replace these by intercepting internal services is unsupported and may break across releases.

## Type Hierarchy

The subject identifier value objects follow the [RFC 9493](https://www.rfc-editor.org/rfc/rfc9493.html) subject identifier specification. They all implement the `ISubjectId` interface:

* `OpaqueSubjectId`: opaque string identifier (max 255 characters)
* `UserSubjectId`: User Management user identifier (max 200 characters)
* `EmailAddress`: validated email address (max 320 characters)
* `PhoneNumber`: validated phone number in E.164 format (max 15 digits)

These are all `readonly record struct` types. There is no inheritance between them: they are independent types that share the `ISubjectId` contract.

`UserName` is a related value object (max 320 characters) but does not implement `ISubjectId`.
