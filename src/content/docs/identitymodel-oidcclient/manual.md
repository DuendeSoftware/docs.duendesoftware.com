---
title: OIDC Client Manual Mode
description: "Guide for implementing manual mode in OidcClient to handle browser interactions and token processing"
sidebar:
  order: 2
  label: Manual Mode
redirect_from:
  - /foss/identitymodel.oidcclient/manual/
---

OpenID Connect is a protocol that allows you to authenticate users
using a browser and involves browser-based interactions. When using this
library you can choose between two modes: [automatic](./automatic.md) and manual.

We recommend using automatic mode when possible, but sometimes you need
to use manual mode when you want to handle browser interactions yourself.

With manual mode, `OidcClient` is still useful, as it helps 
with creating the necessary start URL and state parameters needed to complete an OIDC flow.
You'll need to handle all browser interactions yourself with custom code. This is beneficial
for scenarios where you want to customize the browser experience or when you want to
integrate with other platform-specific browser libraries.

```csharp
var options = new OidcClientOptions
{
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native",
    RedirectUri = redirectUri,
    Scope = "openid profile api"
};

var client = new OidcClient(options);

// generate start URL, state, nonce, code challenge
var state = await client.PrepareLoginAsync();
```

When the browser work is done, `OidcClient` can take over to process the
response, get the access/refresh tokens, contact userinfo endpoint
etc.:

```csharp
var result = await client.ProcessResponseAsync(data, state);
```

When using this manual mode, and processing the response, the `ProcessResponseAsync` method will return a
[`LoginResult`](https://github.com/DuendeSoftware/foss/blob/19370c6d4820a684d41d1d40b8192ee8b873b8f0/identity-model-oidc-client/src/IdentityModel.OidcClient/LoginResult.cs) which will contain a `ClaimsPrincipal` with the user's claims along with the `IdentityToken` and `AccessToken`.
