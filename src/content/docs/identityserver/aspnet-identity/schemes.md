---
title: "Authentication Schemes and Cookies"
description: "Understanding the authentication schemes and cookies used by Duende IdentityServer, especially when integrated with ASP.NET Identity."
sidebar:
  order: 5
---

Authentication in ASP.NET Core is organized into [authentication schemes](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/#authentication-scheme). A scheme is a name that corresponds to an authentication handler and its configuration options.
IdentityServer relies on several specific schemes for different purposes, and understanding them is crucial, especially when integrating with ASP.NET Identity.

## Cookie Schemes

When a user logs in, their identity is established and persisted across requests using a cookie. IdentityServer uses a primary authentication cookie to track the user's session.

### Standalone IdentityServer

When using IdentityServer without ASP.NET Identity, the default cookie scheme is named `"idsrv"`, though we recommend using the constant `IdentityServerConstants.DefaultCookieAuthenticationScheme` in your code if you ever need it.

The default cookie scheme is configured by default in `AddIdentityServer()`, which sets up the cookie authentication handler with this scheme name. This cookie is essential for:

- maintaining the user's authenticated session
- supporting single sign-on (SSO)
- managing sign-out

### With ASP.NET Identity

When you integrate ASP.NET Identity, for example using `AddAspNetIdentity<TUser>()`, the configuration changes to align with ASP.NET Identity's defaults.

In this scenario, the main authentication cookie scheme is not `"idsrv"`. Instead, it uses the ASP.NET Identity default scheme name: `"Identity.Application"` (or the `IdentityConstants.ApplicationScheme` constant).

This is a common point of confusion. ASP.NET Identity registers its own cookie handlers, and `AddAspNetIdentity` configures IdentityServer to use them. This means:

1.  **Login UI:** When you call `HttpContext.SignInAsync`, you must use the correct scheme. If you use the `SignInManager<TUser>` provided by ASP.NET Identity, it automatically uses `"Identity.Application"`.
2.  **Configuration:** If you need to configure cookie options (like expiration or sliding expiration), you must configure the options for `"Identity.Application"`, not `"idsrv"`.

```csharp
// Program.cs
services.ConfigureApplicationCookie(options =>
{
    // The default ("Identity.Application")
    options.Cookie.Name = IdentityConstants.ApplicationScheme;
    
    // Configure other options here...
    options.ExpireTimeSpan = TimeSpan.FromHours(1);
    options.SlidingExpiration = true;
});
```

## Other Important Schemes

Besides the main application cookie, IdentityServer uses other schemes for specific features.

### External Authentication (e.g., Google, OIDC)

When a user signs in with an external provider (like Google or another OIDC provider), the result of that remote authentication is temporarily stored in an "external" cookie.
This allows your login logic to read the claims from the external provider before fully signing the user into your main local session.

IdentityServer always uses the `"idsrv.external"` scheme here, available in the `IdentityServerConstants.ExternalCookieAuthenticationScheme` constant.

### Check Session Cookie

IdentityServer session management requires a separate cookie to monitor the session state without sending the large authentication cookie.
The [User Session Service](/identityserver/reference/services/user-session-service.md) manages this cookie.

- **Default Name:** `"idsrv.session"` (Constant: `IdentityServerConstants.DefaultCheckSessionCookieName`).

Note this cookie is not marked as `HttpOnly`, so it can be accessed in client-side code. The JavaScript code that is required to check user sessions in the background also requires access to this cookie, and needs it to be `HttpOnly`.

## Common Pitfalls

- **Mixing Schemes:** Attempting to `SignOutAsync("idsrv")` when ASP.NET Identity is in use will have no effect on the actual `"Identity.Application"` cookie, leaving the user logged in. Always use the constants or the helper services (like `SignInManager`) that match your configuration.
- **Cookie Configuration:** Setting options on the default authentication scheme (which might differ from the effective cookie scheme) or configuring the wrong named options instance will result in settings (like `Cookie.SameSite` or `ExpireTimeSpan`) being ignored.
