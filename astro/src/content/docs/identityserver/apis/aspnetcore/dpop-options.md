---
title: "DPoP Validation Options"
description: "Reference for configuring DPoP proof token validation in ASP.NET Core APIs using the Duende.AspNetCore.Authentication.JwtBearer library"
date: 2026-09-29T00:00:00+02:00
sidebar:
  label: DPoP Options
  order: 45
---

The `Duende.AspNetCore.Authentication.JwtBearer` library adds [DPoP](/identityserver/tokens/pop.md) proof token
validation to the ASP.NET Core JWT bearer authentication handler. This page describes how to register the library
and the options you can use to configure it. For background on why and when to validate DPoP tokens, see
[Validating Proof-of-Possession](/identityserver/apis/aspnetcore/confirmation.md#validating-dpop).

:::note
This library is not the same as Microsoft's `Microsoft.AspNetCore.Authentication.JwtBearer` package. It builds on top
of it: you configure the regular JWT bearer handler as usual, then layer DPoP validation onto that scheme.
:::

## Installation And Setup

```bash
dotnet add package Duende.AspNetCore.Authentication.JwtBearer
```

Call `ConfigureDPoPTokensForScheme` with the name of an existing JWT bearer authentication scheme. Replay detection is
enabled by default and requires a keyed `HybridCache` registration (see [Replay Detection](#replay-detection)):

```csharp
// Program.cs
using Duende.AspNetCore.Authentication.JwtBearer.DPoP;

builder.Services.AddAuthentication("token")
    .AddJwtBearer("token", options =>
    {
        options.Authority = "https://demo.duendesoftware.com";
        options.TokenValidationParameters.ValidateAudience = false;
        options.MapInboundClaims = false;
        options.TokenValidationParameters.ValidTypes = ["at+jwt"];
    });

// layers DPoP validation onto the "token" scheme
builder.Services.ConfigureDPoPTokensForScheme("token", options =>
{
    options.AllowBearerTokens = false;
    options.ProofTokenExpirationMode = DPoPProofExpirationMode.IssuedAt;
});

// cache used for DPoP proof replay detection
builder.Services.AddKeyedHybridCache(ServiceProviderKeys.ProofTokenReplayHybridCache);
```

`DPoPOptions` are named options, keyed by the authentication scheme name. If you use the overload without a
configuration delegate, you can still configure the options for that scheme later:

```csharp
builder.Services.ConfigureDPoPTokensForScheme("token");
builder.Services.Configure<DPoPOptions>("token", options =>
{
    options.ProofTokenLifetime = TimeSpan.FromSeconds(10);
});
```

## DPoPOptions

| Option                           | Default                            | Description                                                                                                                                                                                                                                                                                                    |
|----------------------------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `AllowBearerTokens`              | `false`                            | When `true`, the scheme accepts both `Bearer` and `DPoP` access tokens. When `false`, only DPoP tokens are accepted. Enable this during a migration period where not all clients use DPoP yet.                                                                                                                  |
| `ProofTokenLifetime`             | 5 seconds                          | How long a proof token is considered valid, measured from its `iat` claim and/or the server-issued nonce (see `ProofTokenExpirationMode`).                                                                                                                                                                     |
| `ProofTokenExpirationMode`       | `DPoPProofExpirationMode.IssuedAt` | Controls how proof token expiration is validated. See [Proof Token Expiration](#proof-token-expiration).                                                                                                                                                                                                         |
| `ProofTokenIssuedAtClockSkew`    | 25 seconds                         | Clock skew tolerance applied when validating the client-supplied `iat` claim. Since the `iat` value comes from the client's clock, this tolerance is relatively large.                                                                                                                                          |
| `ProofTokenNonceClockSkew`       | 5 seconds                          | Clock skew tolerance applied when validating the server-issued nonce. The nonce is created by the API itself, so only skew between API instances needs to be accounted for.                                                                                                                                     |
| `ProofTokenMaxLength`            | 4000                               | Maximum allowed length (in characters) of a DPoP proof token. Longer proofs are rejected to prevent resource-exhaustion attacks.                                                                                                                                                                                 |
| `ProofTokenValidationParameters` | See below                          | The `TokenValidationParameters` used to validate the proof token JWT.                                                                                                                                                                                                                                          |
| `EnableReplayDetection`          | `true`                             | Caches the `jti` of each proof token and rejects proofs that were already used. Requires a keyed `HybridCache` registration. See [Replay Detection](#replay-detection).                                                                                                                                          |

### ProofTokenValidationParameters

By default, proof tokens are validated with the following settings:

* `ValidTypes` is set to `dpop+jwt`.
* Audience and issuer validation are disabled, as a DPoP proof does not contain these.
* Lifetime validation is disabled, as expiration is validated separately using the `iat` claim, a server-issued
  nonce, or both.
* `ValidAlgorithms` allows `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384` and `ES512`.

You can modify these, for example to restrict the allowed signing algorithms:

```csharp
builder.Services.ConfigureDPoPTokensForScheme("token", options =>
{
    options.ProofTokenValidationParameters.ValidAlgorithms =
    [
        SecurityAlgorithms.EcdsaSha256
    ];
});
```

## Proof Token Expiration

The `ProofTokenExpirationMode` option accepts one of the following `DPoPProofExpirationMode` values:

* **`IssuedAt`** (default): expiration is validated using the `iat` claim in the proof token, allowing for
  `ProofTokenIssuedAtClockSkew`. This requires no extra round-trips, but relies on the client's clock being reasonably
  accurate.
* **`Nonce`**: expiration is validated using a nonce issued by the API, allowing for `ProofTokenNonceClockSkew`.
  When a proof has no nonce, or the nonce is invalid or expired, the API responds with a `401` including a
  `use_dpop_nonce` error and a fresh nonce in the `DPoP-Nonce` response header. The client must retry the request
  with a new proof containing that nonce. This removes the dependency on the client's clock, at the cost of an extra
  round-trip.
* **`Both`**: both the `iat` claim and the server-issued nonce are validated.

Client libraries such as [Duende.AccessTokenManagement](/accesstokenmanagement/advanced/dpop.md) handle the nonce
retry automatically.

### Custom Nonce Validation

The default nonce implementation encodes the issue time using ASP.NET Core
[Data Protection](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction). When you run
multiple instances of your API behind a load balancer, make sure Data Protection keys are shared between instances,
or nonces created by one instance will be rejected by another.

To change how nonces are created and validated, implement `IDPoPNonceValidator` and register it before calling
`ConfigureDPoPTokensForScheme`:

```csharp
public class CustomNonceValidator : IDPoPNonceValidator
{
    public string CreateNonce(DPoPProofValidationContext context)
    {
        // create and return a nonce value for the client
    }

    public NonceValidationResult ValidateNonce(DPoPProofValidationContext context, string? nonce)
    {
        // return NonceValidationResult.Valid, Missing, or Invalid
    }
}
```

```csharp
builder.Services.AddTransient<IDPoPNonceValidator, CustomNonceValidator>();
builder.Services.ConfigureDPoPTokensForScheme("token");
```

## Replay Detection

When `EnableReplayDetection` is `true` (the default), the `jti` of every accepted proof token is stored in a cache for
the proof token lifetime plus clock skew, and proofs that reuse a `jti` are rejected.

The cache is resolved as a keyed `HybridCache` service, using the `ServiceProviderKeys.ProofTokenReplayHybridCache`
key. If replay detection is enabled and no such cache is registered, an `InvalidOperationException` is thrown when a
DPoP proof is validated. Register the cache as follows:

```csharp
builder.Services.AddKeyedHybridCache(ServiceProviderKeys.ProofTokenReplayHybridCache);
```

`HybridCache` uses an in-memory cache by default, and also uses an `IDistributedCache` as a second-level cache when one
is registered. When your API runs on multiple instances, register a distributed cache (for example, Redis) so replayed
proofs are detected across instances. See the
[Microsoft documentation on HybridCache](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid)
for details.

If you do not need replay detection, disable it:

```csharp
builder.Services.ConfigureDPoPTokensForScheme("token", options =>
{
    options.EnableReplayDetection = false;
});
```
