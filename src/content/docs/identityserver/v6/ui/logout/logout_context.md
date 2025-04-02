---
title: "Logout Context"
order: 10
---

To correctly perform all the steps for logout, your logout page needs contextual information about the user's session and the client that initiated logout request.
This information is provided by the [LogoutRequest](/identityserver/v6/reference/services/interaction_service#logoutrequest) class and will provide your logout page data needed for the logout workflow.

## Accessing the LogoutRequest and the *logoutId*

The logout page can be triggered in different ways:
* Client Initiated Logout (protocol)
* External Provider Logout Notification (protocol)
* Direct User Access (non-protocol)

If the logout page is being triggered by a protocol workflow, then this means Duende IdentityServer has redirected the user's browser to the logout page.
In these scenarios, a *logoutId* parameter will be passed that represents the logout context. 
The *logoutId* value can be exchanged with the *GetLogoutContextAsync* API on the [interaction service](/identityserver/v6/reference/services/interaction_service) to obtain a *LogoutRequest* object.

If the page is directly accessed by the user then there will be no *logoutId* parameter, but the context can still be accessed by calling *GetLogoutContextAsync* just without passing any parameters.

In either case, the *LogoutRequest* contains the data to perform client notification, and redirect the user back to the client after logout.
