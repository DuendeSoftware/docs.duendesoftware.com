---
title: "Authorization based on Scopes and other Claims"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

The access token will include additional claims that can be used for authorization, e.g. the *scope* claim will reflect the scope the client requested (and was granted) during the token request.

In ASP.NET core, the contents of the JWT payload get transformed into claims and packaged up in a *ClaimsPrincipal*. So you can always write custom validation or authorization logic in C#:

```cs
public IActionResult Get()
{
    var isAllowed = User.HasClaim("scope", "read");

    // rest omitted
}
```

For better encapsulation and re-use, consider using the ASP.NET Core [authorization policy](https://docs.microsoft.com/en-us/aspnet/core/security/authorization/policies) feature.

With this approach, you would first turn the claim requirement(s) into a named policy:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthorization(options =>
    {
        options.AddPolicy("read_access", policy =>
            policy.RequireClaim("scope", "read"));
    });
}
```

..and then enforce it, e.g. using the routing table:

```cs
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers().RequireAuthorization("read_access");
    });
```

...or imperatively inside the controller:

```cs
public class DataController : ControllerBase
{
    IAuthorizationService _authz;

    public DataController(IAuthorizationService authz)
    {
        _authz = authz;
    }

    public async Task<IActionResult> Get()
    {
        var allowed = _authz.CheckAccess(User, "read_access");

        // rest omitted
    }
}
```

... or declaratively:

```cs
public class DataController : ControllerBase
{
    [Authorize("read_access")]
    public async Task<IActionResult> Get()
    {
        var allowed = authz.CheckAccess(User, "read_access");

        // rest omitted
    }
}
```

#### Scope claim format
Historically, Duende IdentityServer emitted the *scope* claims as an array in the JWT. This works very well with the .NET deserialization logic, which turns every array item into a separate claim of type *scope*.

The newer *JWT Profile for OAuth* [spec]({{< ref "/overview/specs" >}}) mandates that the scope claim is a single space delimited string. You can switch the format by setting the *EmitScopesAsSpaceDelimitedStringInJwt* on the [options]({{< ref "/reference/options" >}}). But this means that the code consuming access tokens might need to be adjusted. The following code can do a conversion to the *multiple claims* format that .NET prefers:

```cs
namespace IdentityModel.AspNetCore.AccessTokenValidation
{
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
}
```

The above code could then be called as an extension method or as part of [claims transformation](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.iclaimstransformation).
