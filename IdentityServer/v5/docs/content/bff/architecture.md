---
title: "Architecture"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

A BFF host is an ASP.NET Core application with the following logical building blocks:

![](../images/BFF_blocks.png?height=30pc)

These components deal with server-side protocol requests and responses, session and token management as well as providing and securing API endpoints for the frontend.

In addition, the host serves the UI assets which could be HTML/JS/CSS, WASM, and/or server-rendered content.

Plain ASP.NET Core provides a good starting point to inject the additional security and application features that are typically associated with a BFF. This is where Duende.BFF comes in. We fill those gaps and add advanced functionality so you only have to focus on providing the application logic, and not the security logic:

![](../images/DuendeBFF_blocks.png?height=30pc)

**ASP.NET OpenID Connect Handler**

We leverage the built-in OpenID Connect handler for OIDC and OAuth protocol processing. We are both a long-term user and contributor of this library and think this is a very well implemented and flexible protocol library.

**ASP.NET Cookie Handler**

This library takes care of session management in ASP.NET Core. It has a good set of features around security (claims, cookie security features, digital signatures and encryption), provides both absolute and sliding session support, and has a good extensibility model. We leverage the library to add server-side session management and back-channel logout support.

On top of the cookie handler, we provide endpoints for login, logout and user/session data and query.

**IdentityModel.AspNetCore**

This library plugs into both the OpenID Connect and cookie handler to provide automatic access token management and storage. It provides both an imperative API as well as integration with the ASP.NET HTTP client factory.

**API Endpoints**

The frontend will call APIs. Frontend exclusive APIs can live directly in the BFF host. Remote (e.g. cross-site) APIs are called via the backend. Both types need to be secured with the session cookie and anti-forgery protection.

The remote API interfaces can be either created manually, or a reverse proxy approach can be used. Duende.BFF includes a developer-centric version of Microsoft's YARP proxy that integrates with the automatic token management mentioned above.

**Frontend**

The UI can be delivered over various mechanisms, e.g. via the ASP.NET static files middleware, MVC/Razor or server/WASM Blazor.
