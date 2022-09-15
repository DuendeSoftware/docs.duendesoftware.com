---
title: "Glossary"
date: 2020-09-10T08:22:12+02:00
weight: 70
---

## Automatic key management
(Business Edition)

The automatic key management feature creates and manages key material for signing tokens and follows best practices for handling this key material, including storage and rotation.

[More details](https://blog.duendesoftware.com/posts/20201028_key_management/)

[Documentation]({{<ref "/fundamentals/keys" >}})


## Server-side Session Management
(Business Edition)

The server-side session management feature extends the ASP.NET Core cookie authentication handler to maintain a user's authentication session state in a server-side store, rather than putting it all into a self-contained cookie. Using server-side sessions enables more architectural features in your IdentityServer, such as:

* query and manage active user sessions (e.g. from an administrative app).
* detect session expiration and perform cleanup both in IdentityServer as well as in client apps.
* centralize and monitor session activity in order to achieve a system-wide inactivity timeout.

[More details](https://blog.duendesoftware.com/posts/20220406_session_management/)

[Documentation]({{<ref "/ui/server_side_sessions" >}})


## BFF Security Framework
(Business Edition)

The Duende BFF (Backend for Frontend) security framework packages up guidance and the necessary components to secure browser-based frontends (e.g. SPAs or Blazor WASM applications) with ASP.NET Core backends.

[More details](https://blog.duendesoftware.com/posts/20210326_bff/)

[Documentation]({{<ref "/bff" >}})


## Dynamic Authentication Providers
(Enterprise Edition)

The dynamic configuration feature allows dynamic loading of configuration for OpenID Connect providers from a store.
This is designed to address the performance concern as well as allowing changes to the configuration to a running server.

[More details](https://blog.duendesoftware.com/posts/20210517_dynamic_providers/)

[Documentation]({{<ref "/ui/login/dynamicproviders" >}})



## Resource isolation
(Enterprise Edition)

The resource isolation feature allows a client to request access tokens for an individual resource server.
This allows API-specific features such as access token encryption and isolation of APIs that are not in the same trust boundary.

[More details](https://blog.duendesoftware.com/posts/20201230_resource_isolation/)

[Documentation]({{<ref "/fundamentals/resources/isolation" >}})


## CIBA
(Enterprise Edition)

Duende IdentityServer supports the Client-Initiated Backchannel Authentication Flow (also known as CIBA).
This allows a user to login with a higher security device (e.g. their mobile phone) than the device on which they are using an application (e.g. a public kiosk).
CIBA is one of the requirements to support the Financal-grade API compliance.

[More details](https://blog.duendesoftware.com/posts/20220107_ciba/)

[Documentation]({{<ref "/ui/ciba" >}})


## Single Deployment
A single deployment acts as a single OpenID Connect / OAuth authority hosted at a single URL. It can consist of multiple physical or virtual nodes for load-balancing or fail-over purposes.


## Multiple Deployment
Can be either completely independent single deployments, or a single deployment that acts as multiple authorities on multiple URLs or host names (e.g. for branding, isolation or multi-tenancy reasons).

## Client

A client is a piece of software that requests tokens from your IdentityServer - either for authenticating a user (requesting an identity token) or for accessing a resource (requesting an access token). A client must be first registered with your IdentityServer before it can request tokens.

There are many different client types, e.g. web applications, native mobile or desktop applications, SPAs, server processes, etc.

[More details]({{< ref "/fundamentals/clients" >}})
