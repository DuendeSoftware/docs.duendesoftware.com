---
title: "Logout Context"
description: "Guide to accessing and using the LogoutRequest context in IdentityServer, which provides essential information for implementing proper logout workflows across different initiation scenarios."
sidebar:
  order: 10
redirect_from:
  - /identityserver/v5/ui/logout/logout_context/
  - /identityserver/v6/ui/logout/logout_context/
  - /identityserver/v7/ui/logout/logout_context/
---

To correctly perform all the steps for logout, your logout page needs contextual information about the user's session and the client that initiated logout request.
This information is provided by the [LogoutRequest](/identityserver/reference/services/interaction-service/#logoutrequest) class and will provide your logout page data needed for the logout workflow.

## Accessing The LogoutRequest And The `logoutId`

The logout page can be triggered in different ways:
* Client Initiated Logout (protocol)
* External Provider Logout Notification (protocol)
* Direct User Access (non-protocol)

If the logout page is being triggered by a protocol workflow, then this means Duende IdentityServer has redirected the user's browser to the logout page.
In these scenarios, a `logoutId` parameter will be passed that represents the logout context. 
The `logoutId` value can be exchanged with the `GetLogoutContextAsync` API on the [interaction service](/identityserver/reference/services/interaction-service/) to obtain a `LogoutRequest` object.

If the page is directly accessed by the user then there will be no `logoutId` parameter, but the context can still be accessed by calling `GetLogoutContextAsync` just without passing any parameters.

In either case, the `LogoutRequest` contains the data to perform client notification, and redirect the user back to the client after logout.
