+++
title = "API Endpoints"
weight = 40
chapter = true
+++

# Securing and Accessing API Endpoints

A typical frontend application will call two types of APIs:

**frontend exclusive APIs (local APIs)**

These APIs only exist to support the specific frontend; they are not shared with other frontends. They are typically located in the BFF host and can be called directly by the frontend.

**shared APIs (remote APIs)**

These APIs are deployed on a different host than the BFF, typically because they need to be shared between multiple frontends or (more generally speaking) multiple clients. These APIs can only be called via the BFF host acting as a proxy.