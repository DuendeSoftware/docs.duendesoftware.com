---
title: OIDC Client DPoP Support
description: Learn how to use Demonstrating Proof of Possession (DPoP) with OidcClient for enhanced token security
sidebar:
  label: DPoP
  order: 8
---

import { LinkCard } from "@astrojs/starlight/components";

DPoP (Demonstrating Proof of Possession) is an extension to OAuth 2.0 that provides proof-of-possession for access tokens. It binds tokens to a specific cryptographic key, preventing token theft and replay attacks.

<LinkCard
  title="RFC 9449: OAuth 2.0 Demonstrating Proof of Possession"
  href="https://datatracker.ietf.org/doc/html/rfc9449"
  description="The official specification for DPoP"
/>

## Installation

DPoP support is provided by the Extensions package:

```bash
dotnet add package Duende.IdentityModel.OidcClient.Extensions
```

## Quick Start

### 1. Generate a Proof Key

Use the `JsonWebKeys` helper to create a key pair:

```csharp
using Duende.IdentityModel.OidcClient.DPoP;

// Create an RSA key (recommended for most scenarios)
var proofKey = JsonWebKeys.CreateRsaJson();

// Or create an ECDSA key (smaller, faster)
var proofKey = JsonWebKeys.CreateECDsaJson();
```

### 2. Configure DPoP on OidcClientOptions

```csharp
var options = new OidcClientOptions
{
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native.dpop",
    RedirectUri = "app://callback",
    Scope = "openid profile api"
};

// Enable DPoP
options.ConfigureDPoP(proofKey);

var client = new OidcClient(options);
```

### 3. Login and Make API Calls

```csharp
var loginResult = await client.LoginAsync();

if (!loginResult.IsError)
{
    // Create a handler for DPoP-protected API calls
    var handler = client.CreateDPoPHandler(
        proofKey,
        loginResult.RefreshToken
    );

    var apiClient = new HttpClient(handler);
    var response = await apiClient.GetAsync("https://api.example.com/resource");
}
```

## API Reference

### JsonWebKeys

Helper class for generating DPoP proof keys:

| Method | Description |
|--------|-------------|
| `CreateRsa(algorithm)` | Creates an RSA `JsonWebKey` (default: PS256) |
| `CreateRsaJson(algorithm)` | Creates an RSA key as JSON string |
| `CreateECDsa(algorithm)` | Creates an ECDSA `JsonWebKey` (default: ES256) |
| `CreateECDsaJson(algorithm)` | Creates an ECDSA key as JSON string |

:::tip[Key Storage]
Store the generated proof key securely. The same key must be used for the lifetime of the DPoP-bound tokens. If you lose the key, you'll need to obtain new tokens.
:::

### OidcClientExtensions.ConfigureDPoP

Configures the `OidcClient` to use DPoP for token requests:

```csharp
// Using a JSON proof key string
options.ConfigureDPoP(proofKey);

// Using a custom proof token factory
options.ConfigureDPoP(
    proofTokenFactory,
    tokenEndpointInnerHandler,  // Optional: custom handler for token endpoint
    apiInnerHandler             // Optional: custom handler for API calls
);
```

### OidcClientExtensions.CreateDPoPHandler

Creates an HTTP message handler for DPoP-protected API calls:

```csharp
// Using a JSON proof key string
var handler = client.CreateDPoPHandler(proofKey, refreshToken);

// Using a custom proof token factory
var handler = client.CreateDPoPHandler(
    proofTokenFactory,
    refreshToken,
    apiInnerHandler  // Optional: custom inner handler
);
```

### Custom Proof Token Factory

For advanced scenarios, implement `IDPoPProofTokenFactory`:

```csharp
public class CustomProofTokenFactory : IDPoPProofTokenFactory
{
    public DPoPProof CreateProofToken(DPoPProofRequest request)
    {
        // request.Url - The HTTP URL
        // request.Method - The HTTP method (GET, POST, etc.)
        // request.DPoPNonce - Server-provided nonce (if any)
        // request.AccessToken - The access token (for ath claim)

        var proofToken = // ... create JWT proof token

        return new DPoPProof { ProofToken = proofToken };
    }
}
```

#### DPoPProofRequest Properties

| Property | Type | Description |
|----------|------|-------------|
| `Url` | `string` | The HTTP URL of the request |
| `Method` | `string` | The HTTP method (GET, POST, etc.) |
| `DPoPNonce` | `string` | Server-provided nonce value |
| `AccessToken` | `string` | The access token (for `ath` claim binding) |

### ProofTokenMessageHandler

Low-level handler that adds DPoP proof tokens to requests:

```csharp
var handler = new ProofTokenMessageHandler(
    proofTokenFactory,
    innerHandler,
    logger  // Optional: ILogger<ProofTokenMessageHandler>
);
```

## DPoP Extensions for HttpRequestMessage

The `DPoPExtensions` class provides helper methods:

| Method | Description |
|--------|-------------|
| `SetDPoPProofToken(request, proofToken)` | Adds the DPoP header to a request |
| `GetDPoPNonce(response)` | Extracts the DPoP-Nonce from a response |
| `GetDPoPUrl(request)` | Gets the URL for DPoP proof creation |

## Best Practices

1. **Generate keys on device** - Create proof keys locally and store them securely
2. **Use appropriate key type** - RSA (PS256) for broad compatibility, ECDSA (ES256) for performance
3. **Handle nonce requirements** - The handler automatically handles server-provided nonces
4. **Persist keys securely** - Use platform-specific secure storage
