---
title: "Architecture"
date: 2020-09-10T08:22:12+02:00
weight: 10
---



A BFF host is an ASP.NET Core application with components to 
- Handle OIDC and OAuth protocol requests and responses on the server-side
- Manage user sessions and token
- Provide and securing API endpoints for the frontend

![](../images/BFF_blocks.png?height=30pc)

In addition, the host typically serves the UI assets of the frontend, which can be HTML/JS/CSS, WASM, and/or server-rendered content. Serving the UI assets from the same host as the backend simplifies the sharing of cookie credentials, but other hosting architectures are [possible]({{< ref "#frontend" >}}).

ASP.NET Core provides a starting point to which Duende.BFF adds the additional security and application features that are typically needed in a BFF. We fill the gaps and add advanced functionality so you can focus on implementing the application logic rather than worrying about security logic:

![](../images/DuendeBFF_blocks.png?height=30pc)

## ASP.NET OpenID Connect Handler
We use ASP.NET's built-in OpenID Connect handler for OIDC and OAuth protocol processing. As both long-term users of and contributors to this library, we think it is a well implemented and flexible implementation of the protocols.

## ASP.NET Cookie Handler
We also use ASP.NET's built-in Cookie handler for session management in ASP.NET Core. 
It has a good set of security features, including claims, cookie security features, digital signatures and encryption, provides both absolute and sliding session support, and has a good extensibility model. Duende.BFF uses the extensibility points of the Cookie Handler to implement server-side session management and back-channel logout support.

To interact with the session cookie, we provide endpoints for login, logout, and retrieval of user and session data.

## IdentityModel.AspNetCore
Duende.BFF uses the IdentityModel.AspNetCore library to provide automatic access token management. This includes storage and retrieval of tokens, refreshing tokens as needed, and revoking tokens on logout. The library provides  integration with the ASP.NET HTTP client to automatically attach tokens to outgoing HTTP requests, and its underlying management actions can also be programmatically invoked through an imperative API.

## API Endpoints
In the BFF architecture, the frontend makes API calls to backend services via the BFF host exclusively. API endpoints made specifically for the frontend can be implemented directly in the BFF host using standard ASP.NET abstractions, such as API controllers and minimal API endpoints. Remote, that is cross-site, APIs can also be called through the backend. Remote APIs can either be invoked manually, or a reverse proxy approach can be used. In either case, requests need to be secured with the session cookie and anti-forgery protection.

Duende.BFF includes a developer-centric version of Microsoft's YARP proxy that integrates with the Duende.BFF automatic token management features. We also provide YARP-specific plumbing to add the BFF features to "standard" YARP directly.

## Frontend
The frontend can be hosted from the BFF host or separately. Hosting together with the BFF is the simplest choice, as requests from the front end to the backend will automatically include the authentication cookie and not require CORS headers. This approach typically makes use of Visual Studio's SPA templates that start up the SPA and proxy requests to it. Samples that take this approach using [React]({{< ref "/samples/bff#reactjs-frontend" >}}) and [Angular]({{< ref "/samples/bff#angular-frontend" >}}) are available. 

If you would prefer to run the SPA outside of the C# project, you can host the frontend separately. Cross site requests from the frontend to the backend can be made by [using CORS]({{< ref "/samples/bff#separate-host-for-ui" >}}) or the existence of multiple hosts can be hidden behind a proxy. 
