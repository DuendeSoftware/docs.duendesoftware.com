+++
title = "Logout"
weight = 10
chapter = true
+++

# Logout

Logging out involves two steps:
* Remove the authentication session cookie for the user in your IdentityServer.
* Notify all client applications that the user has signed out.

## Cookie

Signing out is as simple as removing the authentication cookie, 
but for doing a complete federated sign-out, we must consider signing the user out of the client applications (and maybe even up-stream identity providers) as well.

## Removing the authentication cookie
To remove the authentication cookie, simply use the ASP.NET Core *SignOutAsync** extension method on the *HttpContext*.
You will need to pass the scheme used (which is provided by *IdentityServerConstants.DefaultCookieAuthenticationScheme* unless you have changed it):

```cs
await HttpContext.SignOutAsync(IdentityServerConstants.DefaultCookieAuthenticationScheme);
```

Or you can use the convenience extension method that is provided by IdentityServer::

```cs
await HttpContext.SignOutAsync();
```

{{% notice note %}}
Typically you should prompt the user for signout (meaning require a POST), otherwise an attacker could hotlink to your logout page causing the user to be automatically logged out.
{{% /notice %}}
