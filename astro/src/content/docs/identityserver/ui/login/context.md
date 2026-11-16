---
title: "Login Context"
description: "Guide to accessing and using authorization request parameters from the returnUrl to customize the login workflow in IdentityServer."
sidebar:
  order: 40
date: 2026-05-20
redirect_from:
  - /identityserver/v5/ui/login/context/
  - /identityserver/v6/ui/login/context/
  - /identityserver/v7/ui/login/context/
---

The `returnUrl` query parameter passed to the login page refers to the URL the prior request came from.
This URL typically refers to the IdentityServer authorization endpoint and contains the original request parameters sent
from the client.
These parameters might contain information your login page needs to customize its workflow.
Some examples would be for branding, dynamic page customization (e.g. which external login providers to use), or
controlling what credentials the client application expects (e.g. perhaps MFA is required).

## Authorization Request Context

In order to read the original authorize request parameter values, you can use
the [interaction service](/identityserver/reference/v8/services/interaction-service.md#iidentityserverinteractionservice-apis).
It provides a `GetAuthorizationContextAsync` API that will extract that information from the `returnUrl` and return
an [AuthorizationRequest](/identityserver/reference/v8/services/interaction-service.md#authorizationrequest) object which
contains these values.

:::note
It is unnecessary (and discouraged) for your login page logic to parse the `returnUrl` itself.
:::

## Denying Authentication

Sometimes your login page needs to signal that the user cancelled or refused to authenticate. For
example, the user clicks a "Cancel" button, or your login logic determines that the user should
not be allowed to proceed. You can use `DenyAuthenticationAsync` on
`IIdentityServerInteractionService` to report this back to IdentityServer, which then generates
the appropriate protocol-specific error response.

This works for both OpenID Connect (OIDC) and SAML flows:

* **OIDC**: Returns an `access_denied` error to the client.
* **SAML**: Returns a SAML error response to the service provider. The top-level status is
  always `Responder`. The second-level status depends on the `InteractionError` you pass (see the
  table below).

```csharp
// LoginModel.cshtml.cs
public async Task<IActionResult> OnPostCancelAsync(string returnUrl)
{
    var context = await _interaction.GetAuthenticationContextAsync(returnUrl, HttpContext.RequestAborted);

    if (context is not null)
    {
        await _interaction.DenyAuthenticationAsync(context, InteractionError.AccessDenied, Request.HttpContext.RequestAborted);
    }

    return Redirect(returnUrl);
}
```

`DenyAuthenticationAsync` accepts an `InteractionError` value that describes why authentication
was denied. The available values are:

* `InteractionError.AccessDenied`: The user explicitly denied access.
* `InteractionError.LoginRequired`: The user could not be authenticated.
* `InteractionError.InteractionRequired`: Additional interaction is required but cannot be
  performed.
* `InteractionError.AccountSelectionRequired`: The user must select an account.
* `InteractionError.ConsentRequired`: Consent was required, but not granted.
* `InteractionError.TemporarilyUnavailable`: The request could not be processed.
* `InteractionError.UnmetAuthenticationRequirements`: The user did not meet authentication requirements.

For SAML, the `InteractionError` maps to the following second-level status code:

| `InteractionError`                                                                    | SAML second-level status |
|---------------------------------------------------------------------------------------|--------------------------|
| `AccessDenied`, `LoginRequired`, `AccountSelectionRequired`, `TemporarilyUnavailable` | `AuthnFailed`            |
| `InteractionRequired`                                                                 | `NoPassive`              |
| `ConsentRequired`                                                                     | `RequestDenied`          |
| `UnmetAuthenticationRequirements`                                                     | `NoAuthnContext`         |

Use `UnmetAuthenticationRequirements` when the user can't satisfy a requirement such as step-up or multi-factor authentication.

You can also pass an optional `errorDescription` string for additional context:

```csharp
await _interaction.DenyAuthenticationAsync(
    context,
    InteractionError.AccessDenied,
    cancellationToken,
    errorDescription: "User declined the terms of service");
```

For SAML-specific details about how the authentication context works, see
[SAML Authentication Context](/identityserver/reference/v8/saml/saml-authentication-context.md) in the reference, or the
[extensibility guide](/identityserver/saml/extensibility.md#saml-authentication-context).
