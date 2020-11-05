---
title: "Local sign-out"
date: 2020-09-10T08:22:12+02:00
weight: 2
---

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

## Notifying clients that the user has signed-out
As part of the sign-out process you will want to ensure client applications are informed that the user has signed out.

This is done by sending a notification to and endpoint provided by the each client application. Depending on your architecture, there are three supported techniques to call these endpoints:

* front-channel notifications via the browser
* back-channel notifications via server-side call
* a *PostMessage*-based notification for JavaScript clients

Regardless which technique you are using, Duende IdentityServer keeps track of the client applications involved with the current user session and provides helpers and automated ways of invoking the notification mechanisms.

{{% notice note %}}
Both the front-channel and JS-based notifications make use of cookies in iframes. If your architecture spans multiple sites, this will not work reliable. We recommend using back-channel notifications in this case. See the supported [specifications]({{< ref "/overview/specs" >}}) page for links to the relevant documents.
{{% /notice %}}


### Front-channel server-side clients
To signout the user from the server-side client applications via the front-channel spec, the "logged out" page in IdentityServer must render an *<iframe>* for each client that points to the corresponding notification endpoint at the client.

Clients that wish to be notified must have the *FrontChannelLogoutUri* configuration value set.
IdentityServer tracks which clients the user has signed into, and provides an API called *GetLogoutContextAsync* on the [IIdentityServerInteractionService]({{< ref "/reference/interaction_service#iidentityserverinteractionservice-apis" >}}). 
This API returns a *LogoutRequest* object with a *SignOutIFrameUrl* property that your logged out page must render into an *<iframe>*.

See the [Quickstart UI](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI) account controller and signout view for an example.

### Back-channel server-side clients
To signout the user from the server-side client applications via the back-channel the *IBackChannelLogoutService* service can be used. 
IdentityServer will automatically use this service when your logout page removes the user's authentication cookie via a call to *HttpContext.SignOutAsync*.

Clients that wish to be notified must have the ``BackChannelLogoutUri`` configuration value set.

TODO: add more information on backchannel logout API - maybe this needs a separate page.

### Browser-based JavaScript clients
There is nothing special you need to do to notify these clients that the user has signed out.

The clients, though, must perform monitoring on the *check_session_iframe*, and this is implemented by spec compliant client libraries, e.g.  the [oidc-client JavaScript library](https://github.com/IdentityModel/oidc-client-js/).

## Sign-out initiated by a client application
If sign-out was initiated by a client application, then the client first redirected the user to the :ref:`end session endpoint <refEndSession>` TODO.

Processing at the end session endpoint might require some temporary state to be maintained (e.g. the client's post logout redirect uri) across the redirect to the logout page.
This state might be of use to the logout page, and the identifier for the state is passed via a *logoutId* parameter to the logout page.

The *GetLogoutContextAsync* API on the [IIdentityServerInteractionService]({{< ref "/reference/interaction_service#iidentityserverinteractionservice-apis" >}}) can be used to load the state.

Of interest on the *LogoutRequest* model context class is the *ShowSignoutPrompt* which indicates if the request for sign-out has been authenticated, and therefore it's safe to not prompt the user for sign-out.

By default this state is managed as a protected data structure passed via the *logoutId* value.
If you wish to use some other persistence between the end session endpoint and the logout page, then you can implement *IMessageStore<LogoutMessage>* and register the implementation in DI.
