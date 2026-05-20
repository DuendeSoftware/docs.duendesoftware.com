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
* **SAML**: Returns a SAML response with `Responder`/`AuthnFailed` status codes to the service
  provider.

```csharp
// LoginModel.cshtml.cs
public async Task<IActionResult> OnPostCancelAsync(string returnUrl)
{
    var context = await _interaction.GetAuthenticationContextAsync(returnUrl);

    if (context is not null)
    {
        await _interaction.DenyAuthenticationAsync(context, InteractionError.AccessDenied);
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

You can also pass an optional `errorDescription` string for additional context:

```csharp
await _interaction.DenyAuthenticationAsync(
    context,
    InteractionError.AccessDenied,
    cancellationToken,
    errorDescription: "User declined the terms of service");
```

For SAML-specific details about how the authentication context works, see
[SAML Authentication Context](/identityserver/saml/extensibility.md#saml-authentication-context).
