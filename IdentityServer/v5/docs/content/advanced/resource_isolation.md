---
title: "Resource Isolation"
date: 2020-09-10T08:22:12+02:00
weight: 14
---

{{% notice note %}}
This is an Enterprise Edition feature.
{{% /notice %}}

OAuth itself only knows about scopes - the (API) resource concept does not exist from a pure protocol point of view. This means that all the requested scope and audience combination get merged into a single access token. This has a couple of downsides, e.g.

* tokens can become very powerful (and big)
    * if such a token leaks, it allows access to multiple resources
* resource within that single token might have conflicting settings, e.g.
    * user claims of all resources share the same token
    * resource specific processing like signing or encryption algorithms conflict
* without sender-constraints, a resource could potentially re-use (or abuse) a token to call another contained resource directly

To solve this problem [RFC 8707](https://tools.ietf.org/html/rfc8707) adds an additional request parameter for the authorize and token endpoint called *resource*. This allows requesting a token for a specific resource (in other words - making sure the audience claim has a single value only).