---
title: "Backchannel Authentication User Notification Service"
sidebar:
  order: 90
redirect_from:
  - /identityserver/v5/reference/services/ciba_user_notification/
  - /identityserver/v6/reference/services/ciba_user_notification/
  - /identityserver/v7/reference/services/ciba_user_notification/
---

#### Duende.IdentityServer.Services.IBackchannelAuthenticationUserNotificationService

The `IBackchannelAuthenticationUserNotificationService` interface is used to contact users when
a [CIBA](/identityserver/ui/ciba) login request has been made.
To use CIBA, you are expected to implement this interface and register it in the DI system.

## IBackchannelAuthenticationUserNotificationService APIs

* **`SendLoginRequestAsync`**

  Sends a notification for the user to login via
  the [BackchannelUserLoginRequest](/identityserver/reference/models/ciba-login-request/) parameter.

