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

`IUserSelfService` is what you inject when a user needs to manage their own account. It handles deregistration directly and exposes profile and authenticator operations as sub-service properties, so you don't need to inject each one separately.

```csharp
public interface IUserSelfService
{
    Task<bool> TryDeregisterAsync(UserSubjectId subjectId, Ct ct);
    IUserProfileSelfService Profiles { get; }
    IUserAuthenticatorsSelfService Authenticators { get; }
}
```

### Methods

* **`TryDeregisterAsync`**: Permanently removes the user identified by `subjectId` and all associated data. Returns `false` if the user does not exist.

### Properties

* **`Profiles`**: Provides access to `IUserProfileSelfService` for reading and updating the user's profile.
* **`Authenticators`**: Provides access to `IUserAuthenticatorsSelfService` for managing OTP, TOTP, passkeys, passwords, and recovery codes.

### Usage

```csharp
// Deregister the user
var deregistered = await userSelfService.TryDeregisterAsync(subjectId, ct);

// Access sub-services through the parent interface
var profile = await userSelfService.Profiles.TryGetAsync(subjectId, ct);
var authenticators = await userSelfService.Authenticators.TryGetAsync(subjectId, ct);
```

## `IUserAdmin`

`IUserAdmin` is the administrative counterpart. Inject it into admin interfaces or background jobs that manage users on their behalf.

```csharp
public interface IUserAdmin
{
    Task<bool> TryRemoveAsync(UserSubjectId subjectId, Ct ct);
    IMembershipAdmin Membership { get; }
    IUserProfileAdmin Profiles { get; }
    IUserAuthenticatorsAdmin Authenticators { get; }
}
```

### Methods

* **`TryRemoveAsync`**: Permanently removes the user identified by `subjectId` and all associated data. Returns `false` if the user does not exist.

### Properties

* **`Membership`**: Provides access to `IMembershipAdmin` for role and group assignment.
* **`Profiles`**: Provides access to `IUserProfileAdmin` for reading, creating, and querying profiles.
* **`Authenticators`**: Provides access to `IUserAuthenticatorsAdmin` for managing authenticators on behalf of users.

### Difference from `IUserSelfService`

`IUserAdmin` and `IUserSelfService` expose similar capabilities. The difference is who the actor is: admin code managing users on their behalf vs. users managing their own accounts. Apply appropriate authorization to each in your application.

## `UserAuthenticators` Record

`UserAuthenticators` is a read-only snapshot of all authenticators registered for a user. It is returned by the `Authenticators` sub-service on `IUserSelfService` and `IUserAdmin` (i.e., `IUserAuthenticatorsSelfService` and `IUserAuthenticatorsAdmin`).

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
// Create from an existing string identifier
var subjectId = UserSubjectId.Create("some-existing-id");

// Generate a new unique identifier (creates a GUID string internally)
var newId = UserSubjectId.New();

// Access the underlying string value
string value = subjectId.Value;
```

### `OtpAddress`

A combination of an `OtpChannel` (email or phone) and a `SubjectId` (the address itself). Represents a delivery channel for one-time passwords.

```csharp
// Construct from a channel and address
var emailAddress = EmailAddress.Create("jane@example.com");
var otpAddress = new OtpAddress(OtpChannel.Email, emailAddress);

var phoneNumber = PhoneNumber.Create("+12025550100");
var otpPhone = new OtpAddress(OtpChannel.Sms, phoneNumber);
```

### `EmailAddress`

A validated email address. Whitespace is trimmed automatically. Minimum length is 3 characters; maximum length is 320 characters.

```csharp
// Create: throws FormatException on invalid input
var email = EmailAddress.Create("jane@example.com");

// TryCreate: returns false on invalid input
if (EmailAddress.TryCreate("jane@example.com", out var result))
{
    // result is valid here
}
```

### `PhoneNumber`

A validated phone number. Leading `+` and `0` characters are stripped, whitespace is removed, and only digit characters are accepted. Maximum length is 15 digits (per ITU-T E.164).

```csharp
// Create: throws FormatException on invalid input
var phone = PhoneNumber.Create("+12025550100");

// TryCreate: returns false on invalid input
if (PhoneNumber.TryCreate("+12025550100", out var result))
{
    // result is valid here
}
```

### `ExternalAuthenticatorName`

The name of an external identity provider (for example, `"Google"` or `"GitHub"`). Whitespace is trimmed automatically. Maximum length is 255 characters.

```csharp
// Create: throws FormatException on invalid input
var name = ExternalAuthenticatorName.Create("Google");

// TryCreate: returns false on invalid input
if (ExternalAuthenticatorName.TryCreate("Google", out var result))
{
    // result is valid here
}
```

### `OpaqueSubjectId`

An opaque string identifier, used as the subject ID issued by an external identity provider. Whitespace is trimmed automatically. Maximum length is 255 characters.

```csharp
// Create: throws FormatException on invalid input
var id = OpaqueSubjectId.Create("1234567890");

// TryCreate: returns false on invalid input
if (OpaqueSubjectId.TryCreate("1234567890", out var result))
{
    // result is valid here
}
```

`UserSubjectId` and `OpaqueSubjectId` both implement the `ISubjectId` interface but are independent types. Use `UserSubjectId` when referring to users within User Management, and `OpaqueSubjectId` when working with external provider subject IDs.

## Extensibility and Maintenance Boundaries

Knowing what Duende maintains versus what you can customize helps you build integrations correctly and avoid reimplementing things that already exist.

### Maintained by Duende (internal)

These are implemented and maintained by Duende and updated with each release. You call these interfaces but don't implement them:

* **`IUserSelfService`**: lifecycle operations users perform on their own accounts (`TryDeregisterAsync`), with sub-services for profiles (`Profiles`) and authenticators (`Authenticators`)
* **`IUserAdmin`**: administrative lifecycle operations (`TryRemoveAsync`), with sub-services for membership (`Membership`), profiles (`Profiles`), and authenticators (`Authenticators`)
* **`IUserAuthenticatorsSelfService` / `IUserAuthenticatorsAdmin`**: authenticator management (OTP addresses, TOTP, passkeys, recovery codes), accessible directly or via the parent interfaces
* **Core storage**: the underlying user store, credential storage, and session state are internal to Duende and not designed for replacement or override
* **Authentication logic and lifecycle state machine**: the rules governing registration, login, MFA enrollment, and deregistration are managed internally and are not extensible

You don't need to implement any of these. Inject them where needed and call their methods.

### Extensibility for Developers

These extension points are designed for you to implement or configure:

| Extension point           | Interface                 | Purpose                                                                                                       |
|---------------------------|---------------------------|---------------------------------------------------------------------------------------------------------------|
| OTP delivery              | `IOtpDispatcher`          | Implement to deliver one-time password codes via your preferred channel (email, SMS, push notification, etc.) |
| Password validation       | `IPasswordValidator`      | Implement custom password strength or policy rules beyond the built-in defaults                               |
| Custom profile attributes | `IUserProfileSchemaAdmin` | Add application-specific attributes to the user profile schema                                                |

Register your implementation with the service provider at startup to override the default behavior.

### Not Extensible

The following are internal to Duende and not designed for override or extension:

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

These are all `record` types. There is no inheritance between them: they are independent types that share the `ISubjectId` contract.
