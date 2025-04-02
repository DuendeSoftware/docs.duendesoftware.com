---
title: "Ending the Session"
order: 20
---
## Removing the Authentication Cookie
To remove the authentication cookie, simply use the ASP.NET Core *SignOutAsync* extension method on the *HttpContext*.
You will need to pass the scheme used (which is provided by *IdentityServerConstants.DefaultCookieAuthenticationScheme* unless you have changed it):

```cs
await HttpContext.SignOutAsync(IdentityServerConstants.DefaultCookieAuthenticationScheme);
```

Or you can use the overload that will simply sign-out of the default authentication scheme:

```cs
await HttpContext.SignOutAsync();
```

### Prompting the User to Logout

Typically you should prompt the user to logout which requires a POST to remove the cookie.
Otherwise an attacker could hotlink to your logout page causing the user to be automatically logged out.
This means you will need a page to prompt the user to logout.

If a *logoutId* is passed to the logout page and the returned *LogoutRequest*'s *ShowSignoutPrompt* is *false* then it is safe to skip the prompt. 
This would occur when the logout page is requested due to a validated client initiated logout via the [end session endpoint](../reference/endpoints/end_session).
Your logout page process can continue as if the user submitted the post back to logout, in essence calling *SignOutAsync*.

### External Logins

If your user has signed in with an external login, then it's likely that they should perform an [external logout](external) of the external provider as well.
