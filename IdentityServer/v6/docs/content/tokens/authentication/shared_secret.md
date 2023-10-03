---
title: "Shared Secrets"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

Shared secrets is by far the most common technique for authenticating clients.

From a security point of view they have some shortcomings

* the shared secrets must be transmitted over the network during authentication
* they should not be persisted in clear text to reduce the risk of leaking them
* they should have high entropy to avoid brute-force attacks

The following creates a shared secret:

```
// loadSecret is responsible for loading a SHA256 or SHA512 hash of a good,
// high-entropy secret from a secure storage location
var hash = loadSecretHash(); 
var secret = new Secret(hash);
```

IdentityServer's Secrets are designed to operate on either a SHA256 or SHA512
hash of the shared secret. The shared secret is not stored in IdentityServer - 
only the hash. The client on the hand needs access to the clear text of the 
secret. It must send the clear text to authenticate itself.

IdentityServer provides the *Sha256* and *Sha512* extension methods on strings
as a convenience to produce their hashes. These extension methods can be used
when prototyping or during demos to get started quickly. However, the clear text
of secrets used in production should never be written down in your source code.
Anyone with access to the repository can see the secret.

```
var compromisedSecret = new Secret("just for demos, not prod!".Sha256());
```

## Authentication using a shared secret
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

..or as a basic authentication header::

```
POST /connect/token

Content-type: application/x-www-form-urlencoded
Authorization: Basic xxxxx

    client_id=client1&
    client_secret=secret&
    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with the protocol endpoint from .NET code.

```
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