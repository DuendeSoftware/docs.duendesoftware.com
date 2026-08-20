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

```csharp
/// <summary>
/// Used to contact users when a Client-Initiated Backchannel Authentication (CIBA)
/// login request has been made. To use CIBA, you must implement this interface and
/// register it in the ASP.NET Core service provider. The implementation is responsible
/// for delivering the login notification to the user via an out-of-band channel such
/// as push notification, SMS, or email.
/// </summary>
public interface IBackchannelAuthenticationUserNotificationService
{
    /// <summary>
    /// Sends a notification for the user to login.
    /// </summary>
    /// <param name="request">The login request details.</param>
    /// <param name="ct">The cancellation token.</param>
    Task SendLoginRequestAsync(BackchannelUserLoginRequest request, CancellationToken ct);
}
```

## IBackchannelAuthenticationUserNotificationService APIs

* **`SendLoginRequestAsync(BackchannelUserLoginRequest request, CancellationToken ct)`**

  Sends a notification for the user to login via
  the [BackchannelUserLoginRequest](/identityserver/reference/v8/models/ciba-login-request.md) parameter.

## Sample Implementation

The following example shows a minimal implementation that sends a push notification to the user. Your implementation should use whatever out-of-band communication channel is appropriate for your users (push notification, SMS, email, etc.).

```csharp
public class CibaUserNotificationService : IBackchannelAuthenticationUserNotificationService
{
    private readonly IPushNotificationService _pushService;
    private readonly ILogger<CibaUserNotificationService> _logger;

    public CibaUserNotificationService(
        IPushNotificationService pushService,
        ILogger<CibaUserNotificationService> logger)
    {
        _pushService = pushService;
        _logger = logger;
    }

    public async Task SendLoginRequestAsync(
        BackchannelUserLoginRequest request, CancellationToken ct)
    {
        var sub = request.Subject.FindFirst("sub")?.Value;

        _logger.LogInformation(
            "Sending CIBA login notification to user {Sub} for client {ClientId}",
            sub, request.Client.ClientId);

        await _pushService.SendAsync(
            userId: sub,
            title: "Login Request",
            body: request.BindingMessage ?? "A login request has been made on your behalf.",
            data: new Dictionary<string, string>
            {
                ["loginRequestId"] = request.InternalId
            },
            cancellationToken: ct);
    }
}
```

Register the implementation in your service collection:

```csharp
builder.Services.AddTransient<IBackchannelAuthenticationUserNotificationService, CibaUserNotificationService>();
```
