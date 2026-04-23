---
title: Securing and Accessing API Endpoints
description: Learn about the different types of APIs in a BFF architecture and how to secure and access them properly
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /bff/apis/
  - /bff/v2/apis/
  - /bff/v3/fundamentals/apis/
  - /identityserver/v5/bff/apis/
  - /identityserver/v6/bff/apis/
  - /identityserver/v7/bff/apis/
---

A frontend application using the BFF pattern can call two types of APIs: embedded (local) APIs, and proxied remote APIs.

## Choosing an API Approach

```mermaid
flowchart TD
    Q1{"Is the API only used<br/>by this frontend?"}
    Q2{"Do you need load balancing,<br/>service discovery, or<br/>complex routing/transforms?"}

    Local["✅ Embedded (Local) API<br/>Host the API inside the BFF itself"]
    Remote["✅ Remote API — Direct Forwarding<br/>MapRemoteBffApiEndpoint()"]
    Yarp["✅ YARP Integration<br/>Full YARP configuration with BFF extensions"]

    Q1 -->|Yes| Local
    Q1 -->|No| Q2
    Q2 -->|Yes| Yarp
    Q2 -->|No| Remote
```

Use the table below for additional guidance on token requirements:

| Scenario | Recommended approach |
|---|---|
| API is only used by this frontend | [Embedded (Local) API](local.mdx) |
| API is shared by multiple clients or deployed separately | [Remote API — Direct Forwarding](remote.mdx) |
| Complex routing, load balancing, or transforms are needed | [YARP](yarp.md) |
| API requires the logged-in user's token | Remote or YARP with `RequiredTokenType.User` |
| API uses machine-to-machine (client credentials) auth | Remote or YARP with `RequiredTokenType.Client` |
| API is publicly accessible (no auth required) | Remote with `RequiredTokenType.None` |
| API should use user token if logged in, anonymous otherwise | Remote or YARP with `RequiredTokenType.UserOrNone` |

:::tip[Start with local APIs when in doubt]
If the API only serves this one frontend and doesn't need to be independently deployed or versioned, embed it directly in the BFF host as a local API. It's the simplest approach and benefits from full CSRF protection with minimal configuration.
:::

## Embedded (Local) APIs

These APIs are embedded inside the BFF and typically exist to support the BFF's frontend; they are not shared with other frontends or services. 

See [Embedded APIs](local.mdx) for more information. 

## Proxying Remote APIs

These APIs are deployed on a different host than the BFF, which allows them to be shared between multiple frontends or (more generally speaking) multiple clients. These APIs can only be called via the BFF host acting as a proxy.

You can use [Direct Forwarding](remote.mdx) for most scenarios. If you have more complex requirements, you can also directly interact with [YARP](yarp.md).

## See Also

- [Token Management](/bff/fundamentals/tokens/) — How BFF attaches access tokens to outgoing API calls
- [Access Token Management](/accesstokenmanagement/) — The underlying token lifecycle library
- [IdentityServer API Resources](/identityserver/fundamentals/resources/api-resources/) — Configuring scopes for your APIs

