---
title: "External Logout Notification"
description: "Documentation on federated sign-out in IdentityServer, explaining how external identity provider logout notifications are automatically processed to sign users out across all connected applications."
sidebar:
  label: External Logout Notification
  order: 80
redirect_from:
  - /identityserver/v5/ui/logout/external_notification/
  - /identityserver/v6/ui/logout/external_notification/
  - /identityserver/v7/ui/logout/external_notification/
---

Federated sign-out is the situation where a user has used an external identity provider to log into IdentityServer, and
then the user logs out of that external identity provider via a workflow unknown to IdentityServer.
When the user signs out, it will be useful for IdentityServer to be notified so that it can sign the user out of
IdentityServer and all the applications that use IdentityServer.

Not all external identity providers support federated sign-out, but those that do will provide a mechanism to notify
clients that the user has signed out.
This notification usually comes in the form of a request in an `<iframe>` from the external identity provider's "logged
out" page.
IdentityServer must then notify all of its clients (as discussed [here](/identityserver/ui/logout)), also typically in the form of a
request in an `<iframe>` (i.e. via Front-Channel Logout) from within the external identity provider's `<iframe>`.

:::note
To configure federated sign-out from an external identity provider, please refer to the documentation for your specific
external identity provider. When using an OpenID Connect identity provider, this is typically configured using the
front-channel logout URI.
:::

What makes federated sign-out a special case (when compared to a normal [logout](/identityserver/ui/logout)) is that the federated
sign-out request is not to the normal sign-out endpoint in IdentityServer.
In fact, each external IdentityProvider will have a different endpoint into your IdentityServer host.
This is due to that fact that each external identity provider might use a different protocol, and each middleware
listens on different endpoints.

The net effect of all these factors is that there is no "logged out" page being rendered as we would on the normal
sign-out workflow,
which means we are missing the sign-out notifications to IdentityServer's clients.
We must add code for each of these federated sign-out endpoints to render the necessary notifications to achieve
federated sign-out.

Fortunately IdentityServer already contains this code.
When requests come into IdentityServer and invoke the handlers for external authentication providers, IdentityServer
detects if these are federated sign-out requests and if they are it will automatically render the same `<iframe>`
as [described here for logout](/identityserver/ui/logout).

In short, federated sign-out is automatically supported.
