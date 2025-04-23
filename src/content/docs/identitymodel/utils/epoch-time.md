---
title: Epoch Time Conversion
description: Learn about converting between DateTime and Unix/Epoch time formats in IdentityModel for JWT tokens
sidebar:
  order: 3
redirect_from:
  - /foss/identitymodel/utils/epoch_time/
---

:::note
Starting with .NET Framework 4.6 and .NET Core 1.0 this functionality is
built-in via
[DateTimeOffset.FromUnixTimeSeconds](https://docs.microsoft.com/en-us/dotnet/api/system.datetimeoffset.fromunixtimeseconds)
and
[DateTimeOffset.ToUnixTimeSeconds](https://docs.microsoft.com/en-us/dotnet/api/system.datetimeoffset.tounixtimeseconds).
:::

JWT tokens use so-called [Epoch or Unix
time](https://en.wikipedia.org/wiki/Unix_time) to represent date/times.

## DateTimeOffset To Epoch Time

In .NET you can convert `DateTimeOffset` to Unix time via the two methods
of `ToUnixTimeSeconds` and `ToUnixTimeMilliseconds`:

```csharp
var seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
var milliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
```

## DateTime To Epoch Time :badge[obsolete]

IdentityModel contains extensions methods for `DateTime` to convert
to/from Unix time:

```csharp
var dt = DateTime.UtcNow;
var unix = dt.ToEpochTime();
```

The time returned is in seconds.



