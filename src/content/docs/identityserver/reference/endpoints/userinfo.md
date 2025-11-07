---
title: "UserInfo Endpoint"
description: "Reference documentation for the UserInfo endpoint, which allows retrieval of authenticated user claims using a valid access token."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: UserInfo
  order: 5
redirect_from:
  - /identityserver/v5/reference/endpoints/userinfo/
  - /identityserver/v6/reference/endpoints/userinfo/
  - /identityserver/v7/reference/endpoints/userinfo/
---

The UserInfo endpoint can be used to retrieve claims about a user (
see [spec](https://openid.net/specs/openid-connect-core-1_0.html#userinfo)).

The caller needs to send a valid access token.
Depending on the granted scopes, the UserInfo endpoint will return the mapped claims (at least the `openid` scope is
required).

```text
GET /connect/userinfo
Authorization: Bearer <access_token>
```

```text
HTTP/1.1 200 OK
Content-Type: application/json

{
    "sub": "248289761001",
    "name": "Bob Smith",
    "given_name": "Bob",
    "family_name": "Smith"
}
```

## .NET Client Library

You can use the [Duende IdentityModel](/identitymodel/index.mdx) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using Duende.IdentityModel.Client;

var client = new HttpClient();

var disco = await client.GetDiscoveryDocumentAsync("https://localhost:5001");

var token = await client.RequestAuthorizationCodeTokenAsync(new AuthorizationCodeTokenRequest
{
    Address = disco.TokenEndpoint,

    ClientId = "client",
    ClientSecret = "secret",

    Code = "...",
    CodeVerifier = "...",
    RedirectUri = "https://app.com/callback"
});

var userInfo = await client.GetUserInfoAsync(new UserInfoRequest
{
    Address = disco.UserInfoEndpoint,
    Token = token.AccessToken
});
```