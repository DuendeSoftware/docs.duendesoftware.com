---
title: "Authorization based on Scopes and Claims"
description: "Guide for implementing authorization using scope claims and ASP.NET Core authorization policies with IdentityServer access tokens"
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Authorization
  order: 30
redirect_from:
  - /identityserver/v5/apis/aspnetcore/authorization/
  - /identityserver/v6/apis/aspnetcore/authorization/
  - /identityserver/v7/apis/aspnetcore/authorization/
---

The access token will include additional claims that can be used for authorization, e.g. the `scope` claim will reflect the scope the client requested (and was granted) during the token request.

In ASP.NET core, the contents of the JWT payload get transformed into claims and packaged up in a `ClaimsPrincipal`. So you can always write custom validation or authorization logic in C#:

```csharp
public IActionResult Get()
{
    var isAllowed = User.HasClaim("scope", "read");

    // rest omitted
}
```

For better encapsulation and re-use, consider using the ASP.NET Core [authorization policy](https://docs.microsoft.com/en-us/aspnet/core/security/authorization/policies) feature.

With this approach, you would first turn the claim requirement(s) into a named policy:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("read_access", policy =>
        policy.RequireClaim("scope", "read"));
});
```

...and then enforce it, e.g. using the routing table:

```csharp
app.MapControllers().RequireAuthorization("read_access");
```

...or imperatively inside the endpoint handler:

```csharp
app.MapGet("/", async (IAuthorizationService authz, ClaimsPrincipal user) =>
{
    var allowed = await authz.AuthorizeAsync(user, "read_access");

    if (!allowed.Succeeded)
    {
        return Results.Forbid();
    }

    // rest omitted
});
```

... or declaratively:

```csharp
app.MapGet("/", () =>
{
    // rest omitted
}).RequireAuthorization("read_access");
```

#### Scope Claim Format

Historically, Duende IdentityServer emitted the `scope` claims as an array in the JWT. This works very well with the .NET deserialization logic, which turns every array item into a separate claim of type `scope`.

The newer *JWT Profile for OAuth* [spec](/identityserver/overview/specs.md) mandates that the scope claim is a single space delimited string. You can switch the format by setting the `EmitScopesAsSpaceDelimitedStringInJwt` on the [options](/identityserver/reference/options.md). But this means that the code consuming access tokens might need to be adjusted. The following code can do a conversion to the *multiple claims* format that .NET prefers:

```csharp
namespace IdentityModel.AspNetCore.AccessTokenValidation;

/// <summary>
/// Logic for normalizing scope claims to separate claim types
/// </summary>
public static class ScopeConverter
{
    /// <summary>
    /// Logic for normalizing scope claims to separate claim types
    /// </summary>
    /// <param name="principal"></param>
    /// <returns></returns>
    public static ClaimsPrincipal NormalizeScopeClaims(this ClaimsPrincipal principal)
    {
        var identities = new List<ClaimsIdentity>();

        foreach (var id in principal.Identities)
        {
            var identity = new ClaimsIdentity(id.AuthenticationType, id.NameClaimType, id.RoleClaimType);

            foreach (var claim in id.Claims)
            {
                if (claim.Type == "scope")
                {
                    if (claim.Value.Contains(' '))
                    {
                        var scopes = claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries);

                        foreach (var scope in scopes)
                        {
                            identity.AddClaim(new Claim("scope", scope, claim.ValueType, claim.Issuer));
                        }
                    }
                    else
                    {
                        identity.AddClaim(claim);
                    }
                }
                else
                {
                    identity.AddClaim(claim);
                }
            }

            identities.Add(identity);
        }

        return new ClaimsPrincipal(identities);
    }
}
```

The above code could then be called as an extension method or as part of [claims transformation](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.iclaimstransformation).
