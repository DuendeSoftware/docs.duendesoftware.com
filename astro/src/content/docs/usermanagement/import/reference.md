---
title: Import API reference
description: API reference for IUserImporter, UserImportRecord, AuthenticatorImport, conflict resolution, and related types.
sidebar:
  label: API reference
  order: 3
---

This page covers the types and interfaces you use to build and submit import batches, handle results, and resolve conflicts when imported data overlaps with existing records.

## Importing Users

`IUserImporter` is the entry point for bulk import. It is registered as a transient service automatically when adding Duende User Management,
and can be injected anywhere in your application.

```csharp
// IUserImporter.cs
public interface IUserImporter
{
    Task<UserImportBatchResult> ImportAsync(IReadOnlyList<UserImportRecord> records, CancellationToken ct);
}
```

For each record in the batch, the importer runs up to three steps in order:

1. **Profile**: creates or updates the user profile with the provided `SubjectId`, `UserName`, and `ProfileAttributes`.
2. **Authenticator**: creates or updates authenticator data (passwords, passkeys, TOTP keys, OTP addresses, external providers, recovery codes).
3. **Membership**: assigns the user to the specified groups and roles.

Each step is optional. If you only provide `Authenticators` on a record, the profile and membership steps are skipped entirely.
If a step encounters existing data (for example, a profile with the same `SubjectId` already exists), the importer calls
the registered `IUserImportConflictResolver` to decide what to do. The default resolver retries on concurrency conflicts
and skips everything else, which means a first-time import of new users works out of the box without any configuration.
If a record needs to overwrite existing data, or if you want to customize the behavior for specific conflict reasons,
you can register your own resolver. See [Conflict Resolution](#conflict-resolution) for details.

A failure on one record does not affect the others in the batch. The importer processes every record and returns a
`UserImportBatchResult` with per-record outcomes, so you always know exactly which records succeeded and which did not.

### End-to-end example

The following example imports two users: one with a password and group membership, and one with an external authenticator.

```csharp
// UserImportService.cs
public class UserImportService(IUserImporter importer, IUserProfileAdmin profileAdmin)
{
    public async Task RunAsync(CancellationToken ct)
    {
        // Build profile attributes using the schema so values are type-validated.
        var schema = await profileAdmin.GetSchemaAsync(ct);

        var aliceAttributes = new AttributeValueCollection();
        aliceAttributes.Set(schema.CreateAttribute(AttributeCode.Parse("email"), "alice@example.com"));
        aliceAttributes.Set(schema.CreateAttribute(AttributeCode.Parse("display_name"), "Alice"));

        // Represent a pre-hashed bcrypt password from the source system.
        // Hash and Salt are raw bytes; supply the actual bytes from your source data.
        var bcryptHash = new HashedPasswordData(
            algorithmId: "bcrypt",
            hash: new byte[] { /* raw hash bytes from source */ },
            salt: new byte[] { /* raw salt bytes from source */ },
            parameters: new Dictionary<string, string> { ["cost"] = "12" });

        var records = new List<UserImportRecord>
        {
            new UserImportRecord
            {
                SubjectId = new UserSubjectId("user-001"),
                UserName = new UserName("alice@example.com"),
                ProfileAttributes = aliceAttributes,
                Authenticators = new AuthenticatorImport
                {
                    Password = new PasswordImport(bcryptHash),
                },
                Memberships = new MembershipImport
                {
                    Groups = new[] { GroupId.Parse("admins") },
                },
            },
            new UserImportRecord
            {
                SubjectId = new UserSubjectId("user-002"),
                UserName = new UserName("bob@example.com"),
                Authenticators = new AuthenticatorImport
                {
                    ExternalAuthenticators = new[]
                    {
                        new ExternalAuthenticator(
                            Provider: "google",
                            ProviderSubjectId: "google-sub-abc123"
                        ),
                    },
                },
            },
        };

        UserImportBatchResult result = await importer.ImportAsync(records, ct);

        Console.WriteLine($"Created: {result.CreatedCount}");
        Console.WriteLine($"Updated: {result.UpdatedCount}");
        Console.WriteLine($"Skipped: {result.SkippedCount}");
        Console.WriteLine($"Failed:  {result.FailedCount}");

        foreach (UserImportResult r in result.Results)
        {
            if (r.Status == UserImportStatus.Failed)
                Console.WriteLine($"  FAILED {r.SubjectId}: {r.Error}");
        }
    }
}
```

## Building Import Records

This section covers the types you use to describe what gets imported for each user: the record itself,
authenticator data, and group or role memberships.

### `UserImportRecord`

Each record describes a single user to import. Only `SubjectId` is required; all other fields are optional.

```csharp
// UserImportRecord.cs
public sealed record UserImportRecord
{
    public required UserSubjectId SubjectId { get; init; }
    public UserName? UserName { get; init; }
    public AttributeValueCollection? ProfileAttributes { get; init; }
    public AuthenticatorImport? Authenticators { get; init; }
    public MembershipImport? Memberships { get; init; }
}
```

You can provide any combination of `ProfileAttributes`, `Authenticators`, and `Memberships`.
When `UserName` is set and a profile is created or overwritten, the system also sets the username on the user profile 
and the authenticator record.

### `AuthenticatorImport`

`AuthenticatorImport` groups all authenticator data for a user. Each field is optional; include only the authenticator
types you are migrating.

```csharp
// AuthenticatorImport.cs
public sealed record AuthenticatorImport
{
    public IReadOnlyCollection<OtpAddress>? OtpAddresses { get; init; }
    public IReadOnlyCollection<ExternalAuthenticator>? ExternalAuthenticators { get; init; }
    public IReadOnlyCollection<PasskeyImport>? Passkeys { get; init; }
    public PasswordImport? Password { get; init; }
    public IReadOnlyCollection<TotpImport>? TotpAuthenticators { get; init; }
    public IReadOnlyCollection<PlainTextRecoveryCode>? RecoveryCodes { get; init; }
}
```

#### `PasswordImport`

```csharp
// PasswordImport.cs
public sealed record PasswordImport(HashedPasswordData Data);
```

`PasswordImport` carries a pre-hashed password from the source system. The platform stores the hash as-is and verifies
it using the `IPasswordHashAlgorithm` registered for the stored algorithm ID. On the first successful authentication,
the password is transparently re-hashed using the current preferred algorithm, so users are migrated to the new hashing
scheme without any disruption.

#### `TotpImport`

```csharp
// TotpImport.cs
public sealed record TotpImport(TotpAuthenticatorName Name, PlainBytesTotpKey Key);
```

`TotpImport` carries the raw TOTP secret key from the source system. Provide the key as a `PlainBytesTotpKey`
and a display name for the authenticator.

#### `PasskeyImport`

```csharp
// PasskeyImport.cs
public sealed record PasskeyImport
{
    public required IReadOnlyList<byte> CredentialId { get; init; }
    public required IReadOnlyList<byte> PublicKeyCose { get; init; }
    public required int Algorithm { get; init; }
    public uint SignCount { get; init; }
    public bool BackupEligible { get; init; }
    public bool BackedUp { get; init; }
    public Guid Aaguid { get; init; }
    public required string Name { get; init; }
}
```

`PasskeyImport` carries the raw WebAuthn credential data. `CredentialId` and `PublicKeyCose` are the byte arrays
from the original registration ceremony. `Algorithm` is the COSE algorithm identifier (for example, `-7` for ES256).
`SignCount`, `BackupEligible`, `BackedUp`, and `Aaguid` correspond to the authenticator data fields from the original attestation.

### `MembershipImport`

```csharp
// MembershipImport.cs
public sealed record MembershipImport
{
    public IReadOnlyCollection<GroupId>? Groups { get; init; }
    public IReadOnlyCollection<RoleId>? DirectRoles { get; init; }
}
```

`MembershipImport` assigns the user to existing groups and roles. The referenced groups and roles must already exist
before you run the import; a missing group or role causes a hard failure on that individual record.

## Handling Results

### `UserImportBatchResult`

`ImportAsync` returns a `UserImportBatchResult` with a per-record result list and aggregate counts.

```csharp
// UserImportBatchResult.cs
public sealed record UserImportBatchResult
{
    public required IReadOnlyList<UserImportResult> Results { get; init; }
    public int CreatedCount { get; }
    public int UpdatedCount { get; }
    public int SkippedCount { get; }
    public int FailedCount { get; }
}
```

### `UserImportResult`

Each entry in `UserImportBatchResult.Results` corresponds to one input record and reports the outcome for that record.

```csharp
// UserImportResult.cs
public sealed record UserImportResult
{
    public required UserSubjectId SubjectId { get; init; }
    public required UserImportStatus Status { get; init; }
    public string? Error { get; init; }
}
```

When `Status` is `Failed`, `Error` contains a description of what went wrong.
For all other statuses, `Error` is `null`.

### `UserImportStatus` enum

| Value     | Meaning                                                                        |
|-----------|--------------------------------------------------------------------------------|
| `Created` | The user was successfully created.                                             |
| `Updated` | The user was successfully updated (overwrite conflict resolution was applied). |
| `Skipped` | The user was skipped because a conflict was resolved as `Skip`.                |
| `Failed`  | The user failed to import due to an error.                                     |

## Conflict Resolution

When the importer tries to create a profile, authenticator, or membership record and discovers that matching
data already exists, it raises a conflict. Rather than failing immediately, the importer delegates the decision
to an `IUserImportConflictResolver`. The resolver inspects the conflict (which record, which step, and why it conflicted)
and returns a resolution: skip the step, overwrite the existing data, or retry the operation.

This design keeps the import pipeline itself generic. The policy for handling duplicates, username collisions,
and concurrency races lives in the resolver, which you can swap out without changing any import logic.

### Default behavior

The built-in resolver is intentionally conservative. It retries when a concurrency conflict occurs (another process
modified the same record at the same time) and skips everything else. In practice, this means:

* A first-time import of new users works without any configuration.
* Re-running the same import skips every record that was already imported, because the default resolver treats `ProfileAlreadyExists` and `AuthenticatorAlreadyExists` as skip.
* If you need idempotent re-runs (where re-importing a record updates it in place), you need a custom resolver that returns `Overwrite` instead of `Skip`.

### `IUserImportConflictResolver`

```csharp
// IUserImportConflictResolver.cs
public interface IUserImportConflictResolver
{
    Task<UserImportConflictResolution> ResolveAsync(UserImportConflict conflict, CancellationToken ct);
}
```

The default implementation is described [above](#default-behavior). To customize conflict handling, register your own
implementation with the service provider (see [Registering a custom resolver](#registering-a-custom-resolver)).

### `UserImportConflict`

The resolver receives a `UserImportConflict` describing the record, the step that failed, and the reason.

```csharp
// UserImportConflict.cs
public sealed record UserImportConflict
{
    public required UserImportRecord Record { get; init; }
    public required UserImportStep Step { get; init; }
    public required UserImportConflictReason Reason { get; init; }
    public required Exception Exception { get; init; }
}
```

### `UserImportStep` enum

| Value           | Meaning                                    |
|-----------------|--------------------------------------------|
| `Profile`       | The user profile creation or update step.  |
| `Authenticator` | The authenticator creation or update step. |
| `Membership`    | The membership assignment step.            |

### `UserImportConflictReason` enum

| Value                        | Meaning                                                                                                               |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `ProfileAlreadyExists`       | A user profile with the same subject ID already exists.                                                               |
| `ProfileUniqueKeyConflict`   | A unique attribute value (including username) on the incoming<br/>record already belongs to a different user profile. |
| `AuthenticatorAlreadyExists` | Authenticators for the same subject ID already exist.                                                                 |
| `AuthenticatorKeyConflict`   | The username is already claimed by a different user's authenticators.                                                 |
| `ConcurrencyConflict`        | An optimistic concurrency conflict occurred.                                                                          |
| `MembershipAlreadyExists`    | A membership record for the same subject ID already exists.                                                           |

### `UserImportConflictResolution`

The resolver returns one of three resolutions:

```csharp
// UserImportConflictResolution.cs
public abstract record UserImportConflictResolution
{
    public sealed record Skip : UserImportConflictResolution;
    public sealed record Overwrite(UserSubjectId TargetSubjectId) : UserImportConflictResolution;
    public sealed record Retry : UserImportConflictResolution;
}
```

* `Skip`: skips the conflicting step; existing data is left unchanged.
* `Overwrite(TargetSubjectId)`: overwrites the existing user; profile attributes are overlaid and authenticators are merged additively.
* `Retry`: retries the operation, which is useful when the resolver has taken corrective action such as deleting the conflicting record. Retries are subject to an internal cap.

### Registering a custom resolver

`IUserImportConflictResolver` is registered as a singleton with the default implementation. To override it,
register your own implementation before the default is used:

```csharp
// Program.cs
builder.Services.AddSingleton<IUserImportConflictResolver, CustomConflictResolver>();
```

The following example overwrites existing profiles but skips all other conflicts:

```csharp
// CustomConflictResolver.cs
public class CustomConflictResolver : IUserImportConflictResolver
{
    public Task<UserImportConflictResolution> ResolveAsync(
        UserImportConflict conflict,
        CancellationToken ct)
    {
        UserImportConflictResolution resolution = conflict.Reason switch
        {
            UserImportConflictReason.ProfileAlreadyExists =>
                new UserImportConflictResolution.Overwrite(conflict.Record.SubjectId),

            UserImportConflictReason.ConcurrencyConflict =>
                new UserImportConflictResolution.Retry(),

            _ => new UserImportConflictResolution.Skip(),
        };

        return Task.FromResult(resolution);
    }
}
```
