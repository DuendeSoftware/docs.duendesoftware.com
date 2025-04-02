---
title: Securing and Accessing API Endpoints
sidebar:
  label: API Endpoints
  order: 40
---

A frontend application using the BFF pattern can call two types of APIs:

#### Remote APIs

These APIs are deployed on a different host than the BFF, which allows them to be shared between multiple frontends or (more generally speaking) multiple clients. These APIs can only be called via the BFF host acting as a proxy.

#### Local APIs

These APIs only exist to support the specific frontend; they are not shared with other frontends or services. They are located in the BFF host and can be called directly by the frontend.
