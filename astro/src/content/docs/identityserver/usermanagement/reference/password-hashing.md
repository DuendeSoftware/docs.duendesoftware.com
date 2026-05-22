---
title: Password Hashing Algorithms
description: How to configure, extend, and migrate password hashing algorithms in Duende User Management, including the IPasswordHashAlgorithm interface, transparent re-hashing, and custom algorithm registration.
sidebar:
  label: Password Hashing Algorithms
  order: 3
---

Password hashing algorithms improve over time. What was considered strong a decade ago (MD5, SHA-1, even early PBKDF2 iteration counts) may be inadequate today. Applications that have been running for years often carry a mix of hashes: some users have passwords hashed with an older algorithm, others with a newer one. Migrating all users at once is not possible without knowing their plaintext passwords, which you do not have.

User Management solves this with a pluggable hashing system built around `IPasswordHashAlgorithm`. Each stored hash carries an algorithm identifier alongside the hash bytes. When a user logs in successfully, the system checks whether their stored hash was produced by the current preferred algorithm. If not, it transparently re-hashes the plaintext password (which is available at that moment) and stores the updated hash. The user notices nothing; the migration happens silently on next login.

This mechanism is also the extension point for bringing in a custom algorithm, for example to verify passwords originally hashed by a legacy system before migration, or to adopt a memory-hard algorithm such as Argon2 in the future.

## IPasswordHashAlgorithm

`IPasswordHashAlgorithm` is the interface that every hashing algorithm must implement. The built-in PBKDF2-HMAC-SHA-512 implementation uses it, and you can register additional implementations to support legacy hash formats or stronger algorithms.

```csharp
public interface IPasswordHashAlgorithm
{
    // A short, stable identifier stored alongside each hash (e.g. "pbkdf2-sha512").
    // Must be unique across all registered algorithms.
    string AlgorithmId { get; }

    // Hashes a plaintext password and returns the result with all metadata needed to verify it later.
    HashedPasswordData Hash(string password);

    // Returns true if the supplied password matches the stored hash.
    bool Verify(string password, HashedPasswordData data);

    // Returns true if the stored hash should be upgraded (e.g. iteration count is too low).
    // Called after a successful Verify(); triggers transparent re-hashing on next login.
    bool NeedsRehash(HashedPasswordData data);
}
```

`AlgorithmId` is stored in the database alongside every hash. It is how the system routes a verification call to the correct algorithm implementation. Choose a short, stable, human-readable string (for example `"pbkdf2-sha512"` or `"argon2id"`). Once a value is in production it must not change, because existing hashes will no longer be routable.

## HashedPasswordData

`HashedPasswordData` is the data transfer object that travels between the hashing layer and the storage layer. It carries everything needed to verify a password later, including the algorithm identifier, the hash bytes, the salt, and any algorithm-specific parameters (such as iteration count or memory cost):

```csharp
public sealed class HashedPasswordData
{
    // The AlgorithmId of the IPasswordHashAlgorithm that produced this hash.
    public string AlgorithmId { get; }

    // The raw hash bytes.
    public IReadOnlyList<byte> Hash { get; }

    // The random salt used during hashing.
    public IReadOnlyList<byte> Salt { get; }

    // Algorithm-specific parameters, e.g. { "iterations": "210000" }.
    // Stored alongside the hash so that Verify() and NeedsRehash() can read them.
    public IReadOnlyDictionary<string, string> Parameters { get; }
}
```

Storing parameters alongside the hash is what makes transparent migration possible. If you increase the PBKDF2 iteration count from 210,000 to 600,000, existing hashes still carry `"iterations": "210000"` in their `Parameters`. `NeedsRehash()` can read that value and return `true`, triggering a re-hash at the new iteration count on the user's next successful login.

## NeedsRehash(): Transparent Migration

`NeedsRehash()` is called automatically after every successful `Verify()`. If it returns `true`, User Management re-hashes the plaintext password (which is available at login time) using the current preferred algorithm and stores the result. The user is not interrupted.

This covers two migration scenarios:

* **Parameter upgrade within the same algorithm**. The algorithm is the same but the parameters have changed (e.g. higher iteration count). `NeedsRehash()` detects the old parameters and returns `true`.
* **Algorithm replacement**. A new algorithm is registered as the preferred one. The old algorithm's `NeedsRehash()` always returns `true`, so every user is migrated on their next login.

A typical `NeedsRehash()` implementation reads the stored parameters and compares them to the current target values:

```csharp
public bool NeedsRehash(HashedPasswordData data)
{
    // Migrate hashes produced by a different algorithm entirely.
    if (data.AlgorithmId != AlgorithmId)
        return true;

    // Migrate hashes produced with a lower iteration count.
    if (!data.Parameters.TryGetValue("iterations", out var raw) ||
        !int.TryParse(raw, out var storedIterations))
        return true;

    return storedIterations < CurrentIterations;
}
```

## Built-in Algorithm: Pbkdf2Sha512PasswordHashAlgorithm

The default implementation is `Pbkdf2Sha512PasswordHashAlgorithm`. It uses PBKDF2-HMAC-SHA-512 at 210,000 iterations with a 256-bit random salt, following the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2) recommendation. Its `AlgorithmId` is `"pbkdf2-sha512"`.

The iteration count is stored in `HashedPasswordData.Parameters` under the key `"iterations"`. If you increase the iteration count in a future release, `NeedsRehash()` will detect hashes produced at the lower count and transparently upgrade them on next login.

## Implementing a Custom Algorithm

To add a custom algorithm (for example, to verify passwords originally stored by a legacy system), implement `IPasswordHashAlgorithm` and register it with the service provider.

The following example wraps a hypothetical legacy MD5-based hash for read-only verification. It always returns `true` from `NeedsRehash()` so that every user who logs in is immediately migrated to the current preferred algorithm:

```csharp
public class LegacyMd5PasswordHashAlgorithm : IPasswordHashAlgorithm
{
    public string AlgorithmId => "legacy-md5";

    public HashedPasswordData Hash(string password)
    {
        // Legacy algorithm is read-only: new hashes should never be produced here.
        // The preferred algorithm handles all new hashes.
        throw new NotSupportedException(
            "The legacy-md5 algorithm is read-only. Register a preferred algorithm for new hashes.");
    }

    public bool Verify(string password, HashedPasswordData data)
    {
        // Reproduce the legacy hash and compare.
        var inputHash = ComputeLegacyMd5(password, data.Salt.ToArray());
        return CryptographicOperations.FixedTimeEquals(
            inputHash,
            data.Hash.ToArray());
    }

    public bool NeedsRehash(HashedPasswordData data)
    {
        // Always migrate away from this algorithm.
        return true;
    }

    private static byte[] ComputeLegacyMd5(string password, byte[] salt)
    {
        // ... legacy hash logic ...
        throw new NotImplementedException();
    }
}
```

Register the custom algorithm alongside the built-in one. The first registration is treated as the preferred algorithm for new hashes; additional registrations are used only for verification and migration:

```csharp
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(um => um
        .EnableAuthentication(auth =>
        {
            auth.Configure(options =>
            {
                // Preferred algorithm for all new hashes.
                options.Passwords.PasswordHashAlgorithm =
                    new Pbkdf2Sha512PasswordHashAlgorithm();
            });
        })
    );

// Register the legacy algorithm so existing hashes can still be verified.
builder.Services.AddSingleton<IPasswordHashAlgorithm, LegacyMd5PasswordHashAlgorithm>();
```

Once all users have logged in at least once, their hashes will have been migrated to the preferred algorithm. At that point the legacy registration can be removed.
