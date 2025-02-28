---
title: "Overview"
description: "BFF Security Framework"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

# Introduction

Single-Page Applications (SPAs) are increasingly common, offering rich functionality within the browser. The landscape of front-end development has evolved rapidly in recent years, with new frameworks and ever changing browser security requirements. Consequently, best practices for securing these applications have also shifted dramatically. 

While implementing OAuth logic directly in the browser was once considered acceptable, this is no longer recommended. Storing any authentication state in the browser (such as access tokens) has proven to be inherently risky (see Threats against browser based applications). Because of this, the IETF is currently [recommending](See: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps#name-history-of-oauth-20-in-brow). delegating all authentication logic to a server based host via a Backend-For-Frontend pattern as the preferred approach to securing modern web applications. 

## The Backend For Frontend Pattern
The BFF pattern (Backend-For-Frontend) pattern states that every browser based application should also have a server side application that handles all authentication requirements, including performing authentication flows and securing access to api’s. 

The server will now expose http endpoints that the browser can use to login, logout or interrogate the active session. With this, the browser based application can trigger an authentication flow by redirecting to a ur, such as /bff/login. Once the authentication process is completed, the server places a secure authentication cookie in the browser. This cookie is then used to authenticate all subsequent requests, until the user is logged out again. 

The BFF should expose all api’s that the front-end wants to access securely. So it can either host api’s locally, or act as a reverse proxy towards external api’s. 

With this approach, the browser based application will not have direct access to the access token. So if the browser based application is compromised, for example with XSS attacks, there is no risk of the attacker stealing the access tokens. 

As the name of this pattern already implies, the BFF backend is the (only) Backend for the Frontend. They should be considered part of the same application. It should only expose the api’s that the front-end needs to function. 

## 3rd party cookies
In recent years, several browsers (notably Safari and Firefox) have started to block 3rd party cookies. Chrome is planning to do the same in the future. While this is done for valid privacy reasons, it also limits some of the functionality a browser based application can provide. A couple of particularly notable OIDC flows that don’t work for SPAs when third party cookies are blocked are OIDC Session Management and OIDC Silent Login via the prompt=none parameter.

## CSRF protection
There is one thing to keep an eye out for with this pattern, and that’s Cross Site Request Forgery (CSRF). The browser automatically sends the authentication cookie for safe-listed cross origin requests, which exposes the application to CORS Attacks. Fortunately, this threat can easily be mitigated by a BFF solution by requiring a custom header to be passed along. See more on CORS protection.


# The Duende BFF framework

Duende.BFF is a library for building services that comply with the BFF pattern and solve security and identity problems in browser based applications such as SPAs and Blazor based applications. It is used to create a backend host that is paired with a frontend application. This backend is called the Backend For Frontend (BFF) host, and is responsible for all of the OAuth and OIDC protocol interactions. It completely implements the latest recommendations from the IETF with regards to security for browser based applications. 

It offers the following functionality:
* Protection from Token Extraction attacks
* Built-in CSRF Attack protection
* Server Side OAuth2 Authentication
* User Management api’s
* Back-channel logout
* Securing access to both local and external Api’s by serving as a reverse proxy. 
* Server side Session State Management
* Blazor Authentication State Management

## The BFF Framework in an application architecture

The following diagram illustrates how the Duende BFF Security Framework fits into a typical application architecture. 

![doc](../images/bff_application_architecture.svg)

The browser based application runs inside the browser’s secure sandbox. It can be built using any type of front-end technology, such as via Vanilla-JS, React, Vue, WebComponents, Blazor, etc. 

When the user wants to log in, the app can redirect the browser to the authentication endpoints. This will trigger an OpenID Connect authentication flow, at the end of which, it will place an authentication cookie in the browser. This cookie has to be a HTTP Only Same Site and Secure cookie. This makes sure that the browser application cannot get the contents of the cookie, which makes stealing the session much more difficult. 

The browser will now automatically add the authentication cookie to all calls to the BFF, so all calls to the api’s are secured. This means that local api’s are already automatically secured. 

The app cannot access external Api’s directly, because the authentication cookie won’t be sent to 3rd party applications. To overcome this, the BFF can proxy requests through the BFF host, while exchanging the authentication cookie for a bearer token that’s issued from the identity provider. This can be configured to include or exclude the user’s credentials. 

As mentioned earlier, the BFF needs protection against CSRF attacks, because of the nature of using authentication cookies. While .net has various built-in methods for protecting against CSRF attacks, they often require a bit of work to implement. The easiest way to protect (just as effective as the .Net provided security mechanisms) is just to require the use of a custom header. The BFF Security framework by default requires the app to add a custom header called x-csrf=1 to the application. Just the fact that this header must be present is enough to protect the BFF from CSRF attacks. 

## Logical and Physical Sessions

When implemented correctly, a user will think of their time interacting with a solution as _"one session"_ also known as the **"logical session"**. The user should not be concerned with the steps developers take to provide a seamless experience. Users want to use the app, get their tasks completed, and log out happy. 

{{<mermaid align="center">}}
sequenceDiagram
    actor Alice
    Alice->>App: /login
    App->>Alice: /account
    box logical session
        participant App
    end
{{< /mermaid >}}

So while the user will only see only (and care about) a single session, it's entirely possible that there will be multiple physical sessions active. For most distributed applications, including those implemented with BFF, **sessions are managed independently by each component of an application architecture.** This means that there are **N+1** physical sessions possible, where **N** is the number of sessions for each service in your solution, and the **+1** being the session managed on the BFF host. Since we are focusing on ASP.NET Core, those sessions typically are stored using the Cookie Authentication handler features of .NET.

{{< mermaid >}}
sequenceDiagram
    actor Alice
    Alice->>App: /login
    App->>Alice: /account
    App->>Service 1: request
    App-->>Service N...: N... request
    box App session    
        participant App
    end
    box Service 1 session
        participant Service 1
    end
    box Service N... session
        participant Service N...
    end
{{< /mermaid >}}

The separation allows each service to manage its session to its specific needs. While it can depend on your requirements, we find most developers want to coordinate the physical session lifetimes, creating a more predictable logical session. If that is your case, we recommend you first start by turning each physical session into a more powerful [server-side session]({{< ref "/session/server_side_sessions" >}}). 

Server-side sessions are instances that are persisted to data storage and allow for visibility into currently active sessions and better management techniques. Let's take a look at the advantages of server-side sessions. Server-side sessions at each component allows for:

- Receiving back channel logout notifications
- Forcibly end a user's session of that node
- Store and view information about a session lifetime
- Coordinate sessions across an application's components 
- Different claims data 

Server-side sessions at IdentityServer allow for more powerful features:

- Receive back channel logout notifications from upstream identity providers in a federation
- Forcibly end a user's session at IdentityServer
- Global inactivity timeout across SSO apps and session coordination
- Coordinate sessions to registered clients

Keep in mind the distinctions between logical and physical sessions and you will better understand the interplay between elements in your solution.