---
title: Securing and Accessing API Endpoints
description: Learn about the different types of APIs in a BFF architecture and how to secure and access them properly
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /bff/v2/apis/
  - /bff/v3/fundamentals/apis/
  - /identityserver/v5/bff/apis/
  - /identityserver/v6/bff/apis/
  - /identityserver/v7/bff/apis/
---

A frontend application using the BFF pattern can call two types of APIs:

#### Remote APIs

These APIs are deployed on a different host than the BFF, which allows them to be shared between multiple frontends or (more generally speaking) multiple clients. These APIs can only be called via the BFF host acting as a proxy.

#### Local APIs

These APIs only exist to support the specific frontend; they are not shared with other frontends or services. They are located in the BFF host and can be called directly by the frontend.
