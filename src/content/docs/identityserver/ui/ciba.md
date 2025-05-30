---
title: "Client Initiated Backchannel Authentication (CIBA)"
description: "Documentation for implementing CIBA in IdentityServer, a workflow that allows users to authenticate on a trusted device while accessing services from a different device."
sidebar:
  label: CIBA
  order: 7
redirect_from:
  - /identityserver/v5/ui/ciba/
  - /identityserver/v6/ui/ciba/
  - /identityserver/v7/ui/ciba/
---

Duende IdentityServer supports the [Client-Initiated Backchannel Authentication Flow](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html) (also known as CIBA).
CIBA is one of the requirements to support the [Financial-grade API](https://openid.net/wg/fapi/) compliance. 

CIBA is included in [IdentityServer](https://duendesoftware.com/products/identityserver) Enterprise Edition.

:::note
Duende IdentityServer supports the [`poll`](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html#rfc.section.5) mode to allow a client to obtain the results of a backchannel login request.
:::

Normally when using OpenID Connect, a user accesses a client application on the same device they use to login to the OpenID Connect provider.
For example, a user (via the browser) uses a web app (the client) and that same browser is redirected for the user to login at IdentityServer (the OpenID Connect provider), and this all takes place on the user's device (e.g. their computer). Another example would be that a user uses a mobile app (the client), and it launches the browser for the user to login at IdentityServer (the OpenID Connect provider), and this all takes place on the user's device (e.g. their mobile phone).

CIBA allow the user to interact with the client application on a different device than the user uses to log in.
For example, the user can use a kiosk at the public library to access their data, but they perform the actual login on their mobile phone. Another example would be a user is at the bank and the bank teller wishes to access the user's account, so the user logs into mobile phone to grant that access.

A nice feature of this workflow is that the user does not enter their credentials into the device the client application is accessed from, and instead a higher trust device can be used for the login step.

## CIBA Workflow In IdentityServer

Below is a diagram that shows the high level steps involved with the CIBA workflow and the supporting services involved.

![Showing how CIBA works in diagram form](./images/ciba.svg)


* **Step 1**: IdentityServer exposes a [backchannel authentication request endpoint](/identityserver/reference/endpoints/ciba) that the client uses to initiate the CIBA workflow.

* **Step 2**: Once client authentication and basic request parameter validation is performed, the user for which the request is being made must be identified.
This is done by using the [IBackchannelAuthenticationUserValidator](/identityserver/reference/validators/ciba-user-validator/) service in DI, **which you are required to implement and register in the ASP.NET Core service provider**.
The `ValidateRequestAsync` method will validate the request parameters and return a result which will contain the user's `sub` (subject identifier) claim.

* **Step 3**: Once a user has successfully been identified, then a record representing the pending login request is created in the [Backchannel Authentication Request Store](/identityserver/reference/stores/backchannel-auth-request-store/).

* **Step 4**: Next, the user needs to be notified of the login request. This is done by using the [IBackchannelAuthenticationUserNotificationService](/identityserver/reference/services/ciba-user-notification/) service in DI, **which you are required to implement and register in the ASP.NET Core service provider**.
The `SendLoginRequestAsync` method should contact the user with whatever mechanism is appropriate (e.g. email, text message, push notification, etc.), and presumably provide the user with instructions (perhaps via a link, but other approaches are conceivable) to start the login and consent process. 
This method is passed a [BackchannelUserLoginRequest](/identityserver/reference/models/ciba-login-request/) which will contain all the contextual information needed to send to the user (the `InternalId` being the identifier for this login request which is needed when completing the request -- see below).

* **Step 5**: Next, the user should be presented with the information for the login request (e.g. via a web page at IdentityServer, or via any other means appropriate).
The [IBackchannelAuthenticationInteractionService](/identityserver/reference/services/ciba-interaction-service/) can be used to access an indivdual [BackchannelUserLoginRequest](/identityserver/reference/models/ciba-login-request/) by its `InternalId`. Once the user has consented and allows the login, then the `CompleteLoginRequestAsync` method should be used to record the result (including which scopes the user has granted).

* **Step 6**: Finally, the client, after polling for the result, will finally be issued the tokens it's requested (or a suitable error if the user has denied the request, or it has timed out).

:::note
We provide [a sample](/identityserver/samples/misc) for the interactive pages a user might be presented with for the CIBA workflow.
:::
