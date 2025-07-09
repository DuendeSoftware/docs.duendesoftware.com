---
title: Epoch Time Conversion
date: 2024-04-17
description: Learn about converting between DateTime and Unix/Epoch time formats in IdentityModel for JWT tokens
sidebar:
  label: "Epoch Time"
  order: 3
  badge:
    text: deprecated
    variant: note
redirect_from:
  - /foss/identitymodel/utils/epoch_time/
---

:::note[Deprecation notice]
Starting with .NET Framework 4.6 and .NET Core 1.0 this functionality is
built-in via
[`DateTimeOffset.FromUnixTimeSeconds`](https://docs.microsoft.com/en-us/dotnet/api/system.datetimeoffset.fromunixtimeseconds)
and
[`DateTimeOffset.ToUnixTimeSeconds`](https://docs.microsoft.com/en-us/dotnet/api/system.datetimeoffset.tounixtimeseconds).

The `DateTimeExtensions` will be removed from Duende IdentityModel in the future.
:::

JSON Web Token (JWT) tokens use so-called [Epoch or Unix time](https://en.wikipedia.org/wiki/Unix_time) to represent
date/times, which is the number of seconds that have elapsed since January 1, 1970 (midnight UTC/GMT).

## DateTimeOffset To Epoch Time :badge[Obsolete]

In .NET, you can convert `DateTimeOffset` to Unix time via the two methods of `ToUnixTimeSeconds` and
`ToUnixTimeMilliseconds`:

```csharp
// EpochTimeExamples.cs
var seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
var milliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
```

## DateTime To Epoch Time :badge[Obsolete]

IdentityModel contains extensions methods for `DateTime` to convert
to/from Unix time:

```csharp
// DateTimeExtensionExample.cs
var dt = DateTime.UtcNow;
// The time returned is in seconds
var unix = dt.ToEpochTime();
```



