---
title: Time-Constant String Comparison
sidebar:
  order: 60
---


When comparing strings in a security context (e.g. comparing keys), you should avoid
leaking timing information. 

Standard string comparison algorithms are optimized to stop comparing characters as soon
as a difference is found. An attacker can exploit this by making many requests with
strings that all differ in the first character. The strings that begin with an incorrect
first character will make a single character comparison and stop. However, the strings
that begin with a correct first character will need to make additional string comparisons,
and thus take more time before they stop. Sophisticated attackers can measure this
difference and use it to deduce the characters that their input is being compared to.

The *TimeConstantComparer* class defends against these timing attacks by implementing a
constant-time string comparison. The string comparison is a constant-time operation in the
sense that comparing strings of equal length always performs the same amount of work.

Usage example:

```csharp
var isEqual = TimeConstantComparer.IsEqual(key1, key2);
```

:::note
Starting with .NET Core 2.1 this functionality is built in via
[CryptographicOperations.FixedTimeEquals](https://docs.microsoft.com/en-us/dotnet/api/system.security.cryptography.cryptographicoperations.fixedtimeequals?view=netcore-2.1)
:::
 