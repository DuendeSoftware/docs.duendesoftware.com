---
title: "Mutual TLS"
order: 10
---

## Proof-of-possession using Mutual TLS
[RFC 8705](https://tools.ietf.org/html/rfc8705) specifies how to bind a TLS client certificate to an access token. With this method your IdentityServer will embed the SHA-256 thumbprint of the X.509 client certificate into the access token via the cnf claim, e.g.:

```json
{
  // rest omitted
  
  "cnf": { "x5t#S256": "bwcK0esc3ACC3DB2Y5_lESsXE8o9ltc05O89jdN-dg2" } 
}
```

This is done automatically if you [authenticate](/identityserver/v6/tokens/authentication/mtls) the client using a TLS client certificate.

The client must then use the same client certificate to call the APIs, and your APIs can [validate](/identityserver/v6/apis/aspnetcore/confirmation) the *cnf* claim by comparing it to the thumbprint of the client certificate on the TLS channel.

If the access token would leak, it cannot be replayed without having access to the additional private key of the X.509 client certificate.

### Combine TLS proof-of-possession with other authentication methods
It is not mandatory to authenticate your clients with a client certificate to get the benefit of proof-of-possession. You can combine this feature with an arbitrary client authentication method - or even no client authentication at all (e.g. for public mobile/native clients).

In this scenario, the client would create an X.509 certificate on the fly, and use that to establish the TLS channel to your IdentityServer. As long as the certificate is accepted by your web server, your IdentityServer can embed the *cnf* claim, and your APIs can validate it.

#### .NET Client
In .NET it is straight-forward to create an X.509 certificate on the fly and use it to open a TLS connection.

```cs
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

```cs
static async Task<TokenResponse> RequestTokenAsync()
{
    var client = new HttpClient(GetHandler(ClientCertificate));

    var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
    if (disco.IsError) throw new Exception(disco.Error);

        var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
    {
        Address = disco.MtlsEndpointAliases.TokenEndpoint,

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

#### Enabling support in your IdentityServer
The last step is to enable that feature in the options:

```cs
var builder = services.AddIdentityServer(options =>
{
    // other settings
    
    options.MutualTls.AlwaysEmitConfirmationClaim = true;
});
```