---
title: "Client Notifications"
sidebar:
  order: 50
redirect_from:
  - /identityserver/v5/ui/logout/notification/
  - /identityserver/v6/ui/logout/notification/
  - /identityserver/v7/ui/logout/notification/
---

Client notifications are essential for ensuring applications are informed about user sign-out events in a secure and
efficient manner.

## Notifying Clients That The User Has Signed Out

As part of the logout process you will want to ensure client applications are informed that the user has signed out.

This is done by sending a notification to an endpoint provided by each client application. Depending on your
architecture, there are three supported techniques to call these endpoints:

* front-channel notifications via the browser
* back-channel notifications via server-side call
* a `PostMessage`-based notification for JavaScript clients

Regardless which technique you are using, Duende IdentityServer keeps track of the client applications involved with the
current user session and provides helpers and automated ways of invoking the notification mechanisms.

:::note
Both the front-channel and JS-based notifications make use of cookies in iframes. If your architecture spans multiple
sites, this will not work reliably. We recommend using back-channel notifications in this case. See the
supported [specifications](/identityserver/overview/specs/) page for links to the relevant documents.
:::

### Front-channel Server-side Clients

To sign the user out of the server-side client applications via the front-channel spec, the "logged out" page in
IdentityServer must render an `<iframe>` for each client that points to the corresponding notification endpoint at the
client.

Clients that wish to be notified must have the `FrontChannelLogoutUri` configuration value set.
IdentityServer tracks which clients the user has signed in to, and provides an API called `GetLogoutContextAsync` on
the [IIdentityServerInteractionService](/identityserver/reference/services/interaction-service/#iidentityserverinteractionservice-apis).
This API returns a `LogoutRequest` object with a `SignOutIFrameUrl` property that your logged out page must render into
an `<iframe>`.

See the [Quickstart UI](https://github.com/DuendeSoftware/products/tree/main/identity-server/templates/src/UI) Logout
page for an example.

### Back-channel Server-side Clients

To sign the user out of the server-side client applications via the back-channel the `IBackChannelLogoutService` service
can be used.
IdentityServer will automatically use this service when your logout page removes the user's authentication cookie via a
call to `HttpContext.SignOutAsync`.

Clients that wish to be notified must have
the [BackChannelLogoutUri](/identityserver/reference/models/client#authentication--session-management) configuration
value set.

#### Implementing Back-channel Logout In .NET Applications

.NET does not have native support for back-channel logout notification.
We do [provide a sample](/identityserver/samples), though.
Alternatively, if you are using our BFF framework, back-channel logout
is [already implemented](/bff/fundamentals/session/management/back-channel-logout) for you.

Back-channel logout notifications are logout tokens as specified
by [OpenID Connect Back-Channel Logout 1.0](https://openid.net/specs/openid-connect-backchannel-1_0.html#logouttoken).
Beginning in v6.3, IdentityServer sets the `typ` header of the logout token to `logout+jwt` to comply with the final
version of the specification. The [`LogoutTokenJwtType` option](/identityserver/reference/options#main) can override
this behavior.

### Browser-based JavaScript Clients

There is nothing special you need to do to notify these clients that the user has signed out.

The clients, though, must perform monitoring on the `check_session_iframe`, and this is implemented by spec compliant
client libraries, e.g. the [oidc-client JavaScript library](https://github.com/IdentityModel/oidc-client-js/).

