---
title: Calling the Registration Endpoint
weight: 20
---

The registration endpoint is invoked by making an HTTP POST request to the /connect/dcr endpoint with a json payload containing metadata describing the desired client as described in [RFC 7591](https://datatracker.ietf.org/doc/rfc7591/) and [OpenID Connect Dynamic Client Registration 1.0](https://openid.net/specs/openid-connect-registration-1_0.html).

The supported metadata properties are listed in the reference section on the [*DynamicClientRegistrationRequest* model](reference/models#dynamicclientregistrationrequest). A mixture of standardized and IdentityServer-specific properties are supported. Most standardized properties that are applicable to the client credentials or code flow grants (the two grants we support) are supported. Where IdentityServer's configuration model includes important properties that are not standardized, we have included those properties as extensions. For example, there are no standardized properties describing token lifetimes, so the dynamic client registration endpoint adds *absolute_refresh_token_lifetime*, *access_token_lifetime*, *identity_token_lifetime*, etc.