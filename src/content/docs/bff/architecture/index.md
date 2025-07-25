---
title: "Architecture"
description: Overview of BFF host architecture, including authentication, session management, and integration with ASP.NET Core components
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 1
  label: "Overview"
redirect_from:
  - /bff/v2/architecture/
  - /bff/v3/architecture/
  - /identityserver/v5/bff/architecture/
  - /identityserver/v6/bff/architecture/
  - /identityserver/v7/bff/architecture/
---

A BFF host is an ASP.NET Core application, tied to a single browser based application. It performs the following
functions:

* Authenticate the user using OpenID Connect
* Manages the user's session using Secure Cookies and optional Server-side Session Management.
* Optionally, provides access to the UI assets.
* Server-side Token Management
* Blazor support with unified authentication state management across rendering modes.

## Authentication Flow

The following diagram shows how the BFF protects browser-based applications:

![BFF Security Framework Architecture Overview](../images/bff_application_architecture.svg)


* **Authentication flows**: The server handles the authentication flows. There are specific endpoints for login / logout. While the browser is involved with these authentication flows, because the user is redirected to and from the identity provider, the browser-based application will never see the authentication tokens. These are exchanged for a code on the server only. 
* **Cookies**: After successful authentication, a cookie is added. This cookie protects all subsequent calls to the APIs. When using this type of authentication, **CSRF protection** is very important. 
* **Access to APIs**: The BFF can expose embedded APIs (which are hosted by the BFF itself) or proxy calls to remote APIs (which is more common in a microservice environment). While proxying, it will exchange the authentication cookie for an access token. 
* **Session Management**: The BFF can manage the users session. This can either be cookie-based session management or storage-based session management. 


## Internals
Duende.BFF builds on widely used tools and frameworks, including ASP.NET Core's OpenID Connect and cookie authentication
handlers, YARP, and [Duende.AccessTokenManagement](/accesstokenmanagement/index.mdx). Duende.BFF combines these tools and adds additional security and
application features that are useful with a BFF architecture so that you can focus on providing application logic
instead of security logic:

![Duende BFF Security Framework - components](../images/bff_blocs.svg)

### ASP.NET OpenID Connect Handler

Duende.BFF uses ASP.NET's OpenID Connect handler for OIDC and OAuth protocol processing. As long-term users of and
contributors to this library, we think it is a well implemented and flexible implementation of the protocols.

### ASP.NET Cookie Handler

Duende.BFF uses ASP.NET's Cookie handler for session management. The cookie handler provides a claims-based identity to
the application persisted in a digitally signed and encrypted cookie that is protected with modern cookie security
features, including the Secure, HttpOnly and SameSite attributes. The handler also provides absolute and sliding session
support, and has a flexible extensibility model, which Duende.BFF uses to
implement [server-side session management](/bff/fundamentals/session/server-side-sessions/)
and [back-channel logout support](/bff/fundamentals/session/management/back-channel-logout/).

### Duende.AccessTokenManagement

Duende.BFF uses the Duende.AccessTokenManagement library for access token management and storage. This includes storage
and retrieval of tokens, refreshing tokens as needed, and revoking tokens on logout. The library provides integration
with the ASP.NET HTTP client to automatically attach tokens to outgoing HTTP requests, and its underlying management
actions can also be programmatically invoked through an imperative API.

### API Endpoints

In the BFF architecture, the frontend makes API calls to backend services via the BFF host exclusively. Typically, the
BFF acts as a reverse proxy to [remote APIs](/bff/fundamentals/apis/remote), providing session and token management.
Implementing local APIs within the BFF host is also [possible](/bff/fundamentals/apis/local). Regardless, requests to
APIs are authenticated with the session cookie and need to be secured with an anti-forgery protection header.

### YARP

Duende.BFF proxies requests to remote APIs using Microsoft's YARP (Yet Another Reverse Proxy). You can set up YARP using
a simplified developer-centric configuration API provided by Duende.BFF, or if you have more complex requirements, you
can use the full YARP configuration system directly. If you are using YARP directly, Duende.BFF
provides [YARP integration](/bff/fundamentals/apis/yarp) to add BFF security and identity features.

### UI Assets

The BFF host typically serves at least some of the UI assets of the frontend, which can be HTML/JS/CSS, WASM, and/or
server-rendered content. Serving the UI assets, or at least the index page of the UI from the same origin as the backend
simplifies requests from the frontend to the backend. Doing so makes the two components same-origin, so that browsers
will allow requests with no need to use CORS and automatically include cookies (including the crucial authentication
cookie). This also avoids issues where [third-party cookie blocking](/bff/architecture/third-party-cookies) or the
SameSite cookie attribute prevents the frontend from sending the authentication cookie to the backend.

It is also possible to separate the BFF and UI and host them separately. See [here](/bff/architecture/ui-hosting) for
more discussion of UI hosting architecture.

### Blazor Support

Blazor based applications have unique challenges when it comes to authentication state. It's possible to mix various
rendering models in a single application. Auto mode even starts off server rendered, then transitions to WASM when the
code has loaded.

BFF Security Framework has built support for Blazor, where it helps to unify access to authentication state and to
secure access to backend services. 
