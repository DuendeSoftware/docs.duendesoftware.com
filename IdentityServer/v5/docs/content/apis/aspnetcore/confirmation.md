---
title: "Validating Proof-of-Possession"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

If your IdentityServer added a [*cnf* claim]({{< ref "/tokens/pop" >}}) to the token, you should validate that early in the pipeline. Ideally directly after the standard token validation is done, e.g. using a middleware:

```cs
public void Configure(IApplicationBuilder app)
{
    // rest omitted
    
    // normal token validation happens here
    app.UseAuthentication();

    // middleware to validate cnf claim
    app.UseConfirmationValidation();
    
    app.UseAuthorization();

    // rest omitted
}
```

### Validating MTLS Proof-of-Possession
If you are using a TLS client certificate for proof-of-possession, the following sample middleware can be used to validate the *cnf* claim:

```cs
// this middleware validate the cnf claim (if present) against the thumbprint of the X.509 client certificate for the current client
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
