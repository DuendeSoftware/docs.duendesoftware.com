---
title: "Basics"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

This solution contains a collection of common scenarios.

[link to source code]({{< param samples_base >}}/Basics)

### Client Credentials Flow Sample (with shared secret)
This sample shows how to use the *client_credentials* grant type. This is typically used for machine to machine communication.

### JWT-based Client Authentication
This sample shows how to use the *client_credentials* grant type with JWT-based client authentication. This authentication method is more recommended than shared secrets.

### Introspection & Reference Tokens
This sample shows how to use the reference tokens instead of JWTs.

Things of interest

* the client registration uses *AccessTokenType* of value *Reference*
* the client requests *scope2* - this scope is part of an API resource.
  * API resources allow defining API secrets, which can then be used to access the introspection endpoint
* The API supports both JWT and reference tokens, this is achieved by forwarding the token to the right handler at runtime

### MVC Client Sample
This sample shows how to use the *authorization_code* grant type. This is typically used for interactive applications like web applications.

### MVC Client with automatic Access Token Management
This sample shows how to use [IdentityModel.AspNetCore](https://identitymodel.readthedocs.io/en/latest/aspnetcore/overview.html) to automatically manage access tokens.

The sample uses a special client ID in the sample IdentityServer with a short token lifetime (75 seconds). When repeating the API call, make sure you inspect the returned *iat* and *exp* claims to observer how the token is slides.

You can also turn on debug tracing to get more insights in the token management library.

### MVC Client with JAR and JWT-based Authentication
This sample shows how to use [JAR](https://docs.duendesoftware.com/identityserver/v5/advanced/jar/) to sign the authorize request, and JWT-based [authentication](https://docs.duendesoftware.com/identityserver/v5/tokens/authentication/jwt/) for clients in MVC. It also show how to integrate that technique with automatic token management.

### Interactive MVC Client with Back-Channel Logout Notifications
This sample shows how to use back-channel logout notifications.
