---
title: "Token Creation Service"
weight: 50
---

IdentityServer uses an *ITokenCreationService* which is responsible for the creation
of tokens, with the default implementation of *DefaultTokenCreationService*.

```csharp
/// <summary>
/// Logic for creating security tokens
/// </summary>
public interface ITokenCreationService
{
    /// <summary>
    /// Creates a token.
    /// </summary>
    /// <param name="token">The token description.</param>
    /// <returns>A protected and serialized security token</returns>
    Task<string> CreateTokenAsync(Token token);
}
```

Token creation involves taking the *Token* argument and converting it into
a JWT string. During the JWT creation, you have an opportunity to
change the *Token* by adding, removing, or altering properties values.

Common use cases for implementing the *ITokenCreationService* include adding custom claims from a secondary data source, such a profile service, database, or third-party service.

While you could implement an *ITokenCreationService* interface, we recommend you 
inherit and override methods on *DefaultTokenCreationService*, specifically the *CreatePayloadAsync* method.

{{% notice warning %}}
Do not overload your tokens with large amounts of data as it can lead to large JWTs and adversely affect system performance.
{{% /notice %}}

```csharp
public class CustomTokenCreationService : DefaultTokenCreationService
{
    public CustomTokenCreationService(IClock clock, 
        IKeyMaterialService keys,
        IdentityServerOptions options,
        ILogger<DefaultTokenCreationService> logger) 
        : base(clock, keys, options, logger)
    {
    }

    protected override Task<string> CreatePayloadAsync(Token token)
    {
        token.Audiences.Add("custom1");
        return base.CreatePayloadAsync(token);
    }
}
```

After creating your new implementation, be sure to register the type in your application's service collection.

```csharp
builder.Services.AddTransient<ITokenCreationService, CustomTokenCreationService>();
```

IdentityServer will begin to use your new implementation in place of *DefaultTokenCreationService*.