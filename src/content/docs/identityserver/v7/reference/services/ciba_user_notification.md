---
title: "Backchannel Authentication User Notification Service"
sidebar:
  order: 90
---

#### Duende.IdentityServer.Services.IBackchannelAuthenticationUserNotificationService

The `IBackchannelAuthenticationUserNotificationService` interface is used to contact users when
a [CIBA](/identityserver/v7/ui/ciba) login request has been made.
To use CIBA, you are expected to implement this interface and register it in the DI system.

## IBackchannelAuthenticationUserNotificationService APIs

* **`SendLoginRequestAsync`**

  Sends a notification for the user to login via
  the [BackchannelUserLoginRequest](/identityserver/v7/reference/models/ciba_login_request) parameter.

