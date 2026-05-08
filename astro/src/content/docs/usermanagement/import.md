---
title: Import Data into User Management
description: Import users, roles, and authenticators from external systems or other identity providers using the IUserImporter API.
sidebar:
  label: Importing Data
  order: 6
---

User Management lets you migrate users, roles, and authenticators from another identity provider,
or seed users from an external system. This is helpful in several scenarios:

* Migrating from ASP.NET Identity or another identity provider
* Seeding users from an HR system, directory service, or CSV export
* Consolidating users from multiple applications into a single identity store

Import works by submitting a batch of `UserImportRecord` objects, with a per-record result indicating
whether a record was created, updated, skipped, or failed. Records in a batch are processed independently,
so a failure on one record does not affect the others.

## Migration Strategies

Before you write any import code, a bit of planning saves you from surprises mid-migration.

### Planning Your Migration

Most migrations involve some combination of user profiles, passwords, and group or role memberships.
For some, all of this data may need to be migrated. Other migrations will be more selective.
A user who authenticated exclusively through an external provider (Google, Entra ID, ...)
often has no password to migrate, for example, and a system that never had roles can skip membership entirely.
Each field on `UserImportRecord` is optional, so you only need to populate what applies.

Passwords deserve special attention. The import system stores pre-hashed passwords verbatim: it does not re-hash
them on the way in. When a user logs in after migration, the system looks up the `algorithmId` stored alongside
the hash, routes the verification call to the matching `IPasswordHashAlgorithm`, and checks
whether `NeedsRehash()` returns `true`. If it does, the password is transparently re-hashed with the current
preferred algorithm. The user notices nothing. This means you need a registered `IPasswordHashAlgorithm` that
understands your source system's hash format.  See [Password Hashing Algorithms](/usermanagement/reference/password-hashing.md)
for how to implement and register one.

A few things to sort out before you start:

* **Groups and roles must exist first.** `MembershipImport` references groups and roles by ID. If a referenced group or role does not exist at import time, the record fails. Create them before you run the import.
* **Decide on batch size.** For small datasets (a few thousand users), a single import call works fine. For larger datasets, process records in chunks of 100 to 500. Smaller batches make it easier to track progress, isolate failures, and resume after an interruption.
* **Test with a small batch.** Run a representative sample of 10 to 20 records before committing to a full migration. Verify that passwords verify correctly, profile attributes land in the right fields, and memberships are assigned as expected.

### Migrating from ASP.NET Identity

If you are moving from Duende IdentityServer with ASP.NET Identity to User Management, see the [ASP.NET Identity Integration](/identityserver/aspnet-identity/) docs for background on how the existing integration works.

ASP.NET Identity stores user data across several tables. The following table shows how each concept maps to User Management's import types:

| ASP.NET Identity | User Management | Notes |
|---|---|---|
| `AspNetUsers.Id` | `UserImportRecord.SubjectId` | You can use the GUID string directly as the subject ID. |
| `AspNetUsers.UserName` | `UserImportRecord.UserName` | |
| `AspNetUsers.Email`, `PhoneNumber`, and other profile columns | `UserImportRecord.ProfileAttributes` | Map each column to a profile attribute using the schema. |
| `AspNetUsers.PasswordHash` | `AuthenticatorImport.Password` | Requires a custom `IPasswordHashAlgorithm` to verify the ASP.NET Identity hash format. See [ASP.NET Identity Password Hashes](#aspnet-identity-password-hashes) for the format details and parsing code. |
| `AspNetUserRoles` + `AspNetRoles` | `MembershipImport.DirectRoles` | Create the roles first using `IRoleAdmin`, then reference them by ID during import. |
| `AspNetUserClaims` | `UserImportRecord.ProfileAttributes` | Claims that represent profile data (name, address, etc.) map to profile attributes. Claims used for authorization decisions map better to roles or groups. |
| `AspNetUserLogins` | `AuthenticatorImport.ExternalAuthenticators` | Each row becomes an `ExternalAuthenticator` with the `LoginProvider` as the provider name and `ProviderKey` as the subject ID. |
| `AspNetUserTokens` | Not imported | Tokens (2FA recovery codes, authenticator keys) are runtime state. For TOTP authenticator keys, use `AuthenticatorImport.TotpAuthenticators` if you have access to the raw secret. Recovery codes can be imported via `AuthenticatorImport.RecoveryCodes`. |

Passwords are the trickiest part of the migration because ASP.NET Identity uses a proprietary binary format for its hashes. You need to register a custom `IPasswordHashAlgorithm` that can verify these hashes, and parse the stored blobs into `HashedPasswordData`. The [ASP.NET Identity Password Hashes](#aspnet-identity-password-hashes) section at the bottom of this page walks through the format and provides a parsing helper you can use directly.

### Batch Processing

You do not have to import every user in a single call. For large datasets, splitting the work into chunks
is more practical. Smaller batches keep memory usage reasonable, make failures easier
to diagnose, and let you checkpoint progress so a crash does not force you to start over.

The key thing that makes batching straightforward is that each record in a batch is processed independently.
If record 47 out of 250 fails, the other 249 still succeed. After each batch completes, inspect `result.Results`
for entries with `Status == UserImportStatus.Failed`, log the `SubjectId` and `Error`, and collect them for a retry pass.

If you expect to re-run the import (for example, after fixing bad source data), configure your conflict resolver
to return `Overwrite` for `ProfileAlreadyExists` and `AuthenticatorAlreadyExists`. That way, re-submitting a record that
was already imported updates it in place rather than failing. This makes the whole process idempotent;
you can run it as many times as you need without worrying about duplicates.

:::note[Conflict Resolution]
A conflict resolver controls what happens when an import record collides with data that already exists in the store.
The default resolver (`DefaultUserImportConflictResolver`) skips most conflicts and retries on concurrency errors,
which is safe for a first-time import but means re-running the same batch will skip every record.

For idempotent re-runs, you need a custom resolver that returns `Overwrite` instead of `Skip`.
See [Conflict Resolution](#conflict-resolution) for the full details and a custom resolver example.
:::

```csharp title="BatchImportService.cs"
public class BatchImportService(IUserImporter importer)
{
    private const int BatchSize = 250;

    public async Task ImportAllAsync(IEnumerable<UserImportRecord> allRecords, CancellationToken ct)
    {
        var failed = new List<UserImportResult>();
        var batch = new List<UserImportRecord>(BatchSize);
        int totalCreated = 0, totalUpdated = 0, totalFailed = 0;

        foreach (var record in allRecords)
        {
            batch.Add(record);

            if (batch.Count < BatchSize)
                continue;

            var result = await importer.ImportAsync(batch, ct);
            totalCreated += result.CreatedCount;
            totalUpdated += result.UpdatedCount;
            totalFailed += result.FailedCount;
            failed.AddRange(result.Results.Where(r => r.Status == UserImportStatus.Failed));
            batch.Clear();
        }

        // Process the final partial batch.
        if (batch.Count > 0)
        {
            var result = await importer.ImportAsync(batch, ct);
            totalCreated += result.CreatedCount;
            totalUpdated += result.UpdatedCount;
            totalFailed += result.FailedCount;
            failed.AddRange(result.Results.Where(r => r.Status == UserImportStatus.Failed));
        }

        Console.WriteLine($"Created: {totalCreated}, Updated: {totalUpdated}, Failed: {totalFailed}");

        foreach (var r in failed)
            Console.WriteLine($"  FAILED {r.SubjectId}: {r.Error}");
    }
}
```

## Importing Users

`IUserImporter` is the entry point for bulk import. It is registered as a transient service automatically
and can be injected anywhere in your application.

```csharp
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

```csharp title="UserImportService.cs"
public class UserImportService(IUserImporter importer, IUserProfileAdmin profileAdmin)
{
    public async Task RunAsync(CancellationToken ct)
    {
        // Build profile attributes using the schema so values are type-validated.
        var schema = await profileAdmin.GetSchemaAsync(ct);

        var aliceAttributes = new AttributeValueCollection();
        aliceAttributes.Set(schema.CreateAttribute(AttributeName.Parse("email"), "alice@example.com"));
        aliceAttributes.Set(schema.CreateAttribute(AttributeName.Parse("display_name"), "Alice"));

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
                    Groups = new[] { new GroupId("admins") },
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
public sealed record PasswordImport(HashedPasswordData Data);
```

`PasswordImport` carries a pre-hashed password from the source system. The platform stores the hash as-is and verifies
it using the `IPasswordHashAlgorithm` registered for the stored algorithm ID. On the first successful authentication,
the password is transparently re-hashed using the current preferred algorithm, so users are migrated to the new hashing
scheme without any disruption.

#### `TotpImport`

```csharp
public sealed record TotpImport(TotpAuthenticatorName Name, PlainBytesTotpKey Key);
```

`TotpImport` carries the raw TOTP secret key from the source system. Provide the key as a `PlainBytesTotpKey`
and a display name for the authenticator.

#### `PasskeyImport`

```csharp
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

Each entry in `Results` corresponds to one input record and reports the outcome for that record.

```csharp
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

| Value | Meaning |
|-------|---------|
| `Created` | The user was successfully created. |
| `Updated` | The user was successfully updated (overwrite conflict resolution was applied). |
| `Skipped` | The user was skipped because a conflict was resolved as `Skip`. |
| `Failed` | The user failed to import due to an error. |

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
public sealed record UserImportConflict
{
    public required UserImportRecord Record { get; init; }
    public required UserImportStep Step { get; init; }
    public required UserImportConflictReason Reason { get; init; }
    public required Exception Exception { get; init; }
}
```

### `UserImportStep` enum

| Value | Meaning |
|-------|---------|
| `Profile` | The user profile creation or update step. |
| `Authenticator` | The authenticator creation or update step. |
| `Membership` | The membership assignment step. |

### `UserImportConflictReason` enum

| Value | Meaning |
|-------|---------|
| `ProfileAlreadyExists` | A user profile with the same subject ID already exists. |
| `ProfileUniqueKeyConflict` | A unique attribute value (including username) on the incoming record already belongs to a different user profile. |
| `AuthenticatorAlreadyExists` | Authenticators for the same subject ID already exist. |
| `AuthenticatorKeyConflict` | The username is already claimed by a different user's authenticators. |
| `ConcurrencyConflict` | An optimistic concurrency conflict occurred. |
| `MembershipAlreadyExists` | A membership record for the same subject ID already exists. |

### `UserImportConflictResolution`

The resolver returns one of three resolutions:

```csharp
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

```csharp title="Program.cs"
builder.Services.AddSingleton<IUserImportConflictResolver, MyConflictResolver>();
```

The following example overwrites existing profiles but skips all other conflicts:

```csharp title="MyConflictResolver.cs"
public class MyConflictResolver : IUserImportConflictResolver
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

## ASP.NET Identity Password Hashes

This section covers the binary format that [ASP.NET Core Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity) uses to store password hashes, and how to parse them into `HashedPasswordData` for import. For background on how custom password hash algorithms work in User Management, see [Password Hashing Algorithms](/usermanagement/reference/password-hashing.md).

### V3 format layout

The `PasswordHash` column in the `AspNetUsers` table contains a base64-encoded blob. After decoding, the V3 format (used by ASP.NET Core Identity 3.x and later) has the following layout:

* 1 byte: format version (`0x01` for V3)
* 4 bytes (big-endian): PRF identifier (0 = SHA1, 1 = SHA256, 2 = SHA512)
* 4 bytes (big-endian): iteration count
* 4 bytes (big-endian): salt length in bytes
* N bytes: salt
* M bytes: PBKDF2 hash output

### Parsing helper

The following method parses a decoded V3 blob into a `HashedPasswordData` that the import system can store:

```csharp
public static HashedPasswordData ParseAspNetIdentityV3Hash(byte[] hashBytes)
{
    // V3 layout: [version(1)][prf(4)][iterations(4)][saltLen(4)][salt(N)][hash(M)]
    var prf = BinaryPrimitives.ReadUInt32BigEndian(hashBytes.AsSpan(1));
    var iterations = (int)BinaryPrimitives.ReadUInt32BigEndian(hashBytes.AsSpan(5));
    var saltLength = (int)BinaryPrimitives.ReadUInt32BigEndian(hashBytes.AsSpan(9));

    var salt = hashBytes[13..(13 + saltLength)];
    var hash = hashBytes[(13 + saltLength)..];

    var prfName = prf switch
    {
        0 => "SHA1",
        1 => "SHA256",
        2 => "SHA512",
        _ => throw new InvalidOperationException($"Unknown PRF: {prf}"),
    };

    return new HashedPasswordData(
        algorithmId: "aspnet-identity-v3",
        hash: hash,
        salt: salt,
        parameters: new Dictionary<string, string>
        {
            ["prf"] = prfName,
            ["iterations"] = iterations.ToString(),
        });
}
```

To use this during import, decode the base64 value from the database and pass the resulting bytes to the helper:

```csharp
var rawBytes = Convert.FromBase64String(aspNetUser.PasswordHash);
var hashedData = ParseAspNetIdentityV3Hash(rawBytes);
var passwordImport = new PasswordImport(hashedData);
```

### Implementing the hash algorithm

You also need to register an `IPasswordHashAlgorithm` with `AlgorithmId = "aspnet-identity-v3"` so the system can verify
these hashes when users log in. Your implementation should:

* Read the `prf` and `iterations` parameters from `HashedPasswordData.Parameters` to reproduce the PBKDF2 derivation.
* Return `true` from `NeedsRehash()` unconditionally, so every user who logs in is transparently migrated to the preferred algorithm.
* Throw `NotSupportedException` from `Hash()`, because you never want to produce new hashes in this format.

See [Password Hashing Algorithms](/usermanagement/reference/password-hashing.md) for a full walkthrough of implementing and
registering a custom algorithm, including a complete example of a read-only legacy algorithm.

For more detail on the ASP.NET Core Identity password hasher internals,
see the [ASP.NET Identity `PasswordHasher` source on GitHub](https://github.com/dotnet/aspnetcore/blob/main/src/Identity/Extensions.Core/src/PasswordHasher.cs).
