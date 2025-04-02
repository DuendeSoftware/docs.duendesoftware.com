---
title: "Client Notifications"
order: 50
---


## Notifying clients that the user has signed-out
As part of the logout process you will want to ensure client applications are informed that the user has signed out.

This is done by sending a notification to and endpoint provided by the each client application. Depending on your architecture, there are three supported techniques to call these endpoints:

* front-channel notifications via the browser
* back-channel notifications via server-side call
* a *PostMessage*-based notification for JavaScript clients

Regardless which technique you are using, Duende IdentityServer keeps track of the client applications involved with the current user session and provides helpers and automated ways of invoking the notification mechanisms.

:::note
Both the front-channel and JS-based notifications make use of cookies in iframes. If your architecture spans multiple sites, this will not work reliable. We recommend using back-channel notifications in this case. See the supported [specifications](/identityserver/v5/overview/specs) page for links to the relevant documents.
:::


### Front-channel server-side clients
To signout the user from the server-side client applications via the front-channel spec, the "logged out" page in IdentityServer must render an *\<iframe>* for each client that points to the corresponding notification endpoint at the client.

Clients that wish to be notified must have the *FrontChannelLogoutUri* configuration value set.
IdentityServer tracks which clients the user has signed into, and provides an API called *GetLogoutContextAsync* on the [IIdentityServerInteractionService](/identityserver/v5/reference/services/interaction_service#iidentityserverinteractionservice-apis). 
This API returns a *LogoutRequest* object with a *SignOutIFrameUrl* property that your logged out page must render into an *\<iframe>*.

See the [Quickstart UI](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI) account controller and signout view for an example.

### Back-channel server-side clients
To signout the user from the server-side client applications via the back-channel the *IBackChannelLogoutService* service can be used. 
IdentityServer will automatically use this service when your logout page removes the user's authentication cookie via a call to *HttpContext.SignOutAsync*.

Clients that wish to be notified must have the [BackChannelLogoutUri](/identityserver/v5/reference/models/client#authentication--session-management) configuration value set.

### Browser-based JavaScript clients
There is nothing special you need to do to notify these clients that the user has signed out.

The clients, though, must perform monitoring on the *check_session_iframe*, and this is implemented by spec compliant client libraries, e.g.  the [oidc-client JavaScript library](https://github.com/IdentityModel/oidc-client-js/).

