---
title: Stores
date: 2020-09-10T08:20:20+02:00
sidebar:
  label: Overview
  order: 1
description: Index
redirect_from:
  - /identityserver/v5/reference/stores/
  - /identityserver/v6/reference/stores/
  - /identityserver/v7/reference/stores/
---

Stores in IdentityServer are the persistence layer abstractions responsible for managing various types of data needed
for the authentication and authorization processes. They provide interfaces to store and retrieve configuration and
operational data.

Common types of stores include:

* Client store - manages client application registrations
* Resource store - handles API resources and scopes
* Persisted grant store - maintains operational data like authorization codes and refresh tokens
* User store - manages user authentication data (typically integrated with ASP.NET Identity)

IdentityServer provides default in-memory implementations of these stores for development scenarios, and extensibility
points to implement custom stores using various database technologies for production environments.


