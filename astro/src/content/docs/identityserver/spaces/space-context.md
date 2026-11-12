---
title: "Reading And Setting The Current Space"
description: "Read the current space with ISpaceContextAccessor, set it for work outside a request, and look up spaces with ISpaceStore."
date: 2026-11-10
sidebar:
  label: "Current Space"
  order: 30
---

Use `ISpaceContextAccessor` to read or set the space your code runs in. Use `ISpaceStore` to look up spaces by origin,
ID, or pool ID. Both interfaces, and the `SpaceId` type they work with, are in the `Duende.Spaces` namespace.

`UseSpaceResolution()` sets the space for every request, and `ISpaceContextAccessor` is how your code reads it.

## Read The Current Space

To read the space, inject `ISpaceContextAccessor` into your service. It is registered as a singleton and tracks the space
for the current async flow. After `UseSpaceResolution()` runs, the space is set for
everything later in the pipeline. If a space is already set when a request arrives, the middleware keeps it and skips
resolution.

You have three ways to read it. They differ in what happens when no space is set:

| Member                  | Returns                                                     | When no space is set                |
|-------------------------|-------------------------------------------------------------|-------------------------------------|
| `GetSpaceId()`          | The current `SpaceId`.                                      | Throws `InvalidOperationException`. |
| `IsSpaceIdConfigured()` | `true` when a space is set for the current async flow.      | Returns `false`.                    |
| `GetSpaceIdOrDefault()` | The current `SpaceId`, or `SpaceId.Default` if none is set. | Returns `SpaceId.Default`.          |

A request that matches no space never reaches your code. By default,
`UseSpaceResolution()` answers it with a 404. If you set `SpacesOptions.FallbackToDefault` to `true`, a request that
matches no space and has no space path goes to `SpaceId.Default`. A request with a space path that matches no space still
gets a 404.

This endpoint reports the current space and returns a 404 when none is set:

```csharp
// Program.cs
using Duende.Spaces;

app.MapGet("/tenant-info", (ISpaceContextAccessor accessor) =>
{
    if (!accessor.IsSpaceIdConfigured())
    {
        return Results.NotFound();
    }

    return Results.Ok(new { SpaceId = accessor.GetSpaceId().Value });
});
```

## Set The Current Space

To run code in a specific space, call `SetSpace(SpaceId)` and put the work inside a `using` block. `SetSpace` returns an
`IDisposable`, and disposing it restores the space that was set before. The space flows with the async execution context,
so it covers the awaited work inside the block.

Code that doesn't pass through `UseSpaceResolution()`, such as background work, has to set the space itself. When
`SpacesOptions.PartitionDataProtection` is enabled, [Data Protection](/identityserver/spaces/data-protection.md) throws an
`InvalidOperationException` if no space is set.

This job checks that a space exists and then does its work inside that space:

```csharp
// ReportJob.cs
using Duende.Spaces;

public class ReportJob(ISpaceContextAccessor accessor, ISpaceStore store)
{
    public async Task Run(SpaceId spaceId, CancellationToken ct)
    {
        if (await store.TryGetSpace(spaceId, ct) is null)
        {
            return;
        }

        using (accessor.SetSpace(spaceId))
        {
            // Code in this block runs in spaceId.
        }

        // The previous space is restored here.
    }
}
```

Two rules apply to scopes:

* Nested calls restore the outer space when you dispose the inner scope. Dispose scopes in the reverse order that you
  created them. Disposing an outer scope first throws an `InvalidOperationException`.
* `SetSpace` throws when your license doesn't include Spaces.

## Look Up Spaces

`ISpaceStore` reads spaces. It doesn't create or change them, which is what `ISpaceAdmin` is for. It has four methods:

| Method                                                  | Returns                                                                                      |
|---------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `TryResolveSpace(SpaceMatchPattern, CancellationToken)` | A `SpaceResolutionResult` for the enabled space that matches the origin and path, or `null`. |
| `IsOriginClaimed(string, CancellationToken)`            | `true` if any space claims the origin, with or without a path match.                         |
| `TryGetSpace(SpaceId, CancellationToken)`               | The `Space` with that ID, or `null`.                                                         |
| `TryGetSpaceByPoolId(PoolId, CancellationToken)`        | The `Space` assigned to that pool, or `null`.                                                |

The three `Try` methods return `null` when no space matches, when the matching space is disabled, and when it is deleted.
Passing `null` to any method throws an `ArgumentNullException`. For `IsOriginClaimed`, a `null` origin throws an
`ArgumentNullException` and an empty one throws an `ArgumentException`.

All four lookups are cached. The cache entries use `SpacesOptions.LocalCacheExpiration` (30 seconds by default) and
`SpacesOptions.Expiration` (30 minutes by default). `PoolId` is in the `Duende.Storage` namespace.

### Resolve A Space From An Origin And Path

To find the space for an origin and path, pass a `SpaceMatchPattern` to `TryResolveSpace`. The origin includes the scheme
and host, plus the port when it isn't the scheme default. The pattern has to equal one of the match patterns configured on
a space. It is an exact lookup, not a prefix match, and the path doesn't include the `SpacePathPrefix`.

The result has the resolved `SpaceId`. Its `MatchedPath` is the path you passed in, or `null` when you didn't pass one.

```csharp
// SpaceLookupJob.cs
using Duende.Spaces;

public class SpaceLookupJob(ISpaceContextAccessor accessor, ISpaceStore store)
{
    public async Task Run(CancellationToken ct)
    {
        var result = await store.TryResolveSpace(
            new SpaceMatchPattern
            {
                Origin = "https://login.example.com",
                Path = "/acme"
            },
            ct);

        if (result is null)
        {
            return;
        }

        using (accessor.SetSpace(result.SpaceId))
        {
            // Code in this block runs in the resolved space.
        }
    }
}
```

### Find The Space For A Pool

`TryGetSpaceByPoolId` returns the `Space` assigned to a `PoolId`. A `Space` has an `Id`, `Name`, `Enabled`,
`MatchPatterns`, `PoolId`, and `ExtendedProperties`.

```csharp
// PoolLookupJob.cs
using Duende.Spaces;
using Duende.Storage;

public class PoolLookupJob(ISpaceContextAccessor accessor, ISpaceStore store)
{
    public async Task Run(PoolId poolId, CancellationToken ct)
    {
        var space = await store.TryGetSpaceByPoolId(poolId, ct);
        if (space is null)
        {
            return;
        }

        using (accessor.SetSpace(space.Id))
        {
            // Code in this block runs in the space that owns the pool.
        }
    }
}
```

## Well-Known Space IDs

`SpaceId` has two fixed values:

* `SpaceId.Default` is the space for single-tenant scenarios. `GetSpaceIdOrDefault()` returns it when no space is set.
  Storage requests in the Default space use the default storage pool.
* `SpaceId.Management` is the space for cross-space management operations.

`SpaceId.Value` is the underlying `Guid`. You can create or parse IDs in these ways:

* `SpaceId.New()` creates a new ID.
* `SpaceId.Create(string)` parses an ID and throws a `FormatException` when the value isn't valid.
* `SpaceId.TryCreate(string?, out SpaceId?)` parses an ID and returns `false` when the value isn't valid. An overload
  also returns the validation errors.
* `SpaceId.CreateOrDefault(string?)` returns `null` for a `null` or empty string and otherwise behaves like `Create`.
* A `Guid` converts to a `SpaceId` implicitly and throws a `FormatException` when it isn't a valid ID.
