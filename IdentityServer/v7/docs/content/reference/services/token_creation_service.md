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

The Token creation service takes the *Token* model and converts it into
a JWT. During the JWT creation, you have one last opportunity to
modify the *Token* by adding, removing, or altering property values. Everyday use cases
for implementing the *ITokenCreationService* include modifying claims, audiences, and more
from a secondary data source, such as a profile service, database, or third-party service.

Note that there are better places within IdentityServer's infrastructure to add
additional claims, such as *IClaimService*, *ITokenService*, and [*IProfileService*]({{< ref "/reference/services/profile_service.md" >}}). We recommend investigating
whether overriding those interfaces would be enough before implementing *ITokenCreationService*.

You can think of each of the services as providing the following functionality:

- *ITokenCreationService* : Serialization of the *Token* model into a JWT
- *ITokenService*: Building the Token using the data model
- *IClaimsService*: Customizing claims on the Token
- *IProfileService*: User-centric profile data used in the Token and UserInfo endpoint


If, after research, you have still decided to implement *ITokenCreationService*, we recommend you
inherit and override methods on *DefaultTokenCreationService*, specifically the *CreatePayloadAsync* method.

{{% notice warning %}}
Do not overload your tokens with large amounts of data, as it can lead to large JWTs and adversely affect system performance.
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

After creating your new implementation, register the type in your application's service collection.

```csharp
builder.Services.AddTransient<ITokenCreationService, CustomTokenCreationService>();
```

IdentityServer will begin to use your new implementation in place of *DefaultTokenCreationService*.