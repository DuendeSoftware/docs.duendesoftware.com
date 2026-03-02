---
title: "Validating Proof-of-Possession"
description: "Guide for validating Proof-of-Possession (PoP) access tokens in ASP.NET Core using mTLS or DPoP mechanisms"
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Validate PoP
  order: 40
redirect_from:
  - /identityserver/v5/apis/aspnetcore/confirmation/
  - /identityserver/v6/apis/aspnetcore/confirmation/
  - /identityserver/v7/apis/aspnetcore/confirmation/
---

IdentityServer can [bind tokens to clients](/identityserver/tokens/pop.md#proof-of-possession-styles) using either mTLS or
DPoP, creating a `Proof-of-Possession` (PoP) access token. When one of these mechanisms is used, APIs that use those
access tokens for authorization need to validate the binding between the client and token. This document describes how
to perform such validation, depending on which mechanism was used to produce a PoP token.

### Validating mTLS

If you are using a [mutual TLS connection](/identityserver/tokens/pop.md#mutual-tls) to establish proof-of-possession, the
resulting access token will contain a `cnf` claim containing the client's certificate thumbprint. APIs validate such
tokens by comparing this thumbprint to the thumbprint of the client certificate in the mTLS connection. This validation
should be performed early in the pipeline, ideally immediately after the standard validation of the access token.

You can do so with custom middleware like this:

```csharp
// normal token validation happens here
app.UseAuthentication();

// This adds custom middleware to validate cnf claim
app.UseConfirmationValidation();

app.UseAuthorization();
```

Here, `UseConfirmationValidation` is an extension method that registers the middleware that performs the necessary
validation:

```csharp
public static class ConfirmationValidationExtensions
{
    public static IApplicationBuilder UseConfirmationValidation(this IApplicationBuilder app, ConfirmationValidationMiddlewareOptions options = default)
    {
        return app.UseMiddleware<ConfirmationValidationMiddleware>(options ?? new ConfirmationValidationMiddlewareOptions());
    }
}
```

And this is the actual middleware that validates the `cnf` claim:

```csharp
// this middleware validates the cnf claim (if present) against the thumbprint of the X.509 client certificate for the current client
public class ConfirmationValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger _logger;
    private readonly ConfirmationValidationMiddlewareOptions _options;

    public ConfirmationValidationMiddleware(
        RequestDelegate next, 
        ILogger<ConfirmationValidationMiddlewareOptions> logger, 
        ConfirmationValidationMiddlewareOptions options = null)
    {
        _next = next;
        _logger = logger;
        _options ??= new ConfirmationValidationMiddlewareOptions();
    }

    public async Task Invoke(HttpContext ctx)
    {
        if (ctx.User.Identity.IsAuthenticated)
        {
            // read the cnf claim from the validated token
            var cnfJson = ctx.User.FindFirst("cnf")?.Value;
            if (!String.IsNullOrWhiteSpace(cnfJson))
            {
                // if present, make sure a valid certificate was presented as well
                var certResult = await ctx.AuthenticateAsync(_options.CertificateSchemeName);
                if (!certResult.Succeeded)
                {
                    await ctx.ChallengeAsync(_options.CertificateSchemeName);
                    return;
                }

                // get access to certificate from transport
                var certificate = await ctx.Connection.GetClientCertificateAsync();
                var thumbprint = Base64UrlTextEncoder.Encode(certificate.GetCertHash(HashAlgorithmName.SHA256));
                
                // retrieve value of the thumbprint from cnf claim
                var cnf = JObject.Parse(cnfJson);
                var sha256 = cnf.Value<string>("x5t#S256");

                // compare thumbprint claim with thumbprint of current TLS client certificate
                if (String.IsNullOrWhiteSpace(sha256) ||
                    !thumbprint.Equals(sha256, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogError("certificate thumbprint does not match cnf claim.");
                    await ctx.ChallengeAsync(_options.JwtBearerSchemeName);
                    return;
                }
                
                _logger.LogDebug("certificate thumbprint matches cnf claim.");
            }
        }

        await _next(ctx);
    }
}

public class ConfirmationValidationMiddlewareOptions
{
    public string CertificateSchemeName { get; set; } = CertificateAuthenticationDefaults.AuthenticationScheme;
    public string JwtBearerSchemeName { get; set; } = JwtBearerDefaults.AuthenticationScheme;
}
```

### Validating DPoP

When using [DPoP](/identityserver/tokens/pop.md#enabling-dpop-in-identityserver) for proof-of-possession, validating the `cnf` claim requires several
steps:

1. Validating the access token as normal
2. Validating the DPoP proof token from the `DPoP` HTTP request header
3. Ensuring the authorization header uses the DPoP scheme
4. Validating the JWT format of the proof token
5. Verifying the `cnf` claim matches between tokens
6. Validating the HTTP method and URL match the request
7. Detecting replay attacks using storage
8. Managing nonce generation and validation
9. Handling clock skew between systems
10. Returning appropriate error response headers when validation fails

This comprehensive validation process requires careful implementation to ensure security. Luckily for
developers, we've implemented these steps into an easy-to-use library.

You can use the `Duende.AspNetCore.Authentication.JwtBearer` NuGet package to implement this validation.

```bash
dotnet add package Duende.AspnetCore.Authentication.JwtBearer
```

With this package, the configuration necessary in your startup can be as simple as this:

```csharp
// adds the normal JWT bearer validation
builder.Services.AddAuthentication("token")
    .AddJwtBearer("token", options =>
    {
        options.Authority = Constants.Authority;
        options.TokenValidationParameters.ValidateAudience = false;
        options.MapInboundClaims = false;

        options.TokenValidationParameters.ValidTypes = new[] { "at+jwt" };
    });

// extends the "token" scheme above with DPoP processing and validation
builder.Services.ConfigureDPoPTokensForScheme("token");
```

You will also typically need a distributed cache, used to perform replay detection of DPoP
proofs. `Duende.AspNetCore.Authentication.JwtBearer` relies on `IDistributedCache` for this,
so you can supply the cache implementation of your choice. See the
[Microsoft documentation](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed?view=aspnetcore-8.0)
for more details on setting up distributed caches, along with many examples, including Redis, CosmosDB, and
Sql Server.

A full sample [using the default in memory caching](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/DPoP)
is available on GitHub.