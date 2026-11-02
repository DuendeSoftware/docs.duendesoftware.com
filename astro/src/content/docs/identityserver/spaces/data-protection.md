---
title: "Data Protection In Spaces"
description: "How Spaces partitions ASP.NET Core Data Protection by space, including the Default space fallback, failures outside a resolved space, and which providers are partitioned."
date: 2026-11-02
sidebar:
  label: "Data Protection"
  order: 20
---

Spaces partitions [ASP.NET Core Data Protection](/general/data-protection.md) by space when
`SpacesOptions.PartitionDataProtection` is `true`, which is the default. A protector created from the app's
`IDataProtectionProvider` binds to the space that is resolved when it protects or unprotects a value. A value protected
in one space can't be unprotected in another. Use `GetUnpartitioned()` on the provider for data that must be readable
from every space.

This page describes how partitioning behaves at runtime and where its limits are. To turn partitioning on or off, see
[Getting Started With Spaces](/identityserver/spaces/getting-started.md#before-deployment).

## Protecting Data Outside A Resolved Space

If `IDataProtector.Protect` or `IDataProtector.Unprotect` runs with no resolved space, Spaces throws an
`InvalidOperationException` instead of falling back to a shared key. The message starts with "Data protection was used
with no resolved space while SpacesOptions.PartitionDataProtection is enabled."

To avoid this:

* Call `UseSpaceResolution()` before any middleware that uses Data Protection.
* Run background work inside `ISpaceContextAccessor.SetSpace(...)`.

## Default Space Fallback

Values protected before you enabled partitioning use the unpartitioned purpose chain. To keep those values readable,
Spaces retries a failed unprotect in the Default space:

* When unprotecting fails with a `CryptographicException` in the Default space, Spaces retries with the unpartitioned
  purpose chain.
* The fallback only applies to reads. Spaces always protects new values with the partitioned purpose chain.
* The fallback never applies to the Management space or to named spaces.

Each successful fallback increments the `duende.spaces.data_protection.default_space_fallback` counter on the
`Duende.Spaces` meter. Use it to see whether values protected before partitioning are still being read.

Never use the same purpose chain through both `GetUnpartitioned()` and the partitioned provider. In the Default space,
the fallback would accept the unpartitioned value. Spaces doesn't check for this.

## Which Providers Are Partitioned

Spaces only partitions the non-keyed `IDataProtectionProvider` registration. These are not partitioned:

* Keyed `IDataProtectionProvider` registrations.
* Providers you create yourself, for example with `DataProtectionProvider.Create(...)`, and assign to an
  authentication scheme's options, such as `CookieAuthenticationOptions.DataProtectionProvider`.

If you assign the app's registered `IDataProtectionProvider` to a scheme's options, that scheme still uses the
partitioned provider. Assigning it doesn't make the scheme's cookies readable across spaces.

Register the provider once, as a singleton, before you call `AddSpaces`. `UseSpaceResolution()` throws at startup when
the provider was registered or replaced after `AddSpaces`, or when more than one provider is registered.
