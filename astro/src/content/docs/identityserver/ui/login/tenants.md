---
title: "Passing A Tenant With acr_values"
description: "Pass tenant hints to IdentityServer using acr_values with tenant:, read tenant context on the login page, and re-authenticate when tenants change."
sidebar:
  label: "Tenant Hints"
  order: 45
date: 2026-09-28
---

In multi-tenant solutions, a single IdentityServer often serves users that belong to different tenants (customers,
organizations, brands, ...). The client application often already knows which tenant the user belongs to, for
example because the tenant is part of the application's host name (`acme.example.com`) or URL path.

IdentityServer lets the client pass that knowledge along with the authorization request, using the proprietary
`tenant:` prefix in the standard OpenID Connect `acr_values` parameter:

```text
GET /connect/authorize?client_id=web&...&acr_values=tenant:acme
```

The tenant value is a *hint*: IdentityServer parses it and makes it available to your login UI, and can optionally use
it to decide whether an existing session can be reused. What the tenant hint means, and how it affects authentication,
is up to your implementation. To isolate tenants into separate security domains with their own configuration and data,
use [Spaces](#tenant-hints-versus-spaces) instead.

Typical uses of the tenant hint are:

* Branding the login page (logo, colors, text) for the tenant.
* Scoping the user lookup to the tenant's user store or database.
* Offering only the external identity providers configured for that tenant (a form of
  [home realm discovery](/identityserver/ui/federation.md#home-realm-discovery)).
* Forcing re-authentication when a user who is signed in for one tenant starts a login for another tenant.

## Tenant Hints Versus Spaces

The tenant hint is not the same as [Spaces](/identityserver/spaces/index.mdx). The two are independent:

|                    | Tenant hint (`acr_values=tenant:...`)                                           | Spaces                                                |
|--------------------|---------------------------------------------------------------------------------|-------------------------------------------------------|
| **Selected by**    | The client, per authorize request                                               | The server, from the request origin and/or path       |
| **Trust**          | Untrusted hint, can be changed by the user                                      | Validated against configured match patterns           |
| **Data isolation** | None, your code decides what the tenant means                                   | Separate configuration and operational data per space |
| **Issuer**         | Shared                                                                          | One issuer per space                                  |
| **Typical use**    | Branding, user store selection, home realm discovery within one security domain | Hosting separate security domains in one deployment   |

Use Spaces when tenants need their own clients, resources, grants and issuer (and users, when using Duende User Management). Use the tenant hint when
tenants share one IdentityServer configuration and only the login experience or user lookup differs.

A client cannot select a space through `acr_values`. To target a space, configure the client's authority as that
space's base URL, which is also its issuer, for example `https://acme.example.com` for origin matching or
`https://login.example.com/t/acme` for path matching.

The two can be combined. Space resolution does not look at `acr_values`, so within a space the tenant hint still works
as described on this page, for example to distinguish organizations or brands that share a space. When the tenant is
already determined by the space, prefer reading the resolved space with `ISpaceContextAccessor` over trusting a
client-supplied tenant hint.

## Sending The Tenant From The Client

With the ASP.NET Core OpenID Connect handler, set the `acr_values` parameter when redirecting to IdentityServer. The
following example derives the tenant from the first segment of the host name:

```csharp
// Program.cs
builder.Services.AddAuthentication(/* ... */)
    .AddOpenIdConnect("oidc", options =>
    {
        // ...
        options.Events.OnRedirectToIdentityProvider = context =>
        {
            var tenant = context.HttpContext.Request.Host.Host.Split('.')[0];
            context.ProtocolMessage.AcrValues = $"tenant:{tenant}";
            return Task.CompletedTask;
        };
    });
```

`acr_values` is a space-separated list, so the tenant can be combined with other values, including the
[`idp:` hint](/identityserver/ui/federation.md#selecting-an-identity-provider-from-the-client-idp-acr_values) and your own
custom values:

```text
acr_values=tenant:acme idp:Google
```

:::caution[Do not trust the tenant value]
The tenant value comes from the client and can be changed by anyone who can edit the URL, so it is not proof of
tenant membership. Always verify on the server side that the user who signs in actually belongs to the
requested tenant.
:::

## Reading The Tenant On The Login Page

IdentityServer parses `acr_values` and exposes the tenant as the `Tenant` property of the
[`AuthorizationRequest`](/identityserver/reference/v8/services/interaction-service.md#authorizationrequest), which is
returned by `IIdentityServerInteractionService.GetAuthorizationContextAsync` (see [Login Context](/identityserver/ui/login/context.md)).
Well-known values such as `tenant:` and `idp:` are removed from the `AcrValues` collection on the same object, which only
contains the remaining, non-special values.

```csharp
// Pages/Account/Login/Index.cshtml.cs
public async Task<IActionResult> OnGet(string returnUrl)
{
    var context = await _interaction.GetAuthorizationContextAsync(returnUrl);

    // e.g. "acme" for acr_values=tenant:acme, null when no tenant was requested
    var tenant = context?.Tenant;

    if (tenant != null)
    {
        // apply tenant branding, restrict the list of external providers, ...
        View = await _tenantService.GetLoginViewModelAsync(tenant);
    }

    return Page();
}
```

When validating the user's credentials, use the tenant to scope the lookup and reject users that are not a member of it:

```csharp
// Pages/Account/Login/Index.cshtml.cs
public async Task<IActionResult> OnPost()
{
    var context = await _interaction.GetAuthorizationContextAsync(Input.ReturnUrl);
    var tenant = context?.Tenant;

    var user = await _users.FindByUsernameAsync(Input.Username, tenant);
    if (user == null || !await _users.ValidateCredentialsAsync(user, Input.Password))
    {
        ModelState.AddModelError(string.Empty, "Invalid username or password");
        return Page();
    }

    // ... sign in ...
}
```

## Recording The Tenant In The Authentication Session

When you establish the [authentication session](/identityserver/ui/login/session.md), issue the `tenant` claim so that
IdentityServer knows which tenant the session belongs to. The `IdentityServerUser` class has a `Tenant` property for
this:

```csharp
var isuser = new IdentityServerUser(user.SubjectId)
{
    DisplayName = user.Username,
    Tenant = tenant
};

await HttpContext.SignInAsync(isuser);
```

The claim is only stored in the session cookie. It is not automatically included in identity or access tokens. If
clients or APIs need the tenant, emit it from your [profile service](/identityserver/fundamentals/claims.md).

## Re-authenticating When The Tenant Changes

By default, IdentityServer does not compare the requested tenant with the current session: a user who is signed in
will be sent straight back to the client, even when the new request asks for a different tenant.

Set [`ValidateTenantOnAuthorization`](/identityserver/reference/v8/options.md) to `true` to change this:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.ValidateTenantOnAuthorization = true;
});
```

When enabled, and the authorize request contains a `tenant:` value, IdentityServer compares it with the `tenant` claim
of the current session. If they differ (including when the session has no `tenant` claim), the login page is shown
again instead of silently reusing the existing session. Requests without a tenant hint are not affected.

This only works if your login page issues the `tenant` claim, as shown in the previous section.

## Other Endpoints

The tenant hint is surfaced in several other endpoints:

* **CIBA**: The `tenant:` value in `acr_values` on a
  [backchannel authentication request](/identityserver/reference/v8/endpoints/ciba.md) is exposed as the `Tenant`
  property of the [`BackchannelUserLoginRequest`](/identityserver/reference/v8/models/ciba-login-request.md), so your
  notification and approval logic can take it into account.
* **SAML**: When IdentityServer acts as a [SAML identity provider](/identityserver/saml/index.md), a
  `tenant:` value in the `AuthnContextClassRef` of the requested authentication context is parsed in the same way and
  exposed to your login page as the tenant of the SAML authentication context.
* **Token endpoint**: IdentityServer does not process a `tenant:` value sent to the token endpoint. Custom
  extension grant or resource owner password validators can still read the raw `acr_values` parameter from the request
  (`context.Request.Raw`) if needed.
