---
title: "Using JWTs"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

By default, Duende IdentityServer uses the JSON Web Token ([JWT](http://tools.ietf.org/html/rfc7519)) format for creating access tokens.

Every relevant platform today has support for validating JWT tokens, a good list of JWT libraries can be found [here](https://jwt.io). On .NET, you typically use either the [ASP.NET Core](https://www.nuget.org/packages/Microsoft.AspNetCore.Authentication.JwtBearer) or [Katana](https://www.nuget.org/packages/Microsoft.Owin.Security.Jwt) library.

## Validating a JWT token
If all you care about, is making sure that an access token comes from your trusted IdentityServer, the following snippet shows the typical JWT validation configuration for ASP.NET Core:

```cs
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                // base-address of your identityserver
                options.Authority = "https://demo.duendesoftware.com";

                // audience is optional, make sure you read the following paragraphs
                // to understand your options
                options.TokenValidationParameters.ValidateAudience = false;

                // it's recommended to check the type header to avoid "JWT confusion" attacks
                options.TokenValidationParameters.ValidTypes = new[] { "at+jwt" };
            });
    }
}
```

{{% notice note %}}
On .NET Core 3.1 you need to manually reference the [System.IdentityModel.Tokens.Jwt](https://www.nuget.org/packages/System.IdentityModel.Tokens.Jwt/5.6.0) Nuget package version 5.6 to be able to check the type header.
{{% /notice %}}

## Adding additional validation
Simply making sure that the token is coming from a trusted issuer is not good for most cases.
In more complex systems, you will have multiple resources and multiple clients. Not every client might be authorized to access every resource.

In OAuth there are two complementary mechanisms to embed more information about the "functionality" that the token is for - *audience* and *scope* (see [defining resources]({{< ref "/fundamentals/resources" >}}) for more information).

### Validation using Audience
If you designed your APIs around the concept of [API resources]({{< ref "/reference/api_resource" >}}), your IdentityServer will emit the *aud* claim by default (*api1* in this example):

```json
{
    "typ": "at+jwt",
    "kid": "123"
}.
{
    "aud": "api1",

    "client_id": "mobile_app",
    "sub": "123",
    "scope": "read write delete"
}
```

If you want to express in your API, that only access tokens for the *api1* audience are accepted, change the above code snippet to:

```cs
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = "https://demo.duendesoftware.com";
                options.Audience = "api1";

                options.TokenValidationParameters.ValidTypes = new[] { "at+jwt" };
            });
    }
}
```

### Validation/Authorization using Scope (or other claims)
The access token will include additional claims that can be used for authorization, e.g. the *scope* claim will reflect the scope the client requested (and was granted) during the token request.

In ASP.NET core, the contents of the JWT payload get transformed into claims and packaged up in a *ClaimsPrincipal*. So you can always write custom validation or authorization logic in C#:

```cs
public IActionResult Get()
{
    var isAllowed = User.HasClaim("scope", "read");

    // rest omitted
}
```

For better encapsulation and re-use, consider using the ASP.NET Core [authorization policy](https://docs.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-3.1) feature.

With this approach, you would first turn the claim requirement(s) into a named policy:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthorization(options =>
    {
        options.AddPolicy("read_access", policy =>
            policy.RequirementClaim("scope", "read");
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