---
title: "Remote APIs"
order: 20
newContentUrl: "https://docs.duendesoftware.com/bff/v3/fundamentals/apis/remote/"
---

A _Remote API_ is an API that is deployed separately from the BFF host. Remote APIs use access tokens to authenticate and authorize requests, but the frontend does not possess an access token to make requests to remote APIs directly. Instead, all access to remote APIs is proxied through the BFF, which authenticates the frontend using its authentication cookie, obtains the appropriate access token, and forwards the request to the Remote API with the token attached.

There are two different ways to set up Remote API proxying in Duende.BFF. This page describes the built-in simple HTTP forwarder. Alternatively, you can integrate Duende.BFF with Microsoft's reverse proxy [YARP](yarp), which allows for more complex reverse proxy features provided by YARP combined with the security and identity features of Duende.BFF.

## Simple HTTP forwarder

Duende.BFF's simple HTTP forwarder maps routes in the BFF to a remote API surface. It uses [Microsoft YARP](https://github.com/microsoft/reverse-proxy) internally, but is much simpler to configure than YARP. The intent is to provide a developer-centric and simplified way to proxy requests from the BFF to remote APIs when more complex reverse proxy features are not needed.

These routes receive automatic anti-forgery protection and integrate with automatic token management.

To enable this feature, add a reference to the *Duende.BFF.Yarp* NuGet package, add the remote APIs service to DI, and call the *MapRemoteBFFApiEndpoint* method to create the mappings.

### Add Remote API Service to DI

```cs
builder.Services.AddBff()
    .AddRemoteApis();
```

### Map Remote APIs
Use the *MapRemoteBffApiEndpoint* extension method to describe how to map requests coming into the BFF out to remote APIs and the *RequireAccessToken* method to specify token requirements. *MapRemoteBffApiEndpoint* takes two parameters: the base path of requests that will be mapped externally, and the address to the external API where the requests will be mapped. *MapRemoteBffApiEndpoint* maps a path and all sub-paths below it. The intent is to allow easy mapping of groups of URLs. For example, you can set up mappings for the /users, /users/{userId}, /users/{userId}/books, and /users/{userId}/books/{bookId} endpoints like this:

```cs
app.MapRemoteBffApiEndpoint("/api/users", "https://remoteHost/users")
    .RequireAccessToken(TokenType.User);
```

:::note
This example opens up the complete */users* API namespace to the frontend and thus to the outside world. Try to be as specific as possible when designing the forwarding paths.
:::

## Securing Remote APIs
Remote APIs typically require access control and must be protected against threats such as [CSRF (Cross-Site Request Forgery)](https://developer.mozilla.org/en-US/docs/Glossary/CSRF) attacks. 

To provide access control, you can specify authorization policies on the mapped routes, and configure them with access token requirements.

To defend against CSRF attacks, you should use SameSite cookies to authenticate calls from the frontend to the BFF. As an additional layer of defense, APIs mapped with *MapRemoteBffApiEndpoint* are automatically protected with an anti-forgery header. 

### SameSite cookies
[The SameSite cookie attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value) is a feature of modern browsers that restricts cookies so that they are only sent to pages originating from the [site](https://developer.mozilla.org/en-US/docs/Glossary/Site) where the cookie was originally issued. This prevents CSRF attacks and helps with improving privacy, because cross site requests will no longer implicitly include the user's credentials.

This is a good first layer of defense, but makes the assumption that you can trust all subdomains of your site. All subdomains within a registrable domain are considered the same site for purposes of SameSite cookies. Thus, if another application hosted on a subdomain within your site is infected with malware, it can make CSRF attacks against your application.


### Anti-forgery header

For this reason, remote APIs automatically require an additional custom header on API endpoints. For example:

```text
GET /endpoint

x-csrf: 1
```

The value of the header is not important, but its presence, combined with the cookie requirement, triggers a CORS preflight request for cross-origin calls. This effectively isolates the caller to the same origin as the backend, providing a robust security guarantee. 

### Require authorization

The *MapRemoteBffApiEndpoint* method returns the appropriate type to integrate with the ASP.NET Core authorization system. You can attach authorization policies to remote endpoints using **RequireAuthorization**, just as you would for a standard ASP.NET core endpoint created with *MapGet*, and the authorization middleware will then enforce that policy before forwarding requests on that route to the remote endpoint.

### Access token requirements

Remote APIs sometimes allow anonymous access, but usually require an access token, and the type of access token (user or client) will vary as well. You can specify access token requirements via the **RequireAccessToken** extension method. Its **TokenType** parameter has three options:

* ***User***

    A valid user access token is required and will be forwarded to the remote API. A user access token is an access token obtained during an OIDC flow (or subsequent refresh), and is associated with a particular user. User tokens are obtained when the user initially logs in, and will be automatically refreshed using a refresh token when they expire.

* ***Client***

    A valid client access token is required and will be forwarded to the remote API. A client access token is an access token obtained through the client credentials flow, and is associated with the client application, not any particular user. Client tokens can be obtained even if the user is not logged in.

* ***UserOrClient***

    Either a valid user access token or a valid client access token (as fallback) is required and will be forwarded to the remote API.

You can also use the *WithOptionalUserAccessToken* extension method to specify that the API should be called with a user access token if one is available and anonymously if not.

:::note
These settings only specify the logic that is applied before the API call gets proxied. The remote APIs you are calling should always specify their own authorization and token requirements.
:::
