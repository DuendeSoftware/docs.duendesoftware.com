---
title: "Token Endpoint"
description: "Documentation for the token endpoint that enables programmatic token requests using various grant types and parameters in Duende IdentityServer."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Token
  order: 4
redirect_from:
  - /identityserver/v5/reference/endpoints/token/
  - /identityserver/v6/reference/endpoints/token/
  - /identityserver/v7/reference/endpoints/token/
---

The token endpoint can be used to programmatically request tokens.

Duende IdentityServer supports a subset of the OpenID Connect and OAuth 2.0 token request parameters. For a full list,
see [here](https://openid.net/specs/openid-connect-core-1_0.html#tokenrequest).

### Required Parameters

* **`client_id`**

  client identifier; not necessary in body if it is present in the authorization header

* **`grant_type`**

    * **`authorization_code`**

    * **`client_credentials`**

    * **`password`**

    * **`refresh_token`**

    * **`urn:ietf:params:oauth:grant-type:device_code`**

    * ***extension grant***

### Optional Parameters

* **`client_secret`**

  client secret for confidential/credentials clients - either in the post body, or as a basic authentication header.

* **`scope`**

  one or more registered scopes. If not specified, a token for all explicitly allowed scopes will be issued.

* **`redirect_uri`**

  required for the `authorization_code` grant type

* **`code`**

  the authorization code (required for `authorization_code` grant type)

* **`code_verifier`**

  PKCE proof key

* **`username`**

  resource owner username (required for `password` grant type)

* **`password`**

  resource owner password (required for `password` grant type)

* **`acr_values`**

  allows passing in additional authentication related information. Duende IdentityServer special cases the following
  proprietary acr_values

    * **`tenant:name_of_tenant`**

      can be used to pass a tenant name to the token endpoint

* **`refresh_token`**

  the refresh token (required for `refresh_token` grant type)

* **`device_code`**

  the device code (required for `urn:ietf:params:oauth:grant-type:device_code` grant type)

* **`auth_req_id`**

  the backchannel authentication request id (required for `urn:openid:params:grant-type:ciba` grant type)

```text
POST /connect/token
CONTENT-TYPE application/x-www-form-urlencoded

    client_id=client1&
    client_secret=secret&
    grant_type=authorization_code&
    code=hdh922&
    redirect_uri=https://myapp.com/callback
```

## .NET Client Library

You can use the [Duende IdentityModel](/identitymodel/index.mdx) client library to programmatically interact with
the protocol endpoint from .NET code.

```cs
using Duende.IdentityModel.Client;

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
```
