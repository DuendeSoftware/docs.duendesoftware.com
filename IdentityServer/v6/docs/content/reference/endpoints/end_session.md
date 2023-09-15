---
title: "End Session Endpoint"
date: 2020-09-10T08:22:12+02:00
weight: 7
---

The end session endpoint can be used to trigger single sign-out in the browser (see [spec](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)).

To use the end session endpoint a client application will redirect the user's browser to the end session URL.
All applications that the user has logged into via the browser during the user's session can participate in the sign-out.

The URL for the end session endpoint is available via discovery.

* ***id_token_hint***

    When the user is redirected to the endpoint, they will be prompted if they really want to sign-out. 
    This prompt can be bypassed by a client sending the original *id_token* received from authentication.
    This is passed as a query string parameter called *id_token_hint*.

* ***post_logout_redirect_uri***

    If a valid *id_token_hint* is passed, then the client may also send a *post_logout_redirect_uri* parameter.
    This can be used to allow the user to redirect back to the client after sign-out.
    The value must match one of the client's pre-configured *PostLogoutRedirectUris*.

* ***state***

    If a valid *post_logout_redirect_uri* is passed, then the client may also send a *state* parameter.
    This will be returned back to the client as a query string parameter after the user redirects back to the client.
    This is typically used by clients to round-trip state across the redirect.


```
    GET /connect/endsession?id_token_hint=...&post_logout_redirect_uri=http%3A%2F%2Flocalhost%3A7017%2Findex.html
```

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically create end sessions request URLs from .NET code. 

```cs
var ru = new RequestUrl("https://demo.duendesoftware.com/connect/end_session");

var url = ru.CreateEndSessionUrl(
    idTokenHint: "...",
    postLogoutRedirectUri: "...");
```
