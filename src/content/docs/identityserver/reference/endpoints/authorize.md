---
title: "Authorize Endpoint"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 2
redirect_from:
  - /identityserver/v5/reference/endpoints/authorize/
  - /identityserver/v6/reference/endpoints/authorize/
  - /identityserver/v7/reference/endpoints/authorize/
---

The authorize endpoint can be used to request tokens or authorization codes via the browser.
This process typically involves authentication of the end-user and optionally consent.

IdentityServer supports a subset of the OpenID Connect and OAuth 2.0 authorize request parameters. For a full list,
see [here](https://openid.net/specs/openid-connect-core-1_0.html#authrequest).

### Required parameters

* **`client_id`**

  identifier of the client

* **`scope`**

  one or more registered scopes

* **`redirect_uri`**

  must exactly match one of the allowed redirect URIs for that client

* **`response_type`**

  specifies the response type

    * **`id_token`**

    * **`token`**

    * ***id_token token***

    * **`code`**

    * ***code id_token***

    * ***code id_token token***

### Optional parameters

* **`response_mode`**

  specifies the response mode

    * **`query`**

    * **`fragment`**

    * **`form_post`**

* **`state`**

  echos back the state value on the token response,
  this is for round tripping state between client and provider, correlating request and response and CSRF/replay
  protection. (recommended)

* **`nonce`**

  echos back the nonce value in the identity token (for replay protection)

  Required when identity tokens is transmitted via the browser channel

* **`prompt`**

    * **`none`**

      no UI will be shown during the request. If this is not possible (e.g. because the user has to sign in or consent)
      an error is returned

    * **`login`**

      the login UI will be shown, even if the user is already signed in and has a valid session

    * **`create`**

      the user registration UI will be shown, if the `UserInteraction.CreateAccountUrl` option is set (the option is
      null by default, which disables support for this prompt value)

* **`code_challenge`**

  sends the code challenge for PKCE

* **`code_challenge_method`**

    * **`plain`**

      indicates that the challenge is using plain text (not recommended)

    * **`S256`**

      indicates the challenge is hashed with SHA256

* **`login_hint`**

  can be used to pre-fill the username field on the login page

* **`ui_locales`**

  gives a hint about the desired display language of the login UI

* **`max_age`**

  if the user's logon session exceeds the max age (in seconds), the login UI will be shown

* **`acr_values`**

  allows passing in additional authentication related information - IdentityServer special cases the following
  proprietary acr_values:

    * **`idp:name_of_idp`**

      bypasses the login/home realm screen and forwards the user directly to the selected identity provider (if allowed
      per client configuration)

    * **`tenant:name_of_tenant`**

      can be used to pass a tenant name to the login UI

* **`request`**

  instead of providing all parameters as individual query string parameters, you can provide a subset or all them as
  a JWT

* **`request_uri`**

  URL of a pre-packaged JWT containing request parameters

```text
GET /connect/authorize?
    client_id=client1&
    scope=openid email api1&
    response_type=id_token token&
    redirect_uri=https://myapp/callback&
    state=abc&
    nonce=xyz 
```

## .NET client library

You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically create
authorize request URLs from .NET code.

```cs
var ru = new RequestUrl("https://demo.duendesoftware.com/connect/authorize");

var url = ru.CreateAuthorizeUrl(
    clientId: "client",
    responseType: "code",
    redirectUri: "https://app.com/callback",
    scope: "openid");
```