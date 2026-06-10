---
title: "The Big Picture"
description: "An overview of modern application architecture patterns and how OpenID Connect and OAuth 2.0 protocols implemented by IdentityServer solve authentication and API access challenges"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 1
redirect_from:
  - /identityserver/v5/overview/big_picture/
  - /identityserver/v6/overview/big_picture/
  - /identityserver/v7/overview/big_picture/
---

Most modern applications look more or less like this:

```mermaid
---
title: Modern Application Architecture
---
flowchart LR
    Browser@{ icon: "material-symbols:tabs-rounded", label: "Browser", shape: icon }
    NativeApp@{ icon: "material-symbols:phone-android-rounded", label: "Native App", shape: icon }
    ServerApp@{ icon: "material-symbols:computer-rounded", label: "Server / App", shape: icon }
    Backend@{ icon: "material-symbols:storage-rounded", label: "Backend", shape: icon }
    API_main@{ icon: "material-symbols:api-rounded", label: "API", shape: icon }
    API_top@{ icon: "material-symbols:api-rounded", label: "API", shape: icon }
    API_tail@{ icon: "material-symbols:api-rounded", label: "API", shape: icon }

    Browser --> Backend
    Browser --> API_main
    Backend --> API_top
    Backend --> API_main
    NativeApp --> API_main
    ServerApp --> API_main
    API_main --> API_tail
```


The most common interactions are:

* Browsers communicate with web applications
* Web applications communicate with web APIs (sometimes on their own, sometimes on behalf of a user)
* Browser-based applications communicate with web APIs
* Native applications communicate with web APIs
* Server-based applications communicate with web APIs
* Web APIs communicate with web APIs (sometimes on their own, sometimes on behalf of a user)

Typically, each and every layer (front-end, middle-tier and back-end) has to protect resources and
implement authentication and/or authorization – often against the same user store.

Outsourcing these fundamental security functions to a security token service prevents duplicating that functionality
across those applications and endpoints.

Restructuring the application to support a security token service leads to the following architecture and protocols:

```mermaid
---
title: Protocols Used Within Architecture
---
flowchart LR
    Browser@{ icon: "material-symbols:tabs-rounded", label: "Browser (OIDC)", shape: icon }
    NativeApp@{ icon: "material-symbols:phone-android-rounded", label: "Native App (OIDC)", shape: icon }
    ServerApp@{ icon: "material-symbols:computer-rounded", label: "Server / App", shape: icon }
    Backend@{ icon: "material-symbols:storage-rounded", label: "Backend", shape: icon }
    API_main@{ icon: "material-symbols:api-rounded", label: "API", shape: icon }
    API_top@{ icon: "material-symbols:api-rounded", label: "API", shape: icon }
    API_tail@{ icon: "material-symbols:api-rounded", label: "API", shape: icon }

    Browser -- OIDC --> Backend
    Browser -- OAUTH --> API_main
    Backend -- OAUTH --> API_top
    Backend -- OAUTH --> API_main
    NativeApp -- OAUTH --> API_main
    ServerApp -- OAUTH --> API_main
    API_main -- OAUTH --> API_tail
```

Such a design divides security concerns into two parts:

## Authentication

Authentication is needed when an application needs to know the identity of the current user.
Typically, these applications manage data on behalf of that user and need to make sure that this user can only
access the data for which they are allowed. The most common example for that is (classic) web applications –
but native and JS-based applications also have a need for authentication.

The most common authentication protocols are SAML2p, WS-Federation and OpenID Connect – SAML2p being the
most popular and the most widely deployed.

OpenID Connect is the newest of the three, but is considered to be the future because it has the
most potential for modern applications. It was built for mobile application scenarios right from the start
and is designed to be API friendly.

## API Access

Applications have two fundamental ways with which they communicate with APIs – using the application identity,
or delegating the user’s identity. Sometimes both methods need to be combined.

OAuth 2.0 is a protocol that allows applications to request access tokens from a security token service and use them
to communicate with APIs. This delegation reduces complexity in both the client applications and the APIs since
authentication and authorization can be centralized.

## OpenID Connect And OAuth 2.0 – Better Together!

OpenID Connect and OAuth 2.0 are very similar – in fact OpenID Connect is an extension on top of OAuth 2.0.
The two fundamental security concerns, authentication and API access, are combined into a single protocol - often with a
single round trip to the security token service.

We believe that the combination of OpenID Connect and OAuth 2.0 is the best approach to secure modern
applications for the foreseeable future. Duende IdentityServer is an implementation of these two protocols and is
highly optimized to solve the typical security problems of today’s mobile, native and web applications.

## How Duende IdentityServer Can Help

Duende IdentityServer is middleware that adds spec-compliant OpenID Connect and OAuth 2.0 endpoints to an arbitrary
ASP.NET Core host.

Typically, you build (or re-use) an application that contains login and logout pages (and optionally a consent page,
depending on your needs)
and add the IdentityServer middleware to that application. The middleware adds the necessary protocol heads to the
application so that clients can talk to it using those standard protocols.

```mermaid
---
title: ASP.NET Core Middleware Configuration
---
flowchart LR
    login@{ icon: "material-symbols:login-rounded", label: "login", shape: icon }
    logout@{ icon: "material-symbols:logout-rounded", label: "logout", shape: icon }
    more@{ icon: "material-symbols:pending", label: "more...", shape: icon }
    authorize@{ icon: "material-symbols:verified-user-rounded", label: "authorize", shape: icon }
    token@{ icon: "material-symbols:key-rounded", label: "token", shape: icon }
    discovery@{ icon: "material-symbols:travel-explore-rounded", label: "discovery", shape: icon }

    subgraph ASPNET["ASP.NET Core Request Pipeline"]
        direction TB
        subgraph IS[" "]
            is_space@{ icon: "material-symbols:security-rounded", label: "IdentityServer Middleware", shape: icon }
        end
        subgraph YC[" "]
            yc_space@{ icon: "material-symbols:code-rounded", label: "Your Code", shape: icon }
        end
    end

    login --> YC
    logout --> YC
    more --> YC
    authorize --> IS
    token --> IS
    discovery --> IS

    style YC stroke:#74acfb,stroke-width:2px
    style IS stroke:#61fb92,stroke-width:2px
```

The hosting application can be as complex as you want, but we typically recommend to keep the attack surface as small as
possible by including
authentication/federation related UI only.
