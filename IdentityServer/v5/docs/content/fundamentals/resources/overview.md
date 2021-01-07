---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

The ultimate job of Duende IdentityServer is to control access to resources.

The two fundamental resource types in IdentityServer are:

* **identity resources** 

    represent claims about a user like user ID, display name, email address etc…

* **API resources** 

    represent functionality a client wants to access. Typically, they are HTTP-based endpoints (aka APIs), but could be also message queuing endpoints or similar.