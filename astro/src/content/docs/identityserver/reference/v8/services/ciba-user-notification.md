---
title: "Backchannel Authentication User Notification Service"
description: Documentation for the IBackchannelAuthenticationUserNotificationService interface which is used to notify users when a CIBA login request has been made.
sidebar:
  label: Backchannel Authentication User Notification
  order: 90
redirect_from:
  - /identityserver/v5/reference/services/ciba_user_notification/
  - /identityserver/v6/reference/services/ciba_user_notification/
  - /identityserver/reference/services/ciba-user-notification/
---

#### Duende.IdentityServer.Services.IBackchannelAuthenticationUserNotificationService

The `IBackchannelAuthenticationUserNotificationService` interface is used to contact users when
a [CIBA](/identityserver/ui/ciba.md) login request has been made.
To use CIBA, you are expected to implement this interface and register it in the ASP.NET Core service provider.

## IBackchannelAuthenticationUserNotificationService APIs

* **`SendLoginRequestAsync(BackchannelUserLoginRequest request, CancellationToken ct)`**

  Sends a notification for the user to login via
  the [BackchannelUserLoginRequest](/identityserver/reference/v8/models/ciba-login-request.md) parameter.
