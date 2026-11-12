---
title: "Data Protection In Spaces"
description: "Spaces binds ASP.NET Core Data Protection to the current space, so protected data from one space can't be read in another."
date: 2026-11-10
sidebar:
  label: "Data Protection"
  order: 20
---

Spaces binds [ASP.NET Core Data Protection](/general/data-protection.md) to the current space, so a value protected in
one space can't be unprotected in another. It's on by default (`SpacesOptions.PartitionDataProtection` is `true`).
If you register your own `IDataProtectionProvider`, do it before `AddSpaces`. Call `UseSpaceResolution()` early in the
pipeline, and use `GetUnpartitioned()` for the few values that must be readable from every space.

Spaces wraps the app's `IDataProtectionProvider`. A protector from that provider binds to the space
that is resolved when it protects or unprotects a value. Its purpose chain is `space`, then the space ID, then your own
purposes.

:::caution[Don't turn partitioning off after deployment]
Turning `PartitionDataProtection` off after the host has run with it enabled is unsupported. Data protected while
partitioning was enabled uses the space-specific purpose chain, so it can't be unprotected when that chain isn't there.
:::

To turn partitioning on or off, see [Getting Started With Spaces](/identityserver/spaces/getting-started.md#before-deployment).

## Protecting Data Outside A Resolved Space

Protecting or unprotecting data with no resolved space fails. Spaces throws an `InvalidOperationException` instead of
falling back to a shared key. The message starts with "Data protection was used with no resolved space while
SpacesOptions.PartitionDataProtection is enabled."

Call `UseSpaceResolution()` before any middleware that uses Data Protection. For background work, which has no
request, set the space with `ISpaceContextAccessor.SetSpace(...)` first.

## Reading Older Values In The Default Space

In the Default space, a failed unprotect gets a second chance. If `Unprotect` or `IPersistedDataProtector.DangerousUnprotect`
fails with a `CryptographicException`, Spaces retries with the unpartitioned purpose chain. If the retry also fails,
you get the original exception. On a successful `DangerousUnprotect` fallback, `requiresMigration` is `true`.

The fallback only reads. `Protect` always uses the partitioned purpose chain, and the fallback never applies to the
Management space or to named spaces.

Each successful fallback increments the `duende.spaces.data_protection.default_space_fallback` counter on the
`Duende.Spaces` meter and writes a Debug log entry. The counter has a `duende.spaces.data_protection.operation` tag
with the value `unprotect` or `dangerous_unprotect`.

## Sharing Data Across Spaces

Call `GetUnpartitioned()` on the provider (or on a protector) for data that every space must read, such as signing
keys. Values protected this way are accepted in every space.

Don't use the same purpose chain through both `GetUnpartitioned()` and the partitioned provider. In the Default space,
the fallback would accept the unpartitioned value from both. Spaces has no runtime check for this.

## Which Providers Are Partitioned

Spaces partitions only the non-keyed `IDataProtectionProvider` registration. Keyed
`IDataProtectionProvider` registrations and independently created providers (for example, from
`DataProtectionProvider.Create(...)`) aren't automatically partitioned. Assigning the app's registered provider to
authentication scheme options doesn't remove its partitioning.

Register the provider once, before you call `AddSpaces`. Spaces replaces that registration with a singleton that builds
your original provider once, so how you register it matters:

* A scoped registration isn't supported. `AddSpaces` throws an `InvalidOperationException` whose message starts with
  "IDataProtectionProvider is registered as scoped, which Spaces data protection does not support." Register it as a
  singleton instead.
* A transient registration is accepted and is built once.

`UseSpaceResolution()` checks the registration when you call it, so the app fails at startup if something is wrong. It
throws an `InvalidOperationException` when the provider was registered or replaced after `AddSpaces`, or when more than
one non-keyed provider is registered.

## Wrapping The Provider Or A Protector

If you decorate the provider or a protector, for example to add logging, your wrapper must implement
`IUnpartitionedDataProtectionSource` (in the `Duende.Spaces` namespace) and forward `GetUnpartitioned()` to the
instance it wraps. The partitioned provider and its protectors implement the interface, and `GetUnpartitioned()` uses
it to find the unpartitioned provider. When an object doesn't implement it, `GetUnpartitioned()` returns that object
unchanged. Your wrapper would then be returned as is, and it's still partitioned.

```csharp
// LoggingDataProtectionProvider.cs
using Duende.Spaces;
using Microsoft.AspNetCore.DataProtection;

public class LoggingDataProtectionProvider(IDataProtectionProvider inner, ILogger<LoggingDataProtectionProvider> logger)
    : IDataProtectionProvider, IUnpartitionedDataProtectionSource
{
    public IDataProtector CreateProtector(string purpose)
    {
        logger.LogDebug("Creating protector for {Purpose}", purpose);
        return inner.CreateProtector(purpose);
    }

    public IDataProtectionProvider GetUnpartitioned() => inner.GetUnpartitioned();
}
```

A protector wrapper works the same way: implement the interface and return the inner protector's
`GetUnpartitioned()` result. Calling `GetUnpartitioned()` on an `IDataProtector` throws an `InvalidOperationException`
when the source returns something that isn't an `IDataProtector`.
