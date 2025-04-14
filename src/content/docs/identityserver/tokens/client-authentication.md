---
title: "Client Authentication"
description: "Client Authentication"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 140
redirect_from:
  - /identityserver/v5/tokens/client_authentication/
  - /identityserver/v5/tokens/authentication/overview/
  - /identityserver/v5/tokens/authentication/shared_secret/
  - /identityserver/v5/tokens/authentication/jwt/
  - /identityserver/v5/tokens/authentication/mtls/
  - /identityserver/v6/tokens/client_authentication/
  - /identityserver/v6/tokens/authentication/overview/
  - /identityserver/v6/tokens/authentication/shared_secret/
  - /identityserver/v6/tokens/authentication/jwt/
  - /identityserver/v6/tokens/authentication/mtls/
  - /identityserver/v7/tokens/client_authentication/
  - /identityserver/v7/tokens/authentication/overview/
  - /identityserver/v7/tokens/authentication/shared_secret/
  - /identityserver/v7/tokens/authentication/jwt/
  - /identityserver/v7/tokens/authentication/mtls/
---

Confidential and credentialed clients need to authenticate with your IdentityServer before they can request tokens.

Duende IdentityServer has built-in support for various client credential types and authentication methods, and an extensible infrastructure to customize the authentication system.

:::note
All information in this section also applies to [API secrets](/identityserver/reference/models/api-resource/) for introspection.
:::

**We recommend using asymmetric client credentials like the [*private key jwt*](#private-key-jwts) or [*Mutual TLS*](#mutual-tls-client-certificates) authentication method over shared secrets.**

### Assigning Secrets

A client secret is abstracted by the `Secret` class. It provides properties for setting the value and type and a description and expiration date.

```cs
var secret = new Secret
{
    Value = "foo",
    Type = "bar",

    Description = "my custom secret",
    Expiration = new DateTime(2021,12,31)
}
```

You can assign multiple secrets to a client to enable roll-over scenarios, e.g.:

```cs
var primary = new Secret("foo");
var secondary = new Secret("bar");

client.ClientSecrets = new[] { primary, secondary };
```

### Secret Parsing
During request processing, the secret must be somehow extracted from the incoming request. The various specs describe a couple of options, e.g. as part of the authorization header or the body payload.

It is the job of implementations of the [ISecretParser](/identityserver/reference/models/secrets#duendeidentityservervalidationisecretparser) interface to accomplish this. You can add secret parsers by calling the `AddSecretParser()` DI extension method.

The following secret parsers are part of Duende IdentityServer:

* **`Duende.IdentityServer.Validation.BasicAuthenticationSecretParser`**

  parses an OAuth basic authentication formatted `Authorization` header.
  Enabled by default.

* **`Duende.IdentityServer.Validation.PostBodySecretParser`**

  Parses from the `client_id` and `client_secret` body fields.
  Enabled by default.

* **`Duende.IdentityServer.Validation.JwtBearerClientAssertionSecretParser`**

  Parses a JWT on the `client_assertion` body field.
  Can be enabled by calling the `AddJwtBearerClientAuthentication` DI extension method.

* **`Duende.IdentityServer.Validation.MutualTlsSecretParser`**

  Parses the `client_id` body field and TLS client certificate.
  Can be enabled by calling the `AddMutualTlsSecretValidators` DI extension method.


### Secret Validation
It is the job of implementations of the [ISecretValidator](/identityserver/reference/models/secrets#duendeidentityservermodelparsedsecret) interface to validate the extracted credentials.

You can add secret validators by calling the `AddSecretValidator()` DI extension method.

The following secret validators are part of Duende IdentityServer:

* **`Duende.IdentityServer.Validation.HashedSharedSecretValidator`**

  Validates shared secrets that are stored hashed.
  Enabled by default.

* **`Duende.IdentityServer.Validation.PlainTextSharedSecretValidator`**

  Validates shared secrets that are stored in plaintext.

* **`Duende.IdentityServer.Validation.PrivateKeyJwtSecretValidator`**

  Validates JWTs that are signed with either X.509 certificates or keys wrapped in a JWK.
  Can be enabled by calling the `AddJwtBearerClientAuthentication` DI extension method.

* **`Duende.IdentityServer.Validation.X509ThumbprintSecretValidator`**

  Validates X.509 client certificates based on a thumbprint.
  Can be enabled by calling the `AddMutualTlsSecretValidators` DI extension method.

* **`Duende.IdentityServer.Validation.X509NameSecretValidator`**

  Validates X.509 client certificates based on a common name.
  Can be enabled by calling the `AddMutualTlsSecretValidators` DI extension method.

## Shared Secrets

Shared secrets is by far the most common technique for authenticating clients.

From a security point of view they have some shortcomings

* the shared secrets must be transmitted over the network during authentication
* they should not be persisted in clear text to reduce the risk of leaking them
* they should have high entropy to avoid brute-force attacks

The following creates a shared secret:

```cs
// loadSecret is responsible for loading a SHA256 or SHA512 hash of a good,
// high-entropy secret from a secure storage location
var hash = loadSecretHash(); 
var secret = new Secret(hash);
```

IdentityServer's Secrets are designed to operate on either a SHA256 or SHA512
hash of the shared secret. The shared secret is not stored in IdentityServer -
only the hash. The client on the hand needs access to the clear text of the
secret. It must send the clear text to authenticate itself.

IdentityServer provides the `Sha256` and `Sha512` extension methods on strings
as a convenience to produce their hashes. These extension methods can be used
when prototyping or during demos to get started quickly. However, the clear text
of secrets used in production should never be written down in your source code.
Anyone with access to the repository can see the secret.

```cs
var compromisedSecret = new Secret("just for demos, not prod!".Sha256());
```

### Authentication Using A Shared Secret

You can either send the client id/secret combination as part of the POST body::

```
POST /connect/token

Content-type: application/x-www-form-urlencoded

    client_id=client&
    client_secret=secret&

    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

...or as a basic authentication header::

```
POST /connect/token

Content-type: application/x-www-form-urlencoded
Authorization: Basic xxxxx

    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

### .NET Client Library

You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestAuthorizationCodeTokenAsync(new AuthorizationCodeTokenRequest
{
    Address = TokenEndpoint,

    ClientId = "client",
    ClientSecret = "secret",

    Code = "...",
    CodeVerifier = "...",
    RedirectUri = "https://app.com/callback"
});
```

## Private Key JWTs

The OpenID Connect specification recommends a client authentication method based on asymmetric keys. With this approach,
instead of transmitting the shared secret over the network, the client creates a JWT and signs it with its private key.
Your IdentityServer only needs to store the corresponding key to be able to validate the signature.

The technique is described [here](https://openid.net/specs/openid-connect-core-1_0.html#clientauthentication) and is
based on the OAuth JWT assertion specification [(RFC 7523)](https://tools.ietf.org/html/rfc7523).

### Setting Up A Private Key JWT Secret

The default private key JWT secret validator expects either a base64 encoded X.509 certificate or
a [JSON Web Key](https://tools.ietf.org/html/rfc7517) formatted RSA, EC or symmetric key on the secret definition:

```cs
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
```

:::note
You can share the same key for client authentication and [signed authorize requests](/identityserver/tokens/jar).
:::

### Authentication Using A Private Key JWT

On the client side, the caller must first generate the JWT, and then send it on the `assertion` body field:

```
POST /connect/token

Content-type: application/x-www-form-urlencoded

    client_assertion=<jwt>&
    client_assertion_type=urn:ietf:params:oauth:grant-type:jwt-bearer&

    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

### .NET Client Library

You can use the [Microsoft JWT library](https://www.nuget.org/packages/System.IdentityModel.Tokens.Jwt/) to create JSON
Web Tokens.

```cs
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

...and the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with the
protocol endpoint from .NET code.

```cs
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

See [here](/identityserver/samples/basics#jwt-based-client-authentication) for a sample for using JWT-based
authentication.

### Using ASP.NET Core

The OpenID Connect authentication handler in ASP.NET Core allows for replacing a static client secret with a dynamically
created client assertion.

This is accomplished by handling the various events on the handler. We recommend to encapsulate the event handler in a
separate type. This makes it easier to consume services from DI:

```cs
// Program.cs
// some details omitted
builder.Services.AddTransient<OidcEvents>();

builder.Services.AddAuthentication(options =>
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = Constants.Authority;

        // no static client secret        
        options.ClientId = "mvc.jar.jwt";

        // specifies type that handles events
        options.EventsType = typeof(OidcEvents);        
    }));
```

In your event handler you can inject code before the handler redeems the code:

```cs
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

The assertion service would be a helper to create the JWT as shown above in the `CreateClientToken` method.
See [here](/identityserver/samples/basics#mvc-client-with-jar-and-jwt-based-authentication) for a sample for using
JWT-based authentication (and signed authorize requests) in ASP.NET Core.

## Strict Audience Validation

Private key JWT have a theoretical vulnerability where a Relying Party trusting multiple
OpenID Providers could be attacked if one of the OpenID Providers is malicious or compromised.

The attack relies on the OpenID Provider setting the audience value of the authentication JWT
to the token endpoint based on the token endpoint value found in the discovery document.
The malicious Open ID Provider can attack this because it controls what the discovery document
contains, and can fool the Relying Party into creating authentication JWTs for the audience of
a victim OpenID Provider.

The OpenID Foundation proposed a two-part fix: strictly validate the audience and set an
explicit `typ` header (with value `client-authentication+jwt`) in the authentication JWT.

You can enable strict audience validation using the [
*`StrictClientAssertionAudienceValidation`*](/identityserver/reference/options#strict-audience-validation)
flag, which always strictly validates that the audience is equal to the issuer and validates the token's
`typ` header, as specified in [RFC 7523 bis](https://datatracker.ietf.org/doc/draft-ietf-oauth-rfc7523bis/).

When *`StrictClientAssertionAudienceValidation`* is not enabled, validation behavior is determined based
on the `typ` header being present. When the token sets the `typ` header to `client-authentication+jwt`,
IdentityServer assumes the client's intention is to apply strict audience validation.
If `typ` is not
present, [default audience validation](/identityserver/apis/aspnetcore/jwt#adding-audience-validation)
is used.

### Mutual TLS Client Certificates

Clients can use an X.509 client certificate as an authentication mechanism to endpoints in your IdentityServer.

For this you need to associate a client certificate with a client in your IdentityServer and enable MTLS support on the
options.

```cs
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{
    options.MutualTls.Enabled = true;
})
```

Use the [DI extensions methods](/identityserver/reference/di) to add the services to DI which contain a default
implementation to do that either thumbprint or common-name based:

```cs
idsvrBuilder.AddMutualTlsSecretValidators();
```

Then add client secret of type `SecretTypes.X509CertificateName` (for PKI-based scenarios)
or `SecretTypes.X509CertificateThumbprint` (for self-issued certificates) to the client you want to authenticate.

For example:

```cs
new Client
{
    ClientId = "mtls.client",
    AllowedGrantTypes = GrantTypes.ClientCredentials,
    AllowedScopes = { "api1" },

    ClientSecrets = 
    {
        // name based
        new Secret(@"CN=client, OU=production, O=company", "client.dn")
        {
            Type = SecretTypes.X509CertificateName
        },

        // or thumbprint based
        new Secret("bca0d040847f843c5ee0fa6eb494837470155868", "mtls.tb")
        {
            Type = SecretTypes.X509CertificateThumbprint
        },
    }
}
```

### .NET Client Library

When writing a client to connect to IdentityServer, the `SocketsHttpHandler` (or `HttpClientHandler` depending on your
.NET version)
class provides a convenient mechanism to add a client certificate to outgoing requests.

Use such a handler with `HttpClient` to perform the client certificate authentication handshake at the TLS channel.
The following snippet is using [IdentityModel](https://identitymodel.readthedocs.io) to read the discovery document and
request a token:

```cs
static async Task<TokenResponse> RequestTokenAsync()
{
    var handler = new SocketsHttpHandler();
    var cert = new X509Certificate2("client.p12", "password");
    handler.SslOptions.ClientCertificates = new X509CertificateCollection { cert };

    var client = new HttpClient(handler);

    var disco = await client.GetDiscoveryDocumentAsync(Constants.Authority);
    if (disco.IsError) throw new Exception(disco.Error);

    var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
    {
        Address = disco.MtlEndpointAliases.TokenEndpoint,
        ClientId = "mtls.client",
        Scope = "api1"
    });

    if (response.IsError) throw new Exception(response.Error);
    return response;
}
```
