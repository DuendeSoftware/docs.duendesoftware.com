---
title: "SAML Endpoints"
description: Details of the SAML 2.0 protocol endpoints registered by IdentityServer, including metadata, sign-in, and logout.
date: 2026-05-21
sidebar:
  label: Endpoints
  order: 31
---

When SAML 2.0 support is enabled via `AddSaml()`, IdentityServer registers the following SAML
protocol endpoints under the `/Saml2` path prefix.

## Endpoint Summary

| Endpoint         | Path                  | HTTP Methods | Enabled by `AddSaml()` |
|------------------|-----------------------|--------------|--------------------|
| Metadata         | `/Saml2`              | GET          | ✅ Yes                    |
| Sign-in          | `/Saml2/SSO`          | GET, POST    | ✅ Yes                    |
| Sign-in Callback | `/Saml2/SSO/Callback` | GET          | ✅ Yes                    |
| Logout           | `/Saml2/SLO`          | GET, POST    | ✅ Yes                    |
| Logout Callback  | `/Saml2/SLO/Callback` | GET          | ✅ Yes                    |

The endpoints are disabled until you call `AddSaml()`. You can disable an individual endpoint by setting the matching `EndpointsOptions.EnableSaml*Endpoint` flag (for example, `EnableSamlMetadataEndpoint`) to `false`.

For the services that implement these endpoints, see the [SAML metadata](/identityserver/reference/v8/saml/saml-metadata-services.md) and [SAML logout](/identityserver/reference/v8/saml/saml-logout-services.md) reference pages.

## Metadata Endpoint

**Path**: `/Saml2`  
**Methods**: GET

Returns the IdentityServer SAML 2.0 Identity Provider metadata document (an XML document). Service
Providers use this document to discover the IdP's signing certificates, supported NameID formats,
and endpoint locations.

SAML metadata enables automated federation setup. Instead of manually exchanging certificates and endpoint URLs out-of-band,
Service Providers import the IdP's metadata document to configure trust automatically. This is the standard mechanism 
for onboarding new Service Providers into a federation. See [Metadata](/identityserver/saml/concepts.md#metadata) for more background.

Share this URL with Service Providers during SP configuration so they can automatically import
IdP settings.

## Sign-in Endpoint

**Path**: `/Saml2/SSO`  
**Methods**: GET, POST

The entry point for SP-initiated SSO. The Service Provider redirects the user to this endpoint
with a SAML `AuthnRequest` message (encoded using the HTTP Redirect or HTTP POST binding).

IdentityServer validates the `AuthnRequest`, authenticates the user (redirecting to the login page
if needed), and then continues to the Sign-in Callback endpoint.

### Profile active check

During SSO, IdentityServer calls [`IProfileService.IsActiveAsync`](/identityserver/reference/v8/services/profile-service.md)
to verify the user's account is still active. If `IsActiveAsync` sets `IsActive` to `false`, the SSO flow does not continue:

* For passive authentication requests (`IsPassive=true`), IdentityServer returns a SAML error response to the SP with a `NoPassive` status code.
* For all other requests, IdentityServer redirects the user to the login page.

This check runs on every SSO request, including when the user already has an active session. You can use it to block access
for disabled or locked accounts without waiting for the session to expire.

## Sign-in Callback Endpoint

**Path**: `/Saml2/SSO/Callback`  
**Methods**: GET

Processes the outcome of user authentication during SP-initiated SSO. After the user authenticates,
this endpoint builds the SAML `Response` (containing the `Assertion`) and delivers it to the
Service Provider's Assertion Consumer Service (ACS) URL using the HTTP-POST binding.

## Logout Endpoint

**Path**: `/Saml2/SLO`  
**Methods**: GET, POST

Handles incoming SAML Single Logout (SLO) requests and responses. Service Providers send a SAML
`LogoutRequest` message to this endpoint to initiate logout, or a `LogoutResponse` after processing
a logout notification from IdentityServer. IdentityServer validates a `LogoutRequest` and starts the logout
flow, which ends the user's IdentityServer session and coordinates logout across all other SPs. A `LogoutResponse`
from an SP is recorded against the logout session that is waiting for it.

IdentityServer tracks which SPs have active sessions for the user. After receiving a `LogoutRequest`,
it sends `LogoutRequest` messages to all other SPs with active sessions. It then collects their
responses and, if some SPs were skipped, do not respond, or return an error, returns a partial logout status to the
originating SP to indicate that not all sessions were successfully terminated.

## Logout Callback Endpoint

**Path**: `/Saml2/SLO/Callback`  
**Methods**: GET

Completes the SAML SLO round-trip after all Service Providers have been notified. This endpoint
processes the aggregated results of the logout notifications and sends the final `LogoutResponse`
back to the SP that initiated the logout flow.

As each SP returns a `LogoutResponse` (to the [Logout endpoint](#logout-endpoint)), IdentityServer records the result. If an SP was skipped, hasn't responded, or reported a failure by the time the logout flow completes, IdentityServer returns a partial
logout status to the originating SP to indicate that some sessions may still be active.

:::note
SAML Single Logout is inherently complex: it requires coordinated session termination across every SP that participated in the user's session. Partial failures are common. An SP may be unreachable, slow to respond, or the user may close the browser before all notifications complete, leaving some SPs with an active session while others consider it terminated. See [Single Logout](/identityserver/saml/concepts.md#single-logout-slo) for more background.
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

## Observability

All SAML endpoints emit [audit events](/identityserver/diagnostics/events.md#saml-events) and
[telemetry counters](/identityserver/diagnostics/otel.mdx#telemetrymetricscounterssamlsso) for
monitoring and troubleshooting. The SSO and SLO endpoints also participate in distributed tracing
through the `Duende.IdentityServer` activity source.
