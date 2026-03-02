---
title: Epoch Time Conversion
date: 2025-11-12
description: Learn about converting between DateTime and Unix/Epoch time formats in Duende IdentityModel for JWT tokens
sidebar:
  label: "Epoch Time"
  order: 3
redirect_from:
  - /foss/identitymodel/utils/epoch_time/
---

JSON Web Token (JWT) tokens use so-called [Epoch or Unix time](https://en.wikipedia.org/wiki/Unix_time) to represent
date/times, which is the number of seconds that have elapsed since January 1, 1970 (midnight UTC/GMT).

In .NET, you can convert `DateTimeOffset` to Unix/Epoch time via the two methods of `ToUnixTimeSeconds` and
`ToUnixTimeMilliseconds`:

```csharp
// EpochTimeExamples.cs
var seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
var milliseconds = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
```