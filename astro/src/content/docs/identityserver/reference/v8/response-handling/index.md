---
title: Response Generators
description: An overview of IdentityServer's response generation pattern and customization options for protocol endpoint responses.
sidebar:
  order: 1
  label: Overview
redirect_from:
  - /identityserver/v5/reference/response_handling/
  - /identityserver/v6/reference/response_handling/
  - /identityserver/reference/response-handling/
---

IdentityServer's endpoints follow a pattern of abstraction in which a response generator uses a validated input model to produce a response model. The response model is a type that represents the data that will be returned from the endpoint. The response model is then wrapped in a result model, which is a type that facilitates serialization by an implementation of `IHttpResponseWriter`.

Customization of protocol endpoint responses is possible in both the response generators and response writers. Response generator customization is appropriate when you want to change the "business logic" of an endpoint and is typically accomplished by overriding virtual methods in the default response generator. Response writer customization is appropriate when you want to change the serialization, encoding, or headers of the HTTP response and is accomplished by registering a custom implementation of the `IHttpResponseWriter`.

## Available Response Generators

| Interface | Default Implementation | Endpoint |
|-----------|----------------------|----------|
| `IAuthorizeInteractionResponseGenerator` | `AuthorizeInteractionResponseGenerator` | Authorize |
| `IAuthorizeResponseGenerator` | `AuthorizeResponseGenerator` | Authorize |
| `ITokenResponseGenerator` | `TokenResponseGenerator` | Token |
| `IDiscoveryResponseGenerator` | `DiscoveryResponseGenerator` | Discovery |
| `IIntrospectionResponseGenerator` | `IntrospectionResponseGenerator` | Introspection |
| `ITokenRevocationResponseGenerator` | `TokenRevocationResponseGenerator` | Revocation |
| `IUserInfoResponseGenerator` | `UserInfoResponseGenerator` | UserInfo |
| `IDeviceAuthorizationResponseGenerator` | `DeviceAuthorizationResponseGenerator` | Device Authorization |
| `IBackchannelAuthenticationResponseGenerator` | `BackchannelAuthenticationResponseGenerator` | CIBA |
| `IPushedAuthorizationResponseGenerator` | `PushedAuthorizationResponseGenerator` | Pushed Authorization |

## Customization Pattern

To customize a response generator, inherit from the default implementation and override its virtual methods:

```csharp
public class CustomTokenResponseGenerator : TokenResponseGenerator
{
    public CustomTokenResponseGenerator(
        ITokenService tokenService,
        IRefreshTokenService refreshTokenService,
        IScopeParser scopeParser,
        IResourceStore resources,
        IClientStore clients,
        ILogger<TokenResponseGenerator> logger)
        : base(tokenService, refreshTokenService, scopeParser, resources, clients, logger)
    {
    }

    protected override async Task<TokenResponse> ProcessAuthorizationCodeRequestAsync(
        TokenRequestValidationResult request, CancellationToken ct)
    {
        var response = await base.ProcessAuthorizationCodeRequestAsync(request, ct);
        // Add custom response parameters
        response.Custom["custom_field"] = "custom_value";
        return response;
    }
}
```

Register your custom implementation:

```csharp
builder.Services.AddTransient<ITokenResponseGenerator, CustomTokenResponseGenerator>();
```
