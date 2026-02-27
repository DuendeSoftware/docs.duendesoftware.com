---
title: "User Endpoint Claims Enrichment"
description: Documentation for the IUserEndpointClaimsEnricher interface which allows enriching or replacing the claims returned from the BFF user endpoint.
sidebar:
  label: User Claims
  order: 20
  badge:
    text: New
    variant: tip
---

The `IUserEndpointClaimsEnricher` interface allows you to enrich or replace the claims returned from the
[BFF user endpoint](/bff/apis/local/). This is useful when you need to add custom claims derived from
external data sources, including data fetched using the user's access token.

## Comparison with IClaimsTransformation

ASP.NET Core's built-in `IClaimsTransformation` runs _during_ the authentication process, before a fully
authenticated principal is available. This means you cannot use the access token at that point to call
external APIs.

`IUserEndpointClaimsEnricher` runs _after_ authentication is complete and gives you access to the full
`AuthenticateResult`, including the access token. This makes it possible to call downstream APIs using
`AccessTokenManagement` to fetch additional user data.

## Interface

```csharp
namespace Duende.Bff.Endpoints;

public interface IUserEndpointClaimsEnricher
{
    /// <summary>
    /// Enrich the claims for the user endpoint. You can return the same claims,
    /// a modified set of claims, or completely new claims.
    /// </summary>
    /// <param name="authenticateResult">The result from the authentication endpoint.</param>
    /// <param name="claims">The current set of claims to be returned.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The updated list of claims.</returns>
    Task<IReadOnlyList<ClaimRecord>> EnrichClaimsAsync(
        AuthenticateResult authenticateResult,
        IReadOnlyList<ClaimRecord> claims,
        CancellationToken ct = default);
}
```

## Registration

Register your implementation via the DI container:

```csharp
builder.Services.AddTransient<IUserEndpointClaimsEnricher, MyClaimsEnricher>();
```

## Example Implementation

```csharp
public class MyClaimsEnricher : IUserEndpointClaimsEnricher
{
    public async Task<IReadOnlyList<ClaimRecord>> EnrichClaimsAsync(
        AuthenticateResult authenticateResult,
        IReadOnlyList<ClaimRecord> claims,
        CancellationToken ct = default)
    {
        var enriched = claims.ToList();

        // Add a custom claim
        enriched.Add(new ClaimRecord("custom_claim", "custom_value"));

        // You can also access the access token from the AuthenticateResult
        // to call downstream APIs for additional user data:
        // var token = authenticateResult.Properties?.GetTokenValue("access_token");

        return enriched;
    }
}
```
