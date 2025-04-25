---
title: Time-Constant String Comparison
description: Learn about implementing secure string comparison to prevent timing attacks in security-sensitive contexts using TimeConstantComparer
sidebar:
  order: 6
redirect_from:
  - /foss/identitymodel/utils/time_constant_comparison/
---

:::note
Starting with .NET Core 2.1 this functionality is built in via
[CryptographicOperations.FixedTimeEquals](https://docs.microsoft.com/en-us/dotnet/api/system.security.cryptography.cryptographicoperations.fixedtimeequals?view=netcore-2.1)
:::

When comparing strings in a security context (e.g. comparing keys), you should avoid
leaking timing information. 

Standard string comparison algorithms are optimized to stop comparing characters as soon
as a difference is found. An attacker can exploit this by making many requests with
strings that all differ in the first character. The strings that begin with an incorrect
first character will make a single character comparison and stop. However, the strings
that begin with a correct first character will need to make additional string comparisons,
and thus take more time before they stop. Sophisticated attackers can measure this
difference and use it to deduce the characters that their input is being compared to.

## Time-Constant String Comparison

```csharp
using System.Security.Cryptography;

// Simulated sensitive data (e.g., a secure token or password hash)
var storedHash = Convert.FromBase64String("HJG3+eXAIoQsNI1ASD2i+If7xhQAEjZLefBWo5pcuDE=");

// Incoming hash to validate (e.g., provided by the user)
var providedHash = Convert.FromBase64String("HJG3+eXAIoQsNI1ASD2i+If7xhQAEjZLefBWo5pcuDE=");

// Compare the two byte sequences using FixedTimeEquals
var isEqual = CryptographicOperations.FixedTimeEquals(storedHash, providedHash);

var result = isEqual
    ? "the hashes match!"
    : "the hashes do not match!";

Console.WriteLine(result);
```

## TimeConstantComparer

The *TimeConstantComparer* class defends against these timing attacks by implementing a
constant-time string comparison. The string comparison is a constant-time operation in the
sense that comparing strings of equal length always performs the same amount of work.

Usage example:

```csharp
using Duende.IdentityModel;

// Simulated sensitive data (e.g., a secure token or password hash)
var storedHash = "HJG3+eXAIoQsNI1ASD2i+If7xhQAEjZLefBWo5pcuDE=";

// Incoming hash to validate (e.g., provided by the user)
var providedHash = "HJG3+eXAIoQsNI1ASD2i+If7xhQAEjZLefBWo5pcuDE=";

// Compare the two byte sequences using FixedTimeEquals
var isEqual = TimeConstantComparer.IsEqual(storedHash, providedHash);
var result = isEqual
    ? "the hashes match!"
    : "the hashes do not match!";

Console.WriteLine(result);
```


 
