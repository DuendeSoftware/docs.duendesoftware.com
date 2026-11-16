---
title: "SAML Authentication Context"
description: "Reference for SamlAuthenticationContext, the SAML-specific authentication context returned by IIdentityServerInteractionService."
date: 2026-11-16
sidebar:
  label: "SAML Authentication Context"
  order: 15
---

#### Duende.IdentityServer.Saml.Models.SamlAuthenticationContext

Represents contextual information about a SAML authentication request, extracted from `SamlAuthenticationState` for use by login UI pages. Mirrors the OIDC `AuthorizationRequest` pattern.

It's a sealed class implementing `IAuthenticationContext`. `IIdentityServerInteractionService.GetAuthenticationContextAsync` returns it for a SAML sign-in request.

```csharp
var context = await _interaction.GetAuthenticationContextAsync(returnUrl, HttpContext.RequestAborted);

if (context is SamlAuthenticationContext samlContext)
{
    var sp = samlContext.ServiceProvider;
}
```

| Property | Type | Description |
|---|---|---|
| `ServiceProvider` | `SamlServiceProvider` | The service provider that initiated the authentication request. |
| `IdP` | `string?` | The external identity provider requested. Used to bypass home realm discovery (HRD). It's the IdP entity ID from the `Scoping` element. Populated only when the `IDPList` contains exactly one entry. Otherwise it's `null`. The default `AuthnRequestValidator` rejects requests that contain a `Scoping` element, so this is only populated when a custom validator accepts them. |
| `LoginHint` | `string?` | The expected username the user will use to login. It's the `NameID` value from the `AuthnRequest` `Subject`, if present. |
| `Tenant` | `string?` | The tenant requested. It's taken from the first `AuthnContextClassRef` that starts with `tenant:`, with the prefix removed. |
| `PromptModes` | `IEnumerable<string>` | The prompt modes requested (e.g. "login", "none"). Maps to OIDC prompt parameter values and SAML `ForceAuthn`/`IsPassive` flags. For SAML, the value is `login` when `ForceAuthn` is set and `none` when `IsPassive` is set. |
| `RelayState` | `string?` | The `RelayState` parameter from the original SAML request. |
| `IsIdpInitiated` | `bool` | Indicates whether this is an IdP-initiated SSO flow (no `AuthnRequest`). |
| `RequestedAuthnContext` | `StoredRequestedAuthnContext?` | The requested authentication context from the `AuthnRequest`, if present. It has `Comparison` (`string`), `AuthnContextClassRef` (`List<string>`), `AuthnContextDeclRef` (`List<string>`). |
| `StateId` | `Guid` | The identifier of the stored SAML authentication state entry. Used by `IIdentityServerInteractionService.DenyAuthenticationAsync` to write denial information back to the state store (see [SAML sign-in state store](/identityserver/reference/v8/saml/saml-signin-state-store.md)). It travels in the return URL query parameter named by `SamlEndpointOptions.StateIdParameterName` (default `samlStateId`). |

Through `IAuthenticationContext`, `Application` (the application that initiated the authentication request) returns the service provider as an `IConnectedApplication`.

To reject a request from the login page, call `DenyAuthenticationAsync`. See [Denying authentication](/identityserver/ui/login/context.md#denying-authentication).

### Deny error mapping

`DenyAuthenticationAsync` maps `InteractionError` values to SAML status codes. The top-level status is always `Responder`.

| `InteractionError` | Sub-status |
|---|---|
| `AccessDenied`, `LoginRequired`, `AccountSelectionRequired`, `TemporarilyUnavailable` | `AuthnFailed` |
| `InteractionRequired` | `NoPassive` |
| `ConsentRequired` | `RequestDenied` |
| `UnmetAuthenticationRequirements` | `NoAuthnContext` |
