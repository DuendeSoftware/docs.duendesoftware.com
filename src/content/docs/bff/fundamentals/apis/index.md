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

A frontend application using the BFF pattern can call two types of APIs:

#### Embedded (local) APIs

These APIs embedded inside the BFF and typically exist to support the BFF's frontend; they are not shared with other frontends or services. 

See [Embedded apis](local.mdx) for more information. 

#### Proxying to Remote APIs

These APIs are deployed on a different host than the BFF, which allows them to be shared between multiple frontends or (more generally speaking) multiple clients. These APIs can only be called via the BFF host acting as a proxy.

You can use [Direct Forwarding](./remote.md) for most scenarios. If you have more complex requirements, you can also directly interact with [YARP](./yarp.md)
