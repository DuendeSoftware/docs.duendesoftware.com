---
title: "SAML Authentication Context"
description: "Reference for SamlAuthenticationContext, the SAML-specific authentication context returned by IIdentityServerInteractionService."
date: 2026-11-16
sidebar:
  label: "SAML Authentication Context"
  order: 15
---

#### Duende.IdentityServer.Saml.Models.SamlAuthenticationContext

A sealed class implementing `IAuthenticationContext`. `IIdentityServerInteractionService.GetAuthenticationContextAsync` returns it for a SAML sign-in request.

```csharp
var context = await _interaction.GetAuthenticationContextAsync(returnUrl);

if (context is SamlAuthenticationContext samlContext)
{
    var sp = samlContext.ServiceProvider;
}
```

| Property | Type | Description |
|---|---|---|
| `ServiceProvider` | `SamlServiceProvider` | The SP that initiated the request. |
| `IdP` | `string?` | The IdP entity ID from the `Scoping` element. Populated only when the `IDPList` contains exactly one entry; otherwise `null`. |
| `LoginHint` | `string?` | The `NameID` value from the `AuthnRequest` `Subject`, if present. |
| `Tenant` | `string?` | Taken from the first `AuthnContextClassRef` that starts with `tenant:`, with the prefix removed. |
| `PromptModes` | `IEnumerable<string>` | `login` when `ForceAuthn` is set, `none` when `IsPassive` is set. |
| `RelayState` | `string?` | The relay state. |
| `IsIdpInitiated` | `bool` | Whether the flow is IdP-initiated. |
| `RequestedAuthnContext` | `StoredRequestedAuthnContext?` | The requested authentication context: `Comparison` (`string`), `AuthnContextClassRef` (`List<string>`), `AuthnContextDeclRef` (`List<string>`). |
| `StateId` | `Guid` | The identifier of the stored sign-in state (see [SAML sign-in state store](/identityserver/reference/v8/saml/saml-signin-state-store.md)). It travels in the return URL query parameter named by `SamlEndpointOptions.StateIdParameterName` (default `samlStateId`). |

Through `IAuthenticationContext`, `Application` returns the service provider as an `IConnectedApplication`.

To reject a request from the login page, call `DenyAuthenticationAsync`. See [Denying authentication](/identityserver/ui/login/context.md#denying-authentication).

### Deny error mapping

`DenyAuthenticationAsync` maps `InteractionError` values to SAML status codes. The top-level status is always `Responder`.

| InteractionError | Sub-status |
|---|---|
| `AccessDenied`, `LoginRequired`, `AccountSelectionRequired`, `TemporarilyUnavailable` | `AuthnFailed` |
| `InteractionRequired` | `NoPassive` |
| `ConsentRequired` | `RequestDenied` |
| `UnmetAuthenticationRequirements` | `NoAuthnContext` |
