---
title: "Configuration Options"
date: 2020-09-10T08:22:12+02:00
weight: 90
---

The *Duende.BFF.BffOptions* allows to configure several aspects of the BFF framework.

You set the options at startup time in your *ConfigureServices* method:

```cs
services.AddBff(options =>
{
    // configure options here..
})
```

## General

* ***EnforceBffMiddleware***

    Enables checks in the user management endpoints that ensure that the BFF middleware has been added to the pipeline. Since the middleware performs important security checks, this protects from accidental configuration errors. You can disable this check if it interferes with some custom logic you might have. Defaults to true.

* ***LicenseKey***

    This sets the license key for Duende.BFF. This license key is required for production deployments.

* ***AnonymousSessionResponse*** (added in 2.0)

    This sets the response status code behavior on the [user endpoint]({{< ref "/bff/session/management/user">}}) to either return 401 or 200 with a *null* payload when the user is anonymous.

* ***DiagnosticsEnvironments***
 
    The ASP.NET environment names that enable the diagnostics endpoint. Defaults to "Development".

## Paths

* ***LoginPath***

    Sets the path to the login endpoint. Defaults to */bff/login*.

* ***SilentLoginPath***

    Sets the path to the silent login endpoint. Defaults to */bff/silent-login*.

* ***SilentLoginCallbackPath***

    Sets the path to the silent login callback endpoint. Defaults to */bff/silent-login-callback*.

* ***LogoutPath***

    Sets the path to the logout endpoint. Defaults to */bff/logout*.

* ***UserPath***

    Sets the path to the user endpoint. Defaults to */bff/user*.

* ***BackChannelLogoutPath***

    Sets the path to the backchannel logout endpoint. Defaults to */bff/backchannel*.

* ***DiagnosticsPath***

    Sets the path to the diagnostics endpoint. Defaults to */bff/diagnostics*.

## Session Management

* ***ManagementBasePath***

    Base path for management endpoints. Defaults to */bff*.

* ***RequireLogoutSessionId***

    Flag that specifies if the *sid* claim needs to be present in the logout request as query string parameter.
    Used to prevent cross site request forgery.
    Defaults to *true*.

* ***RevokeRefreshTokenOnLogout***

    Specifies if the user's refresh token is automatically revoked at logout time.
    Defaults to *true*.

* ***BackchannelLogoutAllUserSessions***

    Specifies if during backchannel logout all matching user sessions are logged out.
    If *true*, all sessions for the subject will be revoked. If false, just the specific session will be revoked.
    Defaults to *false*.

* ***EnableSessionCleanup***

    Indicates if expired server side sessions should be cleaned up.
    This requires an implementation of IUserSessionStoreCleanup to be registered in the DI system.
    Defaults to *false*.

* ***SessionCleanupInterval***

    Interval at which expired sessions are cleaned up.
    Defaults to *10 minutes*.


## APIs

* ***AntiForgeryHeaderName***

    Specifies the name of the header used for anti-forgery header protection.
    Defaults to *X-CSRF*.

* ***AntiForgeryHeaderValue***

    Specifies the expected value of Anti-forgery header.
    Defaults to *1*.
