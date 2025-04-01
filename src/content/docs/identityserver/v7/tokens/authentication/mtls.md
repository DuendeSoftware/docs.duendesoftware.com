---
title: "TLS Client Certificates"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 30
---

Clients can use an X.509 client certificate as an authentication mechanism to endpoints in your IdentityServer.

For this you need to associate a client certificate with a client in your IdentityServer and enable MTLS support on the
options.

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{
    options.MutualTls.Enabled = true;
})
```

Use the [DI extensions methods](/identityserver/v7/reference/di) to add the services to DI which contain a default
implementation to do that either thumbprint or common-name based:

```cs
idsvrBuilder.AddMutualTlsSecretValidators();
```

Then add client secret of type `SecretTypes.X509CertificateName` (for PKI-based scenarios)
or `SecretTypes.X509CertificateThumbprint` (for self-issued certificates) to the client you want to authenticate.

For example::

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

### .NET client library

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
