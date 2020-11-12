---
title: "UserInfo Endpoint"
date: 2020-09-10T08:22:12+02:00
weight: 4
---

The UserInfo endpoint can be used to retrieve claims about a user (see [spec](http://openid.net/specs/openid-connect-core-1_0.html#UserInfo). 

The caller needs to send a valid access.
Depending on the granted scopes, the UserInfo endpoint will return the mapped claims (at least the *openid* scope is required).

```
GET /connect/userinfo
Authorization: Bearer <access_token>
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{
    "sub": "248289761001",
    "name": "Bob Smith",
    "given_name": "Bob",
    "family_name": "Smith"
}
```

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically access the discovery endpoint from .NET code. 

```cs
using IdentityModel.Client;s

var client = new HttpClient();

var response = await client.GetUserInfoAsync(new UserInfoRequest
{
    Address = disco.UserInfoEndpoint,
    Token = token
});
```