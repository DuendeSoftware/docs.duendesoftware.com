---
title: "SAML NameID Generator"
description: "Reference for ISamlNameIdGenerator, NameIdGenerationContext, and NameIdGenerationResult, which create the NameID in SAML assertions."
date: 2026-11-16
sidebar:
  label: "SAML NameID"
  order: 4
---

#### Duende.IdentityServer.Saml.Services.ISamlNameIdGenerator

Generates the SAML `NameID` included in assertions. It is called during assertion generation, after the user authenticated and the `NameID` format was resolved.

```csharp
public interface ISamlNameIdGenerator
{
    Task<NameIdGenerationResult> GenerateAsync(NameIdGenerationContext context, CancellationToken ct);
}
```

## NameIdGenerationContext

```csharp
public sealed class NameIdGenerationContext
{
    public required ClaimsPrincipal Subject { get; init; }
    public required SamlServiceProvider ServiceProvider { get; init; }
    public required string ResolvedFormat { get; init; }
    public string? SPNameQualifier { get; init; }
}
```

## NameIdGenerationResult

```csharp
public sealed class NameIdGenerationResult
{
    public NameId? NameId { get; }
    public SamlError? Error { get; }
    public bool IsError { get; }

    public static NameIdGenerationResult Success(NameId nameId);
    public static NameIdGenerationResult Failure(string statusCode, string subStatusCode, string message);
}
```

`NameId` (namespace `Duende.IdentityServer.Saml`) has `Value`, `Format`, `SPNameQualifier`, and `NameQualifier`, and converts implicitly from `string`. Use [`SamlStatusCodes`](/identityserver/reference/v8/saml/saml-constants.md) for the failure codes, for example `SamlStatusCodes.Responder` and `SamlStatusCodes.UnknownPrincipal`.

```csharp
return Task.FromResult(NameIdGenerationResult.Failure(
    SamlStatusCodes.Responder,
    SamlStatusCodes.UnknownPrincipal,
    "Employee ID claim not found."));
```

## Default behavior

* Email format: uses the claim type from `SamlServiceProvider.EmailNameIdClaimType`, falling back to `SamlOptions.EmailNameIdClaimType` (default `email`).
* Every other format: uses the `sub` claim and echoes `ResolvedFormat`. The default doesn't special-case `persistent` or `transient`.
* On failure, the SP receives a `Responder` / `InvalidNameIDPolicy` status.

## Registration

```csharp
builder.Services.AddScoped<ISamlNameIdGenerator, CustomNameIdGenerator>();
```
