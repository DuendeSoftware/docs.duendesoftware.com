---
title: "Architecture"
date: 2020-09-10T08:22:12+02:00
order: 10
chapter: true
---

A BFF host is an ASP.NET Core application with the following components:



![](../images/BFF_blocks.png?height=30pc)


These components handle OIDC and OAuth protocol requests and responses, manage user sessions and tokens, secure API endpoints for the front end, and optionally serve UI assets.

Duende.BFF builds on widely used tools and frameworks, including ASP.NET Core's OpenID Connect and cookie authentication handlers, YARP, and Duende.AccessTokenManagment. Duende.BFF combines these tools and adds additional security and application features that are useful with a BFF architecture so that you can focus on providing application logic instead of security logic:

![](../images/DuendeBFF_blocks.png?height=30pc)

#### ASP.NET OpenID Connect Handler
Duende.BFF uses ASP.NET's OpenID Connect handler for OIDC and OAuth protocol processing. As long-term users of and contributors to this library, we think it is a well implemented and flexible implementation of the protocols.

#### ASP.NET Cookie Handler
Duende.BFF uses ASP.NET's Cookie handler for session management. The Cookie handler provides a claims-based identity to the application persisted in a digitally signed and encrypted cookie that is protected with modern cookie security features, including the Secure, HttpOnly and SameSite attributes. The handler also provides absolute and sliding session support, and has a flexible extensibility model, which Duende.BFF uses to implement [server-side session management](../bff/session/server_side_sessions) and [back-channel logout support](../bff/session/management/back-channel-logout).

#### Duende.AccessTokenManagement
Duende.BFF uses the Duende.AccessTokenManagement library for access token management and storage. This includes storage and retrieval of tokens, refreshing tokens as needed, and revoking tokens on logout. The library provides integration with the ASP.NET HTTP client to automatically attach tokens to outgoing HTTP requests, and its underlying management actions can also be programmatically invoked through an imperative API.

#### API Endpoints
In the BFF architecture, the frontend makes API calls to backend services via the BFF host exclusively. Typically the BFF acts as a reverse proxy to [remote APIs](../bff/apis/remote), providing session and token management. Implementing local APIs within the BFF host is also [possible](../bff/apis/local). Regardless, requests to APIs are authenticated with the session cookie and need to be secured with an anti-forgery protection header.

#### YARP
Duende.BFF proxies requests to remote APIs using Microsoft's YARP (Yet Another Reverse Proxy). You can set up YARP using a simplified developer-centric configuration API provided by Duende.BFF, or if you have more complex requirements, you can use the full YARP configuration system directly. If you are using YARP directly, Duende.BFF provides [YARP integration](../bff/apis/yarp) to add BFF security and identity features.

#### UI Assets
The BFF host typically serves at least some of the UI assets of the frontend, which can be HTML/JS/CSS, WASM, and/or server-rendered content. Serving the UI assets, or at least the index page of the UI from the same origin as the backend simplifies requests from the frontend to the backend. Doing so makes the two components same-origin, so that browsers will allow requests with no need to use CORS and automatically include cookies (including the crucial authentication cookie). This also avoids issues where [third-party cookie blocking](../bff/architecture/third-party-cookies) or the SameSite cookie attribute prevents the frontend from sending the authentication cookie to the backend. 

It is also possible to separate the BFF and UI and host them separately. See [here](../bff/architecture/ui-hosting) for more discussion of UI hosting architecture. 

