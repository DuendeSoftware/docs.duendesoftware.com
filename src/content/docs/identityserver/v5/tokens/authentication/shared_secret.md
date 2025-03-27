---
title: "Shared Secrets"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

Shared secrets is by far the most common technique for authenticating clients.

From a security point of view they have some shortcomings

* the shared secrets must be transmitted over the network during authentication
* they should not be persisted in clear text to reduce leaking them
* they should have high entropy to avoid brute-forcing attacks

The following snippet creates a shared secret.

```cs
var secret = new Secret("good_high_entropy_secret".Sha256());
```

:::note
By default it is assumed that every shared secret is hashed either using SHA256 or SHA512. If you load from a data store, your IdentityServer would store the hashed version only, whereas the client needs access to the plain text version.
:::

## Authentication using a shared secret
You can either send the client id/secret combination as part of the POST body::

```text
POST /connect/token

Content-type: application/x-www-form-urlencoded

    client_id=client&
    client_secret=secret&

    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

..or as a basic authentication header::

```text
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