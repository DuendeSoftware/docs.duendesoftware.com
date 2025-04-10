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

    This injects exra checks to make sure the BFF middleware has been added to the pipeline. Since this middleware does important security checks, this protects from accidental configuration errors. You can disable this check if it interferes with some custom logic you might have.

* ***LicenseKey***

    This sets the license key for Duende.BFF. This license key is required for production deployments.

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

* ***RequireLogoutSessionId***

    Flag that specifies if the *sid* claim needs to be present in the logout request as query string parameter.
    Used to prevent cross site request forgery.
    Defaults to *true*.

* ***BackchannelLogoutAllUserSessions***

    Specifies if during backchannel logout all matching user sessions are logged out.
    If *true*, all sessions for the subject will be revoked. If false, just the specific session will be revoked.
    Defaults to *false*.


## APIs

* ***AntiForgeryHeaderName***

    Specifies the name of the header used for anti-forgery header protection.
    Defaults to *X-CSRF*.

* ***AntiForgeryHeaderValue***

    Specifies the expected value of Anti-forgery header.
    Defaults to *1*.