---
title: "DPoP"
weight: 20
---


## Proof-of-possession using Demonstrating Proof-of-Possession at the Application Layer (DPoP)

Added in 6.3.0.

[DPoP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-dpop) specifies how to bind an asymmetric key stored within a JSON Web Key (JWK) to an access token. With this enabled your IdentityServer will embed the thumbprint of the public key JWK into the access token via the cnf claim, e.g.:

```json
{
  // rest omitted
  
  "cnf": { "jkt": "JGSVlE73oKtQQI1dypYg8_JNat0xJjsQNyOI5oxaZf4" } 
}
```

The client must then proove posession of the private key to call the APIs, and your APIs can [validate]({{< ref "/apis/aspnetcore/confirmation" >}}) the *cnf* claim by comparing it to the thumbprint of the client's public key in the JWK.

If the access token would leak, it cannot be replayed without having access to the private key of the JWK the client controls.

The mechanism by which the client proves control of the private key (both when connecting to the token server and when calling an API) is by sending an additional JWT called a proof token on HTTP requests.
This proof token is passed via the *DPoP* request header and contains the public portion of the JWK, and is signed by the corresponding private key.

The creation and management of this DPoP key is up to the policy of the client.
For example is can be dynamically created when the client starts up, and can be perodically rotated.
The main constraint is that it must be stored for as long as the client uses any access tokens (and possibly refresh tokens) that they are bound to.

#### Enabling DPoP in IdentityServer

DPoP is something a client can use dynamically with no configuration in IdentityServer, but you can configure it as required.
This would be a [per-client setting]({{< ref "/reference/models/client#dpop" >}}) in your IdentityServer.
There are additional client as well as [global DPoP settings]({{< ref "/reference/options#dpop">}}) to control the behavior.

```csharp
new Client
{
    ClientId = "dpop_client",
    RequireDPoP = true,

    // ...
}
```

#### Enabling DPoP support in your client

The easiest approach for supporting DPoP in your client is to use the DPoP support in the *Duende.AccessTokenManagement* library.
It provides DPoP client support for both client credentials and code flow style clients.
DPoP is enabled by simply assigning the *DPoPJsonWebKey* on the client configuration. 

This shows how it would be done for a client credentials configuration:

```csharp
services.AddClientCredentialsTokenManagement()
        .AddClient("demo_dpop_client", client =>
        {
            client.TokenEndpoint = "https://demo.duendesoftware.com/connect/token";
            client.DPoPJsonWebKey = "...";
            // ...
        });
```

And this shows for a code-flow client:

```csharp
 builder.Services.AddAuthentication(...)
            .AddCookie("cookie", ...)
            .AddOpenIdConnect("oidc", ...);

builder.Services.AddOpenIdConnectAccessTokenManagement(options => 
{
    options.DPoPJsonWebKey = "...";
});
```

One approach to creating a JWK in string format is to use the .NET crypto APIs, for example:

```csharp
var rsaKey = new RsaSecurityKey(RSA.Create(2048));
var jsonWebKey = JsonWebKeyConverter.ConvertFromSecurityKey(rsaKey);
jsonWebKey.Alg = "RS256";
string jwk = JsonSerializer.Serialize(jsonWebKey);
```

Once your client configuration has a *DPoPJsonWebKey*, then any protocol requests to obtain access tokens from the token server will automatially include a DPoP proof token created from the *DPoPJsonWebKey*.
Furthermore, any API invocations using the *AddClientCredentialsHttpClient* or *AddUserAccessTokenHttpClient* helpers will also automatially include a DPoP proof token.

#### Enabling DPoP support in your API

TBD