---
title: "Session Cleanup and Logout"
description: "Guide to correctly ending a session in IdentityServer, including removing authentication cookies, handling external logins, and revoking client tokens during logout."
sidebar:
  label: End Sessions
  order: 20
redirect_from:
  - /identityserver/v5/ui/logout/session_cleanup/
  - /identityserver/v6/ui/logout/session_cleanup/
  - /identityserver/v7/ui/logout/session_cleanup/
---

Learn how to correctly end a session in ASP.NET Core, including handling cookies and token revocation.

## Removing The Authentication Cookie

To remove the authentication cookie, use the ASP.NET Core `SignOutAsync` extension method on the `HttpContext`.
You will need to pass the scheme used (which is provided by `IdentityServerConstants.DefaultCookieAuthenticationScheme`
unless you have changed it):

```csharp
// LogOut.cshtml.cs
await HttpContext.SignOutAsync(
    Duende
        .IdentityServer
        .IdentityServerConstants
        .DefaultCookieAuthenticationScheme
);
```

Or you can use the overload that will sign out of the default authentication scheme:

```csharp
// LogOut.cshtml.cs
await HttpContext.SignOutAsync();
```

If you are integrating with ASP.NET Identity, sign out using its `SignInManager` instead:

```csharp
// LogOut.cshtml.cs
await _signInManager.SignOutAsync();
```

### Prompting The User To Logout

Typically, you should prompt the user to logout which requires a POST to remove the cookie.
Otherwise, an attacker could hotlink to your logout page causing the user to be automatically logged out.
This means you will need a page to prompt the user to logout.

If a `logoutId` is passed to the logout page and the returned `LogoutRequest`'s `ShowSignoutPrompt` is `false` then it
is safe to skip the prompt.
This would occur when the logout page is requested due to a validated client initiated logout via
the [end session endpoint](/identityserver/reference/endpoints/end-session.md).
Your logout page process can continue as if the user submitted the post back to log out, in essence calling
`SignOutAsync`.

### External Logins

If your user has signed in with an external login, then it's likely that they should perform
an [external logout](/identityserver/ui/logout/external.md) of the external provider as well.

### Revoking Client Tokens At Logout

During a user's session, long-lived tokens (e.g. refresh tokens) might have been created for client applications.
If at logout time you would like to have those tokens revoked, then this can be done automatically by setting the
`CoordinateLifetimeWithUserSession` property on
the [client configuration](/identityserver/reference/models/client.md#authentication--session-management), or globally
on the [IdentityServer Authentication Options](/identityserver/reference/options.md#authentication).
