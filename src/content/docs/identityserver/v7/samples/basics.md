---
title: "Basics"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

This solution contains a collection of common scenarios.

### Client Credentials
This sample shows how to use the `client_credentials` grant type. This is typically used for machine to machine communication.

Key takeaways:

* how to request a token using client credentials
* how to use a shared secret
* how to use access token

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/ClientCredentials)

### JWT-based Client Authentication
This sample shows how to use the `client_credentials` grant type with JWT-based client authentication. This authentication method is more recommended than shared secrets.

Key takeaways:

* create a JWT for client authentication
* use a JWT as a client secret replacement
* configure IdentityServer to accept a JWT as a client secret

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/JwtBasedClientAuthentication)

### Introspection & Reference Tokens
This sample shows how to use the reference tokens instead of JWTs.

Things of interest:

* the client registration uses `AccessTokenType` of value `Reference`
* the client requests `scope2` - this scope is part of an API resource.
  * API resources allow defining API secrets, which can then be used to access the introspection endpoint
* The API supports both JWT and reference tokens, this is achieved by forwarding the token to the right handler at runtime

Key takeaways:

* configuring a client to receive reference tokens
* setup an API resource with an API secret
* configure an API to accept and validate reference tokens

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/Introspection)

### MVC Client Sample
This sample shows how to use the `authorization_code` grant type. This is typically used for interactive applications like web applications.

Key takeaways:

* configure an MVC client to use IdentityServer
* access tokens in ASP.NET Core's authentication session
* call an API
* manually refresh tokens

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/MvcBasic)

### MVC Client with automatic Access Token Management
This sample shows how to use [Duende.AccessTokenManagement](https://github.com/DuendeSoftware/Duende.AccessTokenManagement/wiki) to automatically manage access tokens.

The sample uses a special client in the sample IdentityServer with a short token lifetime (75 seconds). When repeating the API call, make sure you inspect the returned `iat` and `exp` claims to observer how the token is slides.

You can also turn on debug tracing to get more insights in the token management library.

Key takeaways:

* use Duende.AccessTokenManagement to automate refreshing tokens

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/MvcTokenManagement)

### MVC Client with JAR and JWT-based Authentication
This sample shows how to use signed authorize requests, and JWT-based authentication for clients in MVC. It also show how to integrate that technique with automatic token management.

Key takeaways:

* use the ASP.NET Core extensibility points to add signed authorize requests and JWT-based authentication
* use JWT-based authentication for automatic token management
* configure a client in IdentityServer to share key material for both front- and back-channel

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/MvcJarJwt)

### MVC Client with Back-Channel Logout Notifications
This sample shows how to use back-channel logout notifications.

Key takeaways:

* how to implement the back-channel notification endpoint
* how to leverage events on the cookie handler to invalidate the user session

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/MvcBackChannelLogout)

### MVC Client with Pushed Authorization Requests
This sample shows how to use [Pushed Authorization Requests](/identityserver/v7/tokens/par) (PAR).

Key takeaways:

* how to enable PAR in the client configuration
* how to add support for PAR to the ASP.NET OIDC authentication handler. The main idea is to use the events in the handler to push the parameters before redirecting to the authorize endpoint, and then replace the parameters that would normally be sent in that redirect with the resulting request uri. See the `ParOidcEvents.cs` file for more details.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Basics/MvcPar)
