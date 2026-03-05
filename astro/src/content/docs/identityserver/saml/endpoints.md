---
title: "SAML Endpoints"
description: Details of the SAML 2.0 protocol endpoints registered by IdentityServer, including metadata, sign-in, logout, and IdP-initiated SSO.
date: 2026-03-02
sidebar:
  label: Endpoints
  order: 30
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

When SAML 2.0 support is enabled via `AddSaml()`, IdentityServer registers the following SAML
protocol endpoints under the `/saml` path prefix.

## Endpoint Summary

| Endpoint          | Path                    | HTTP Methods | Enabled by Default |
| ----------------- | ----------------------- | ------------ | ------------------ |
| Metadata          | `/saml/metadata`        | GET          | ✅ Yes             |
| Sign-in           | `/saml/signin`          | GET, POST    | ✅ Yes             |
| Sign-in Callback  | `/saml/signin_callback` | GET, POST    | ✅ Yes             |
| IdP-initiated SSO | `/saml/idp-initiated`   | GET, POST    | ❌ No (opt-in)     |
| Logout            | `/saml/logout`          | GET, POST    | ✅ Yes             |
| Logout Callback   | `/saml/logout_callback` | GET, POST    | ✅ Yes             |

## Metadata Endpoint

**Path**: `/saml/metadata`  
**Methods**: GET

Returns the IdentityServer SAML 2.0 Identity Provider metadata document (an XML document). Service
Providers use this document to discover the IdP's signing certificates, supported NameID formats,
and endpoint locations.

Share this URL with Service Providers during SP configuration so they can automatically import
IdP settings.

## Sign-in Endpoint

**Path**: `/saml/signin`  
**Methods**: GET, POST

The entry point for SP-initiated SSO. The Service Provider redirects the user to this endpoint
with a SAML `AuthnRequest` message (encoded using the HTTP-Redirect or HTTP-POST binding).

IdentityServer validates the `AuthnRequest`, authenticates the user (redirecting to the login page
if needed), and then continues to the Sign-in Callback endpoint.

## Sign-in Callback Endpoint

**Path**: `/saml/signin_callback`  
**Methods**: GET, POST

Processes the outcome of user authentication during SP-initiated SSO. After the user authenticates,
this endpoint builds the SAML `Response` (containing the `Assertion`) and delivers it to the
Service Provider's Assertion Consumer Service (ACS) URL using the configured binding.

## IdP-Initiated SSO Endpoint

**Path**: `/saml/idp-initiated`  
**Methods**: GET, POST  
**Enabled by default**: No — requires explicit opt-in

Supports IdP-initiated SSO flows, where the IdP starts the authentication without receiving an
`AuthnRequest` from the SP. The SP must have `AllowIdpInitiated = true` set in its
`SamlServiceProvider` configuration.

To enable this endpoint:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Endpoints.EnableSamlIdpInitiatedEndpoint = true;
});
```

:::caution
IdP-initiated SSO carries additional security risks because there is no `AuthnRequest` to validate.
Enable it only for Service Providers that explicitly require it.
:::

## Logout Endpoint

**Path**: `/saml/logout`  
**Methods**: GET, POST

Handles incoming SAML Single Logout (SLO) requests from Service Providers. The SP sends a SAML
`LogoutRequest` message to this endpoint. IdentityServer processes the request, terminates the
user's IdentityServer session, and sends front-channel logout notifications to other registered
SPs.

## Logout Callback Endpoint

**Path**: `/saml/logout_callback`  
**Methods**: GET, POST

Processes SAML `LogoutResponse` messages returned by Service Providers after they have processed a
logout notification from IdentityServer. This endpoint completes the SAML SLO round-trip.

## Customizing Endpoint Paths

Endpoint paths can be customized via `SamlOptions.UserInteraction`:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Saml.UserInteraction.Route = "/saml";
    options.Saml.UserInteraction.Metadata = "/metadata";
    options.Saml.UserInteraction.SignInPath = "/signin";
    options.Saml.UserInteraction.SignInCallbackPath = "/signin_callback";
    options.Saml.UserInteraction.IdpInitiatedPath = "/idp-initiated";
    options.Saml.UserInteraction.SingleLogoutPath = "/logout";
    options.Saml.UserInteraction.SingleLogoutCallbackPath = "/logout_callback";
});
```

See [SAML Configuration](/identityserver/saml/configuration/) for full path option documentation.
