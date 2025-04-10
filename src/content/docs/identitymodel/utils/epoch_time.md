---
title: Epoch Time Conversion
sidebar:
  order: 3
---

JWT tokens use so-called [Epoch or Unix
time](https://en.wikipedia.org/wiki/Unix_time) to represent date/times.

IdentityModel contains extensions methods for `DateTime` to convert
to/from Unix time:

```csharp
var dt = DateTime.UtcNow;
var unix = dt.ToEpochTime();
```

:::note
Starting with .NET Framework 4.6 and .NET Core 1.0 this functionality is
built-in via
[DateTimeOffset.FromUnixTimeSeconds](https://docs.microsoft.com/en-us/dotnet/api/system.datetimeoffset.fromunixtimeseconds)
and
[DateTimeOffset.ToUnixTimeSeconds](https://docs.microsoft.com/en-us/dotnet/api/system.datetimeoffset.tounixtimeseconds).
:::

