---
title: "Proof-of-Possession Access Tokens"
description: "Documentation for Proof-of-Possession (PoP) tokens, which enhance security by cryptographically binding tokens to clients, including both Mutual TLS and DPoP implementations."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Proof-of-Possession
  order: 100
redirect_from:
  - /identityserver/apis/aspnetcore/dpop/
  - /identityserver/v5/tokens/pop/
  - /identityserver/v5/tokens/pop/dpop/
  - /identityserver/v5/tokens/pop/mtls/
  - /identityserver/v6/tokens/pop/
  - /identityserver/v6/tokens/pop/dpop/
  - /identityserver/v6/tokens/pop/mtls/
  - /identityserver/v7/tokens/pop/
  - /identityserver/v7/tokens/pop/dpop/
  - /identityserver/v7/tokens/pop/mtls/
---

By default, OAuth access tokens are so-called `bearer` tokens. This means they are not bound to a client and anybody who possesses the token can use it. The security concern here is that a leaked token could be used by a (malicious) third party to impersonate the client and/or user.

On the other hand, `Proof-of-Possession` (PoP) tokens are bound to the client that requested the token. This is also often called sender constraining. This is done by using cryptography to prove that the sender of the token knows an additional secret only known to the client.

This proof is called the *confirmation method* and is expressed via the standard [`cnf` claim](https://tools.ietf.org/html/rfc7800),e.g.:

```json
{
  "iss": "https://localhost:5001",
  "iat": 1609932801,
  "exp": 1609936401,
  "aud": "urn:resource1",
  "client_id": "web_app",
  "sub": "88421113",
  "cnf": "confirmation_method"
}
```

:::note
When using reference tokens, the cnf claim will be returned from the introspection endpoint.
:::

## Proof-of-Possession Styles

IdentityServer supports two styles of proof of possession tokens: **Mutual TLS** and **DPoP**.

## Mutual TLS

[RFC 8705](https://tools.ietf.org/html/rfc8705) specifies how to bind a TLS client certificate to an access token. With this method your IdentityServer will embed the SHA-256 thumbprint of the X.509 client certificate into the access token via the cnf claim, e.g.:

```json
{
  // rest omitted

  "cnf": { "x5t#S256": "bwcK0esc3ACC3DB2Y5_lESsXE8o9ltc05O89jdN-dg2" }
}
```

This is done automatically if you [authenticate](/identityserver/tokens/client-authentication.md#mutual-tls-client-certificates) the client using a TLS client certificate.

The client must then use the same client certificate to call the APIs, and your APIs can [validate](/identityserver/apis/aspnetcore/confirmation.md) the `cnf` claim by comparing it to the thumbprint of the client certificate on the TLS channel.

If the access token would leak, it cannot be replayed without having access to the additional private key of the X.509 client certificate.

### Combine TLS Proof-of-possession With Other Authentication Methods

It is not mandatory to authenticate your clients with a client certificate to get the benefit of proof-of-possession. You can combine this feature with an arbitrary client authentication method - or even no client authentication at all (e.g. for public mobile/native clients).

In this scenario, the client would create an X.509 certificate on the fly, and use that to establish the TLS channel to your IdentityServer. As long as the certificate is accepted by your web server, your IdentityServer can embed the `cnf` claim, and your APIs can validate it.

#### .NET Client

In .NET it is straight-forward to create an X.509 certificate on the fly and use it to open a TLS connection.

```csharp
static X509Certificate2 CreateClientCertificate(string name)
{
    X500DistinguishedName distinguishedName = new X500DistinguishedName($"CN={name}");

    using (RSA rsa = RSA.Create(2048))
    {
        var request = new CertificateRequest(distinguishedName, rsa, HashAlgorithmName.SHA256,RSASignaturePadding.Pkcs1);

        request.CertificateExtensions.Add(
            new X509KeyUsageExtension(
                X509KeyUsageFlags.DataEncipherment |
                X509KeyUsageFlags.KeyEncipherment |
                X509KeyUsageFlags.DigitalSignature , false));

        request.CertificateExtensions.Add(
            new X509EnhancedKeyUsageExtension(
                new OidCollection
                {
                    new Oid("1.3.6.1.5.5.7.3.2")
                }, false));

        return request.CreateSelfSigned(
            new DateTimeOffset(DateTime.UtcNow.AddDays(-1)),
            new DateTimeOffset(DateTime.UtcNow.AddDays(10)));
    }
}
```

Then use this client certificate on the TLS channel to request the token:

```csharp
static async Task<TokenResponse> RequestTokenAsync()
{
    var client = new HttpClient(GetHandler(ClientCertificate));

    var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
    if (disco.IsError) throw new Exception(disco.Error);

    var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
    {
        Address = disco.MtlsEndpointAliases.TokenEndpoint,

        // The default ClientCredentialStyle value is ClientCredentialStyle.AuthorizationHeader, which does not work in a Mutual TLS scenario
        ClientCredentialStyle = ClientCredentialStyle.PostBody,

        ClientId = "client",
        Scope = "api1"
    });

    if (response.IsError) throw new Exception(response.Error);
    return response;
}

static SocketsHttpHandler GetHandler(X509Certificate2 certificate)
{
    var handler = new SocketsHttpHandler();
    handler.SslOptions.ClientCertificates = new X509CertificateCollection { certificate };

    return handler;
}
```

#### Enabling Support In IdentityServer

The last step is to enable that feature in the options:

```csharp
// Program.cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{
    // other settings

    options.MutualTls.AlwaysEmitConfirmationClaim = true;
});
```

## Demonstrating Proof-of-Possession at the Application Layer (DPoP)

**Version:** <span data-shb-badge data-shb-badge-variant="default">&gt;=6.3</span>

[DPoP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-dpop) is a security measure that addresses token replay
attacks by making it difficult for attackers to use stolen tokens.

:::note
This feature is part of the [Duende IdentityServer Enterprise Edition](https://duendesoftware.com/products/identityserver).
:::

DPoP specifies how to bind
an asymmetric key stored within a JSON Web Key (JWK) to an access token. With this enabled your IdentityServer will
embed the thumbprint of the public key JWK into the access token via the cnf claim, e.g.:

```json
{
  // rest omitted

  "cnf": {
    "jkt": "JGSVlE73oKtQQI1dypYg8_JNat0xJjsQNyOI5oxaZf4"
  }
}
```

The client must then prove possession of the private key to call the APIs, and your APIs
can [validate](/identityserver/apis/aspnetcore/confirmation.md) the `cnf` claim by comparing it to the thumbprint of the
client's public key in the JWK.

If the access token would leak, it cannot be replayed without having access to the private key of the JWK the client
controls.

The mechanism by which the client proves control of the private key (both when connecting to the token server and when
calling an API) is by sending an additional JWT called a proof token on HTTP requests.
This proof token is passed via the `DPoP` request header and contains the public portion of the JWK, and is signed by
the corresponding private key.

The creation and management of this DPoP key is up to the policy of the client.
For example is can be dynamically created when the client starts up, and can be periodically rotated.
The main constraint is that it must be stored for as long as the client uses any access tokens (and possibly refresh
tokens) that they are bound to.

#### Enabling DPoP In IdentityServer

DPoP is something a client can use dynamically with no configuration in IdentityServer, but you can configure it as
required.
This is a per-client [setting](/identityserver/reference/models/client.md#dpop) in your IdentityServer.
There are additional client and [global](/identityserver/reference/options.md#dpop) DPoP settings to control the
behavior.

```csharp
new Client
{
    ClientId = "dpop_client",
    RequireDPoP = true,

    // ...
}
```

#### Enabling DPoP Support In Your Client

The easiest approach for supporting DPoP in your client is to use the DPoP support in the `Duende.AccessTokenManagement`
library ([docs available here](/accesstokenmanagement/advanced/dpop.md)).
It provides DPoP client support for both client credentials and code flow style clients.
DPoP is enabled by assigning the `DPoPJsonWebKey` on the client configuration.

For example, here's how to configure a client credentials client:

```csharp
// Program.cs
builder.Services.AddClientCredentialsTokenManagement()
        .AddClient("demo_dpop_client", client =>
        {
            client.TokenEndpoint = "https://demo.duendesoftware.com/connect/token";
            client.DPoPJsonWebKey = "...";
            // ...
        });
```

And here's how to configure a code flow client:

```csharp
// Program.cs
builder.Services.AddAuthentication(...)
    .AddCookie("cookie", ...)
    .AddOpenIdConnect("oidc", ...);

builder.Services.AddOpenIdConnectAccessTokenManagement(options =>
{
    options.DPoPJsonWebKey = "...";
});
```

In either case, you will need to create a JWK. One approach to creating a JWK in string format is to use the .NET crypto
APIs, for example:

```csharp
var rsaKey = new RsaSecurityKey(RSA.Create(2048));
var jsonWebKey = JsonWebKeyConverter.ConvertFromSecurityKey(rsaKey);
jsonWebKey.Alg = "PS256";
string jwk = JsonSerializer.Serialize(jsonWebKey);
```

Once your client configuration has a `DPoPJsonWebKey`, then any protocol requests to obtain access tokens from the token
server will automatically include a DPoP proof token created from the `DPoPJsonWebKey`.
Furthermore, any API invocations using the `AddClientCredentialsHttpClient` or `AddUserAccessTokenHttpClient` helpers
will also automatically include a DPoP proof token. The implication is that the `DPoPJsonWebKey` is a critical secret
that must be carefully managed, because any tokens requested with this secret will be bound to it; if the secret is
lost, the tokens can longer be used, and if the secret is leaked, the security benefits of DPoP are lost.

#### Enabling DPoP Support In Your API

See [here](/identityserver/apis/aspnetcore/confirmation.md#validating-dpop) for documentation
describing how to enable DPoP in your APIs.
