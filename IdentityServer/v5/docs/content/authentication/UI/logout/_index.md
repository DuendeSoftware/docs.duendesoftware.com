+++
title = "Logout"
weight = 10
chapter = true
+++

# Logout

Logging out involves two steps:
* Remove the authentication session cookie for the user in your IdentityServer.
* Notify all client applications that the user has signed out.

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

{{% notice note %}}
Typically you should prompt the user for sign-out (meaning require a POST), otherwise an attacker could hotlink to your logout page causing the user to be automatically logged out.
{{% /notice %}}


### External Logins

If your user has signed in with an external login, then it's likely that they should perform an [external logout]({{<ref "./external">}}) of the external provider as well.

### Sign-out initiated by a client application
If sign-out was initiated by a client application, then the client first redirected the user to the [end session endpoint]({{<ref "/reference/endpoints/end_session">}}).

Processing at the end session endpoint might require some temporary state to be maintained (e.g. the client's post logout redirect uri) across the redirect to the logout page.
This state might be of use to the logout page, and the identifier for the state is passed via a *logoutId* parameter to the logout page.

The *GetLogoutContextAsync* API on the [IIdentityServerInteractionService]({{< ref "/reference/interaction_service#iidentityserverinteractionservice-apis" >}}) can be used to load the state.

Of interest on the *LogoutRequest* model context class is the *ShowSignoutPrompt* which indicates if the request for sign-out has been authenticated, and therefore it's safe to not prompt the user for sign-out.

By default this state is managed as a protected data structure passed via the *logoutId* value.
If you wish to use some other persistence between the end session endpoint and the logout page, then you can implement *IMessageStore<LogoutMessage>* and register the implementation in DI.

## Client notification

To complete the full single sign-out process, any client applications that the user has logged into should be [notified]({{<ref "./notification">}}).
