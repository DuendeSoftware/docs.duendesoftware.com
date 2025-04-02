---
title: User Interaction
sidebar:
  order: 40
---

As browser requests are made to the protocol endpoints in your IdentityServer, they will be redirected to the interactive pages for the user to see. Depending on the features required, the pages expected in your IdentityServer are:
* [Login](login): allows the user to login. This could be achieved with a local credential, or could utilize an external login provider (e.g. social or enterprise federation system).
* [Logout](logout): allows the user to logout (including providing single sign-out).
* [Error](error): display error information to the end user, typically when there are workflow errors.
* [Consent](consent): allows the user to grant resource access to clients (typically only used if the client is third-party).

[Additional custom pages](custom) that you might want are then also possible (e.g. password reset, registration), and those are typically available to the user as links from one of the above pages.

