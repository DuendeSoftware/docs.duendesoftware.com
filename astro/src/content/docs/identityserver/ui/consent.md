---
title: "Configuring User Consent In IdentityServer"
description: "How to require, display, remember, and process user consent for scopes requested by client applications in IdentityServer."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Consent
  order: 4
redirect_from:
  - /identityserver/v5/ui/consent/
  - /identityserver/v6/ui/consent/
  - /identityserver/v7/ui/consent/
---

During an authorization request, if user consent is required the browser will be redirected to the consent page.

:::note
You can configure the consent requirement per client. By default, no consent is required, but this setting can be
changed via the `RequireConsent` [setting](/identityserver/reference/v8/models/client.md#consent-screen).
:::

Consent is used to allow an end user to grant a client access to [resources](/identityserver/fundamentals/resources).

## When Does IdentityServer Ask For Consent?

Consent applies to authorization requests that involve a user. It does not apply to machine-to-machine flows such as
client credentials, where no user is present. For those clients, `AllowedScopes` defines what the client can request.

Set `RequireConsent` on the client in the **IdentityServer host**:

```csharp
// Config.cs in the IdentityServer host
new Client
{
    ClientId = "third-party-web",
    // ... other client settings
    RequireConsent = true,
    AllowedScopes = { "openid", "profile", "orders.read" }
};
```

When `RequireConsent` is `false`, IdentityServer does not ask the user to approve scopes. This is often suitable for a
first-party client operated by the same organization. Set it to `true` when the user should make an explicit decision,
such as for a third-party client.

## How To Build A Consent Page

In order for the user to grant consent, a consent page must be provided by the
hosting application. When IdentityServer needs to prompt the
user for consent, it will redirect the user to a configurable `ConsentUrl`.

```csharp
// Program.cs
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.ConsentUrl = "/path/to/consent";
})
```

By default, the ConsentUrl is set to "/consent". The quickstart UI includes a
basic implementation of a consent page at that route.

A consent page normally renders the display name of the current user,
the display name of the client requesting access,
the logo of the client,
a link for more information about the client,
and the list of resources the client is requesting access to.
It's also common to allow the user to indicate that their consent should be "remembered" so they are not prompted again
in the future for the same client.

### Required And Optional Scopes

The consent page receives the requested identity resources and API scopes. Resources with `Required = true` must be
included when consent is granted; optional resources can be presented as choices. If the consent result omits a
required scope, IdentityServer returns `access_denied` and the authorization request fails.

Configure this on the resource in the **IdentityServer host**:

```csharp
// Config.cs in the IdentityServer host
new IdentityResource(
    name: "employee",
    userClaims: ["employee_id"],
    displayName: "Employee information")
{
    Required = true
};

new ApiScope("orders.read", "View your orders")
{
    Required = false
};
```

Use `DisplayName` and `Description` values that explain what the application will receive or be able to do. Ask for the
smallest set of scopes the client needs. If a user declines an optional scope, the flow can still succeed, but the
resulting tokens and userinfo response will not contain data or permissions associated with that scope. See
[Controlling Claims In IdentityServer Tokens](/identityserver/fundamentals/claims.md) for how scopes control claims.

Once the user has provided consent, the consent page must inform your IdentityServer of the consent, and then the
browser must be redirected back to the authorization endpoint.

## How To Read The Authorization Context

Your IdentityServer will pass a `returnUrl` parameter to the consent page which contains the parameters of the
authorization request.
These parameters provide the context for the consent page, and can be read with help from
the [interaction service](/identityserver/reference/v8/services/interaction-service.md).

The `GetAuthorizationContextAsync` API will return an instance of `AuthorizationRequest`. Additional details about the
client or resources can be obtained using the `IClientStore` and `IResourceStore` interfaces.

## How To Submit The Consent Result

The `GrantConsentAsync` API on the [interaction service](/identityserver/reference/v8/services/interaction-service.md) allows
the consent page to inform your IdentityServer of the outcome of consent (which might also be to deny the client
access).

Your IdentityServer will temporarily persist the outcome of the consent.
This persistence uses a cookie by default, as it only needs to last long enough to convey the outcome back to the
authorization endpoint.
This temporary persistence is different from the persistence used for the "remember my consent" feature (and it is the
authorization endpoint which persists the "remember my consent" for the user).
If you wish to use some other persistence between the consent page and the authorization redirect, then you can
implement `IConsentMessageStore` and register the implementation with the service provider.

## How Remembered Consent Works

Set `AllowRememberConsent` on the client to control whether the consent page can offer a "remember my decision" option.
When the user chooses it, IdentityServer stores the granted scopes in the operational store. A later request can skip
the consent page when every requested scope was granted before. Configure `ConsentLifetime` if remembered consent should
expire.

IdentityServer asks for consent again when:

* No remembered consent exists
* The remembered consent has expired
* The request includes a scope not granted before
* The request includes `offline_access`
* The request contains a parameterized scope value
* `AllowRememberConsent` is `false`

:::caution
Do not offer remembered consent for the OAuth Device Authorization Grant. In IdentityServer v8, device-flow consent is
never remembered because authentication and authorization happen on a different device from the one that started the
flow.
:::

To let a user revoke remembered consent, call `RevokeUserConsentAsync(clientId)` on the
[interaction service](/identityserver/reference/v8/services/interaction-service.md), as the quickstart Grants page does.
This removes all persisted grants for that user and client, including remembered consent, reference tokens, and refresh
tokens. The client must authorize again, and IdentityServer will show the consent page the next time it requests access.

## How To Return To The Authorization Endpoint

Once the consent page has informed IdentityServer of the outcome, the user can be redirected back to the `returnUrl`.
Your consent page should protect against open redirects by verifying that the `returnUrl` is valid.
This can be done by calling `IsValidReturnUrl` on
the [interaction service](/identityserver/reference/v8/services/interaction-service.md).

Also, if `GetAuthorizationContextAsync` returns a non-null result, then you can also trust that the `returnUrl` is
valid.
