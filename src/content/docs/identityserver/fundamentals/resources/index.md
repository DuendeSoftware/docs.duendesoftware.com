---
title: Resources
date: 2020-09-10T08:20:20+02:00
sidebar:
  order: 1
  label: Overview
description: Overview of resource types in Duende IdentityServer including API resources, identity resources, API scopes, and resource isolation concepts
redirect_from:
  - /identityserver/v5/fundamentals/resources/
  - /identityserver/v6/fundamentals/resources/
  - /identityserver/v7/fundamentals/resources/
---

The ultimate job of Duende IdentityServer is to control access to resources.

## API Resources

In Duende IdentityServer, the *ApiResource* class allows for some additional organization and grouping and
isolation of scopes and providing some common settings.

[Read More](/identityserver/fundamentals/resources/api-resources/)

## Identity Resources

An identity resource is a named group of claims about a user that can be requested using the *scope* parameter.

The OpenID Connect specification [suggests](https://openid.net/specs/openid-connect-core-1_0.html#scopeclaims) a couple
of standard
scope name to claim type mappings that might be useful to you for inspiration, but you can freely design them yourself.

[Read More](/identityserver/fundamentals/resources/identity)

## API Scopes

Designing your API surface can be a complicated task. Duende IdentityServer provides a couple of primitives to help you
with that.

The original OAuth 2.0 specification has the concept of scopes, which is just defined as *the scope of access* that the
client requests.
Technically speaking, the *scope* parameter is a list of space delimited values - you need to provide the structure and
semantics of it.

In more complex systems, often the notion of a *resource* is introduced. This might be e.g. a physical or logical API.
In turn each API can potentially have scopes as well. Some scopes might be exclusive to that resource, and some scopes
might be shared.

[Read More](/identityserver/fundamentals/resources/api-scopes/)

## Resources Isolation

OAuth itself only knows about scopes - the (API) resource concept does not exist from a pure protocol point of view.
This means that all the requested scope and audience combination get merged into a single access token. This has a
couple of downsides, e.g.

* tokens can become very powerful (and big)
    * if such a token leaks, it allows access to multiple resources
* resources within that single token might have conflicting settings, e.g.
    * user claims of all resources share the same token
    * resource specific processing like signing or encryption algorithms conflict
* without sender-constraints, a resource could potentially re-use (or abuse) a token to call another contained resource
  directly

To solve this problem [RFC 8707](https://tools.ietf.org/html/rfc8707) adds another request parameter for the
authorize and token endpoint called *resource*. This allows requesting a token for a specific resource (in other words -
making sure the audience claim has a single value only, and all scopes belong to that single resource).

[Read More](/identityserver/fundamentals/resources/isolation)
