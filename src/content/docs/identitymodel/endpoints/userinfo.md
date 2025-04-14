---
title: UserInfo Endpoint
sidebar:
  order: 5
  label: UserInfo
redirect_from:
  - /foss/identitymodel/endpoints/userinfo/
---

The client library for the [OpenID Connect
UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#userinfo)
endpoint is provided as an extension method for *HttpClient*.

The following code sends an access token to the UserInfo endpoint:

```csharp
var client = new HttpClient();

var response = await client.GetUserInfoAsync(new UserInfoRequest
{
    Address = disco.UserInfoEndpoint,
    Token = token
});
```

The response is of type *UserInfoResponse* and has properties for the
standard response parameters. You also have access to the raw
response and to a parsed JSON document (via the *Raw* and *Json*
properties).

Before using the response, you should always check the *IsError*
property to make sure the request was successful:

```csharp
if (response.IsError) throw new Exception(response.Error);

var claims = response.Claims;
```
