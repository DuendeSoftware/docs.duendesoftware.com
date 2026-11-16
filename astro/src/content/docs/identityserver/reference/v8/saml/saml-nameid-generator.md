---
title: "SAML NameID Generator"
description: "Reference for ISamlNameIdGenerator, NameIdGenerationContext, and NameIdGenerationResult, which create the NameID in SAML assertions."
date: 2026-11-16
sidebar:
  label: "SAML NameID"
  order: 4
---

#### Duende.IdentityServer.Saml.Services.ISamlNameIdGenerator

Generates SAML NameID values for SSO responses. The built-in handling generates an email NameID for the email format and uses the `sub` claim for every other format, including persistent and transient. Register a custom implementation if a service provider needs a different value, for example a pairwise identifier for the persistent format or a session-scoped identifier for the transient format. It's called for an assertion after the user authenticates and the `NameID` format is resolved.

```csharp
public interface ISamlNameIdGenerator
{
    Task<NameIdGenerationResult> GenerateAsync(NameIdGenerationContext context, CancellationToken ct);
}
```

`GenerateAsync` generates a NameID for the given context.

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

Context provided to `ISamlNameIdGenerator` for NameID generation.

| Property | Description |
|---|---|
| `Subject` | The authenticated subject. |
| `ServiceProvider` | The SAML service provider requesting the assertion. |
| `ResolvedFormat` | The resolved NameID format (after applying priority: request → SP default → unspecified). |
| `SPNameQualifier` | `SPNameQualifier` from the `AuthnRequest` `NameIDPolicy`, if present. |

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

Result of NameID generation, representing either a successful `NameId` or a SAML protocol error.

| Member | Description |
|---|---|
| `NameId` | The generated NameID, or null if generation failed. |
| `Error` | The error, or null if generation succeeded. |
| `IsError` | Whether this result represents an error. |
| `Success` | Creates a successful result. |
| `Failure` | Creates a failure result with SAML error status codes. |

`NameId` (namespace `Duende.IdentityServer.Saml`) is the Saml `NameIDType`. It converts implicitly from `string`, which creates a `NameId` with the string supplied as value.

| Property | Description |
|---|---|
| `Value` | The value, i.e. string contents of the XML node. |
| `Format` | A URI reference representing the classification of string-based identifier information. |
| `SPNameQualifier` | Optionally qualifies a name identifier in the namespace of a service provider or affiliation of providers. |
| `NameQualifier` | The security or administrative domain that qualifies the name. |

Use [`SamlStatusCodes`](/identityserver/reference/v8/saml/saml-constants.md) for the failure codes, for example `SamlStatusCodes.Responder` and `SamlStatusCodes.UnknownPrincipal`.

```csharp
return Task.FromResult(NameIdGenerationResult.Failure(
    SamlStatusCodes.Responder,
    SamlStatusCodes.UnknownPrincipal,
    "Employee ID claim not found."));
```

## Default behavior

Default implementation of `ISamlNameIdGenerator` that generates an email NameID for the email format and uses the `sub` claim for every other format.

* Email format: uses the claim type from `SamlServiceProvider.EmailNameIdClaimType`, falling back to `SamlOptions.EmailNameIdClaimType` (default `email`).
* Every other format: uses the `sub` claim and echoes `ResolvedFormat`, including for `persistent` and `transient`.
* On failure, the default implementation returns `Responder` / `InvalidNameIDPolicy` status codes with a message. The default `ISaml2SsoResponseGenerator` uses only the message: the user sees the IdentityServer error page and no SAML error response is sent to the SP.

## Registration

```csharp
builder.Services.AddScoped<ISamlNameIdGenerator, CustomNameIdGenerator>();
```
