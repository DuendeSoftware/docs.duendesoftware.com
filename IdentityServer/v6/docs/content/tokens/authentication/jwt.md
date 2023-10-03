---
title: "Private Key JWTs"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

The OpenID Connect specification recommends a client authentication method based on asymmetric keys. With this approach, instead of transmitting the shared secret over the network, the client creates a JWT and signs it with its private key. Your IdentityServer only needs to store the corresponding key to be able to validate the signature.

The technique is described [here](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication) and is based on the OAuth JWT assertion specification [(RFC 7523)](https://tools.ietf.org/html/rfc7523).

## Setting up a private key JWT secret
The default private key JWT secret validator expects either a base64 encoded X.509 certificate or a [JSON Web Key](https://tools.ietf.org/html/rfc7517) formatted RSA, EC or symmetric key on the secret definition:

    var client = new Client
    {
        ClientId = "client.jwt",

        ClientSecrets =
        {
            new Secret
            {
                // base64 encoded X.509 certificate
                Type = IdentityServerConstants.SecretTypes.X509CertificateBase64,

                Value = "MIID...xBXQ="
            }
            new Secret
            {
                // JWK formatted RSA key
                Type = IdentityServerConstants.SecretTypes.JsonWebKey,

                Value = "{'e':'AQAB','kid':'Zz...GEA','kty':'RSA','n':'wWw...etgKw'}"
            }
        },

        AllowedGrantTypes = GrantTypes.ClientCredentials,
        AllowedScopes = { "api1", "api2" }
    };

{{% notice note %}}
You can share the same key for client authentication and [signed authorize requests]({{< ref "/tokens/jar" >}}).
{{% /notice %}}

## Authentication using a private key JWT
On the client side the, the caller must first generate the JWT, and then send it on the *assertion* body field:

```
POST /connect/token

Content-type: application/x-www-form-urlencoded

    client_assertion=<jwt>&
    client_assertion_type=urn:ietf:params:oauth:grant-type:jwt-bearer&

    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

### .NET client library
You can use the [Microsoft JWT library](https://www.nuget.org/packages/System.IdentityModel.Tokens.Jwt/) to create JSON Web Tokens.

```
private static string CreateClientToken(SigningCredentials credential, string clientId, string tokenEndpoint)
{
    var now = DateTime.UtcNow;

    var token = new JwtSecurityToken(
        clientId,
        tokenEndpoint,
        new List<Claim>()
        {
            new Claim(JwtClaimTypes.JwtId, Guid.NewGuid().ToString()),
            new Claim(JwtClaimTypes.Subject, clientId),
            new Claim(JwtClaimTypes.IssuedAt, now.ToEpochTime().ToString(), ClaimValueTypes.Integer64)
        },
        now,
        now.AddMinutes(1),
        credential
    );

    var tokenHandler = new JwtSecurityTokenHandler();
    return tokenHandler.WriteToken(token);
}
```

..and the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with the protocol endpoint from .NET code. 

```
using IdentityModel.Client;

static async Task<TokenResponse> RequestTokenAsync(SigningCredentials credential)
{
    var client = new HttpClient();

    var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
    if (disco.IsError) throw new Exception(disco.Error);

    var clientToken = CreateClientToken(credential, "private.key.jwt", disco.TokenEndpoint);

    var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
    {
        Address = disco.TokenEndpoint,
        Scope = "api1.scope1",

        ClientAssertion =
        {
            Type = OidcConstants.ClientAssertionTypes.JwtBearer,
            Value = clientToken
        }
    });

    if (response.IsError) throw new Exception(response.Error);
    return response;
}
```

See [here]({{< ref "/samples/basics#jwt-based-client-authentication" >}}) for a sample for using JWT-based authentication.

### Using ASP.NET Core
The OpenID Connect authentication handler in ASP.NET Core allows for replacing a static client secret with a dynamically created client assertion.

This is accomplished by handling the various events on the handler. We recommend to encapsulate the event handler in a separate type. This makes it easier to consume services from DI:

```
public void ConfigureServices(IServiceCollection services)
{
    // some details omitted
    services.AddTransient<OidcEvents>();

    services.AddAuthentication(options =>
        .AddOpenIdConnect("oidc", options =>
        {
            options.Authority = Constants.Authority;

            // no static client secret        
            options.ClientId = "mvc.jar.jwt";

            // specifies type that handles events
            options.EventsType = typeof(OidcEvents);        
        }));
    }
```

In your event handler you can inject code before the handler redeems the code:

```
public class OidcEvents : OpenIdConnectEvents
{
    private readonly AssertionService _assertionService;

    public OidcEvents(AssertionService assertionService)
    {
        _assertionService = assertionService;
    }
    
    public override Task AuthorizationCodeReceived(AuthorizationCodeReceivedContext context)
    {
        context.TokenEndpointRequest.ClientAssertionType = OidcConstants.ClientAssertionTypes.JwtBearer;
        context.TokenEndpointRequest.ClientAssertion = _assertionService.CreateClientToken();

        return Task.CompletedTask;
    }
}
```

The assertion service would be a helper to create the JWT as shown above in the *CreateClientToken* method.
See [here]({{< ref "/samples/basics#mvc-client-with-jar-and-jwt-based-authentication" >}}) for a sample for using JWT-based authentication (and signed authorize requests) in ASP.NET Core.
