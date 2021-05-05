+++
title = "API Endpoints"
weight = 40
chapter = true
+++

# Securing and Accessing API Endpoints

A typical frontend application will call two types of APIs:

**frontend exclusive APIs (local APIs)**

These APIs only exist to support the specific frontend - they are not shared with other frontends. They are typically located in the BFF host and can be called directly by the frontend.

**shared APIs (remote APIs)**

These APIs are shared between multiple frontends - or generally speaking, multiple clients. They are typically deployed on a different server, and can only be called via the BFF host.