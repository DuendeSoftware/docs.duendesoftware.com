---
title: "BFF User Endpoint Extensibility"
date: 2022-12-30 10:55:24
sidebar:
  label: "User"
  order: 50
redirect_from:
  - /bff/v2/extensibility/management/user/
  - /bff/v3/extensibility/management/user/
  - /identityserver/v5/bff/extensibility/management/user/
  - /identityserver/v6/bff/extensibility/management/user/
  - /identityserver/v7/bff/extensibility/management/user/
---

The BFF user endpoint can be customized by implementing the `IUserEndpoint`. 

## Request Processing 

`ProcessRequestAsync` is the top-level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

For example, you could take whatever actions you need before normal processing of the request like this:

```csharp
public Task ProcessRequestAsync(HttpContext context, CancellationToken ct)
{
    // Custom logic here
}
```

### Enriching User Claims 

There are several ways how you can enrich the claims for a specific user. 

The most robust way would be to implement a custom `IClaimsTransformation`. 

```csharp

services.AddScoped<IClaimsTransformation, CustomClaimsTransformer>();

public class CustomClaimsTransformer : IClaimsTransformation
{
    public Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = (ClaimsIdentity)principal.Identity;

        if (!identity.HasClaim(c => c.Type == "custom_claim"))
        {
            identity.AddClaim(new Claim("custom_claim", "your_value"));
        }

        return Task.FromResult(principal);
    }
}
```

See the [Claims Transformation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/claims?view=aspnetcore-9.0) topic in the ASP.NET Core documentation for more information. 

