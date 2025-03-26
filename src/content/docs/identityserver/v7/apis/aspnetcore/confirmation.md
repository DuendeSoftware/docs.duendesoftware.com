---
title: "Validating Proof-of-Possession"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

IdentityServer can [bind tokens to clients](/identityserver/v7/tokens/pop) using either mTLS or DPoP, creating a *Proof-of-Possession* (PoP) access token. When one of these mechanisms is used, APIs that use those access tokens for authorization need to validate the binding between the client and token. This document describes how to perform such validation, depending on which mechanism was used to produce a PoP token.

### Validating mTLS Proof-of-Possession

If you are using a [mutual TLS connection](/identityserver/v7/tokens/pop/mtls) to establish proof-of-possession, the resulting access token will contain a *cnf* claim containing the client's certificate thumbprint. APIs validate such tokens by comparing this thumbprint to the thumbprint of the client certificate in the mTLS connection. This validation should be performed early in the pipeline, ideally immediately after the standard validation of the access token.

You can do so with custom middleware like this:

```cs
// normal token validation happens here
app.UseAuthentication();

// This adds custom middleware to validate cnf claim
app.UseConfirmationValidation();

app.UseAuthorization();
```

Here, *UseConfirmationValidation* is an extension method that registers the middleware that performs the necessary validation:

```cs
public static class ConfirmationValidationExtensions
{
    public static IApplicationBuilder UseConfirmationValidation(this IApplicationBuilder app, ConfirmationValidationMiddlewareOptions options = default)
    {
        return app.UseMiddleware<ConfirmationValidationMiddleware>(options ?? new ConfirmationValidationMiddlewareOptions());
    }
}
```

And this is the actual middleware that validates the *cnf* claim:

```cs
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

### Validating DPoP Proof-of-Possession
If you are using [DPoP](/identityserver/v7/tokens/pop/dpop) for proof-of-possession, there is a non-trivial amount of work needed to validate the *cnf* claim.
In addition to the normal validation mechanics of the access token itself, DPoP requires additional validation of the DPoP proof token sent in the "DPoP" HTTP request header.
DPoP proof token processing involves requiring the DPoP scheme on the authorization header where the access token is sent, JWT validation of the proof token, "cnf" claim validation, HTTP method and URL validation, replay detection (which requires some storage for the replay information), nonce generation and validation, additional clock skew logic, and emitting the correct response headers in the case of the various validation errors.

You can use the *Duende.AspNetCore.Authentication.JwtBearer* NuGet package to implement this validation. With this package, the configuration necessary in your startup can be as simple as this:

```cs
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
proofs. Duende.AspNetCore.Authentication.JwtBearer relies on `IDistributedCache` for this,
so you can supply the cache implementation of your choice. See the 
[Microsoft documentation](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed?view=aspnetcore-8.0)
for more details on on setting up distributed caches, along with many examples, including Redis, CosmosDB, and
Sql Server.

A full sample using the default in memory caching is available
[here](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/DPoP).
