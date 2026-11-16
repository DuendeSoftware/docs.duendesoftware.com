---
title: "SAML IdP-Initiated SSO Service"
description: "Reference for IIdpInitiatedSsoService and IdpInitiatedSsoResult, which create SAML responses for IdP-initiated single sign-on."
date: 2026-11-16
sidebar:
  label: "SAML IdP-Initiated SSO"
  order: 8
---

#### Duende.IdentityServer.Saml.IIdpInitiatedSsoService

Service for generating IdP-initiated SSO responses. The host calls this from a portal page (or similar UI) where the user is already authenticated. The service validates the target SP, generates a signed SAML response, and returns an `IdpInitiatedSsoResult` that either contains an `IResult` the host returns from its endpoint, or an error the host can display in its portal UI.

Because the user is already authenticated when this service is called, the IdP-initiated flow does not redirect to the login page. The SAML response is generated immediately and sent via the appropriate binding (e.g., HTTP-POST).

* **Anti-forgery:** This service does not perform anti-forgery validation itself. The caller (typically a Razor Page or MVC action) is responsible for protecting the endpoint that invokes this service with standard ASP.NET Core anti-forgery tokens or equivalent protection.
* **Replay protection:** IdP-initiated SSO responses do not contain an `InResponseTo` attribute because there is no prior `AuthnRequest` to reference. This is inherent to the IdP-initiated profile (SAML Profiles §4.1.4.5). Service providers are responsible for enforcing one-time use of assertion IDs to mitigate replay attacks.

IdentityServer has no built-in endpoint for this flow, so call the service from your own page or endpoint.

```csharp
public interface IIdpInitiatedSsoService
{
    Task<IdpInitiatedSsoResult> CreateResponseAsync(
        HttpContext httpContext, string spEntityId, string? relayState, CancellationToken ct);

    Task<IdpInitiatedSsoResult> CreateResponseAsync(
        HttpContext httpContext, string spEntityId, CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `CreateResponseAsync(httpContext, spEntityId, relayState, ct)` | Creates a SAML response for IdP-initiated SSO to the specified service provider. `httpContext` is the current HTTP context, used to resolve services and write the response via the binding. `spEntityId` is the entity ID of the target service provider. `relayState` is the optional relay state to include in the SAML response. `ct` is the cancellation token. Returns a result containing either an `IResult` that writes the SAML response via the binding, or an error with a descriptive message. |
| `CreateResponseAsync(httpContext, spEntityId, ct)` | Creates a SAML response for IdP-initiated SSO to the specified service provider, without a relay state. It takes the same parameters as the other overload, minus `relayState`, and returns the same kind of result. |

## IdpInitiatedSsoResult

The result of an IdP-initiated SSO operation. Either a success containing an `IResult` that writes the SAML response via the appropriate binding, or an error with a descriptive message the host can display in its portal UI.

| Member | Description |
|---|---|
| `IsError` | Gets a value indicating whether the operation failed. |
| `Error` | Gets the error description when `IsError` is `true`. |
| `SpEntityId` | Gets the entity ID of the target service provider, when available. |
| `Response` | Gets the `IResult` that writes the SAML response to the browser via the appropriate binding (e.g., HTTP-POST auto-submit form). Return it directly from a minimal API endpoint. In a Razor Page handler, await `result.Response.ExecuteAsync(HttpContext)` and then return an `EmptyResult`. `null` when `IsError` is `true`. With the default implementation, the response is auto-submitted to the SP's ACS URL using HTTP-POST. |
| `Success(response, spEntityId)` | Creates a successful result containing the SAML response. `response` is the `IResult` that writes the SAML response. Custom implementations are responsible for ensuring the result produces a properly signed SAML response via the appropriate binding. `spEntityId` is the entity ID of the target service provider. |
| `Failure(error, spEntityId)` | Creates a failure result with an error description. `error` is a description of why the operation failed. `spEntityId` is the entity ID of the target service provider, if known. |
| `Failure(error)` | Creates a failure result with an error description, without a known SP entity ID. |

The result has no public constructor.

In a minimal API, return `result.Response`.

## Default behavior

Default implementation of `IIdpInitiatedSsoService`. Validates the target SP, generates a signed SAML response, records the SP session for SLO, and returns an `IdpInitiatedSsoResult` containing the HTML auto-POST form. The default implementation, `DefaultIdpInitiatedSsoService`, succeeds when:

* the SP exists, is enabled, and has `AllowIdpInitiated` set;
* an ACS URL is available (the default one, or the first) and it's an absolute URL;
* the user is authenticated;
* the relay state is no longer than `SamlOptions.MaxRelayStateLength` bytes (UTF-8, default 80);
* the SP's resources resolve through [`ISamlResourceResolver`](/identityserver/reference/v8/saml/saml-resource-resolver.md).

The response is always delivered by HTTP-POST, and the SP session is registered so single logout works.

## Registration

`AddSaml()` registers this service, so you can inject it into your own page or endpoint.
