---
title: "SAML IdP-Initiated SSO Service"
description: "Reference for IIdpInitiatedSsoService and IdpInitiatedSsoResult, which create SAML responses for IdP-initiated single sign-on."
date: 2026-11-16
sidebar:
  label: "SAML IdP-Initiated SSO"
  order: 8
---

#### Duende.IdentityServer.Saml.IIdpInitiatedSsoService

Creates a SAML response for an authenticated user without a preceding `AuthnRequest`. IdentityServer has no built-in endpoint for this flow; call the service from your own page or endpoint. The caller is responsible for anti-forgery protection.

```csharp
public interface IIdpInitiatedSsoService
{
    Task<IdpInitiatedSsoResult> CreateResponseAsync(
        HttpContext httpContext, string spEntityId, string? relayState, CancellationToken ct);

    Task<IdpInitiatedSsoResult> CreateResponseAsync(
        HttpContext httpContext, string spEntityId, CancellationToken ct);
}
```

## IdpInitiatedSsoResult

| Member | Description |
|---|---|
| `IsError` | `true` when the response couldn't be created. |
| `Error` | The error, when `IsError` is `true`. |
| `SpEntityId` | The entity ID of the SP. |
| `Response` | An `IResult` that auto-submits the response to the SP's ACS URL using HTTP-POST. |
| `Success(IResult, string)` / `Failure(string)` / `Failure(string, string)` | Factory methods. |

In a minimal API, return `result.Response`.

## Default behavior

The default implementation, `DefaultIdpInitiatedSsoService`, succeeds when:

* the SP exists, is enabled, and has `AllowIdpInitiated` set;
* an ACS URL is available (the default one, or the first) and it's an absolute URL;
* the user is authenticated;
* the relay state is no longer than `SamlOptions.MaxRelayStateLength` bytes (UTF-8, default 80);
* the SP's resources resolve through [`ISamlResourceResolver`](/identityserver/reference/v8/saml/saml-resource-resolver.md).

The response is always delivered by HTTP-POST. The default implementation also registers the SP session so single logout works.

## Registration

The service is registered by `AddSaml()` (transient). Inject it where needed; there's no need to replace it.
