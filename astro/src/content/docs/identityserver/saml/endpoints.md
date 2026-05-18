---
title: "SAML Endpoints"
description: Details of the SAML 2.0 protocol endpoints registered by IdentityServer, including metadata, sign-in, logout, and IdP-initiated SSO.
date: 2026-05-15
sidebar:
  label: Endpoints
  order: 30
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>

When SAML 2.0 support is enabled via `AddSaml()`, IdentityServer registers the following SAML
protocol endpoints under the `/Saml2` path prefix.

## Endpoint Summary

| Endpoint         | Path                  | HTTP Methods | Enabled by Default |
|------------------|-----------------------|--------------|--------------------|
| Metadata         | `/Saml2`              | GET          | ✅ Yes              |
| Sign-in          | `/Saml2/SSO`          | GET, POST    | ✅ Yes              |
| Sign-in Callback | `/Saml2/SSO/Callback` | GET, POST    | ✅ Yes              |
| Logout           | `/Saml2/SLO`          | GET, POST    | ✅ Yes              |
| Logout Callback  | `/Saml2/SLO/Callback` | GET, POST    | ✅ Yes              |

## Metadata Endpoint

**Path**: `/Saml2`  
**Methods**: GET

Returns the IdentityServer SAML 2.0 Identity Provider metadata document (an XML document). Service
Providers use this document to discover the IdP's signing certificates, supported NameID formats,
and endpoint locations.

SAML metadata enables automated federation setup. Instead of manually exchanging certificates and endpoint URLs out-of-band, Service Providers import the IdP's metadata document to configure trust automatically. This is the standard mechanism for onboarding new Service Providers into a federation. See [Metadata](/identityserver/saml/concepts.md#metadata) for more background.

Share this URL with Service Providers during SP configuration so they can automatically import
IdP settings.

## Sign-in Endpoint

**Path**: `/Saml2/SSO`  
**Methods**: GET, POST

The entry point for SP-initiated SSO. The Service Provider redirects the user to this endpoint
with a SAML `AuthnRequest` message (encoded using the HTTP-Redirect or HTTP-POST binding).

IdentityServer validates the `AuthnRequest`, authenticates the user (redirecting to the login page
if needed), and then continues to the Sign-in Callback endpoint.

## Sign-in Callback Endpoint

**Path**: `/Saml2/SSO/Callback`  
**Methods**: GET, POST

Processes the outcome of user authentication during SP-initiated SSO. After the user authenticates,
this endpoint builds the SAML `Response` (containing the `Assertion`) and delivers it to the
Service Provider's Assertion Consumer Service (ACS) URL using the configured binding.

## Logout Endpoint

**Path**: `/Saml2/SLO`  
**Methods**: GET, POST

Handles incoming SAML Single Logout (SLO) requests and responses. Service Providers send a SAML
`LogoutRequest` message to this endpoint to initiate logout, or a `LogoutResponse` after processing
a logout notification from IdentityServer. IdentityServer processes the request, terminates the
user's IdentityServer session, and coordinates logout across all other SPs.

IdentityServer tracks which SPs have active sessions for the user. After receiving a `LogoutRequest`,
it sends `LogoutRequest` messages to all other SPs with active sessions. It then collects their
responses and, if some SPs do not respond or return an error, returns a partial logout status to the
originating SP to indicate that not all sessions were successfully terminated.

## Logout Callback Endpoint

**Path**: `/Saml2/SLO/Callback`  
**Methods**: GET, POST

Completes the SAML SLO round-trip after all Service Providers have been notified. This endpoint
processes the aggregated results of the logout notifications and sends the final `LogoutResponse`
back to the SP that initiated the logout flow.

As each SP returns a `LogoutResponse`, IdentityServer records the result. If not all SPs with active
sessions have responded by the time the logout flow completes, IdentityServer returns a partial
logout status to the originating SP to indicate that some sessions may still be active.

:::note
SAML Single Logout is inherently complex: the process requires coordinated session termination across every SP that participated in the user's session. Partial failures are common. An SP may be unreachable, slow to respond, or the user may close the browser before all notifications complete, leaving some SPs with an active session while others consider the session terminated. Many deployments supplement SLO with short session lifetimes as a simpler fallback. See [Single Logout](/identityserver/saml/concepts.md#single-logout) for more background.
:::

## Customizing Endpoint Paths

Endpoint paths can be customized via `SamlOptions.Endpoints`:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml(saml =>
    {
        saml.Endpoints.SingleSignOnServicePath = "/Saml2/SSO";
        saml.Endpoints.SingleSignOnCallbackPath = "/Saml2/SSO/Callback";
        saml.Endpoints.SingleLogoutServicePath = "/Saml2/SLO";
        saml.Endpoints.SingleLogoutCallbackPath = "/Saml2/SLO/Callback";
    });
```

See [`SamlEndpointOptions`](/identityserver/saml/configuration.md#samlendpointoptions) for the full property reference.
