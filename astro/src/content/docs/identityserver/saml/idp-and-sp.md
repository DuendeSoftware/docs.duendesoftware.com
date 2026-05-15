---
title: Identity Provider and Service Provider
description: Learn about the two SAML roles IdentityServer can play, acting as an Identity Provider (IdP) or a Service Provider (SP), and when to use each.
date: 2026-05-15
sidebar:
  label: IdP and SP
  order: 2
---

IdentityServer can participate in SAML 2.0 in two distinct roles: as an Identity Provider, or as a Service Provider.
Understanding which role you need determines which part of the documentation to follow.

Most deployments use one role or the other, but both can be active at the same time.

## Acting as an Identity Provider

When IdentityServer acts as an Identity Provider (IdP), it issues SAML assertions to Service Providers.
Service Providers redirect users to IdentityServer for authentication, and IdentityServer returns a signed SAML assertion confirming
the user's identity.

This is the most common setup. You configure IdentityServer to trust one or more SPs, and those SPs delegate authentication to IdentityServer.

See [SAML Identity Provider setup and configuration](/identityserver/saml/index.md) to get started.

## Acting as a Service Provider

When IdentityServer acts as a Service Provider (SP), it consumes SAML assertions from an external IdP. IdentityServer redirects
users to the external IdP for authentication, then processes the resulting assertion to establish a local session.

This is useful when you need to federate with enterprise systems like ADFS or Shibboleth. In this setup, IdentityServer
is a consumer of SAML, not a producer.

See [SAML Service Provider setup](/identityserver/ui/login/saml-provider.md) to get started.