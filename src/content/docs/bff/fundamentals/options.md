---
title: Configuration Options
sidebar:
  label: Configuration Options
description: "Comprehensive guide to configuring Duende BFF framework including general settings, paths, session management, and API options"
date: 2020-09-10T08:22:12+02:00
redirect_from:
  - /bff/v2/options/
  - /bff/v3/fundamentals/options/
  - /identityserver/v5/bff/options/
  - /identityserver/v6/bff/options/
  - /identityserver/v7/bff/options/
---

The *Duende.BFF.BffOptions* allows to configure several aspects of the BFF framework.

You set the options at startup time:

```cs
builder.Services.AddBff(options =>
{
    // configure options here..
})
```

## General

* ***EnforceBffMiddleware***

    Enables checks in the user management endpoints that ensure that the BFF middleware has been added to the pipeline. Since the middleware performs important security checks, this protects from accidental configuration errors. You can disable this check if it interferes with some custom logic you might have. Defaults to true.

* ***LicenseKey***

    This sets the license key for Duende.BFF. A business edition or higher license key is required for production deployments. The same license key is used in IdentityServer and the BFF. Just as in the [IdentityServer host](/general/licensing), you can either set the license key using this option in code or include *Duende_License.key* in the same directory as your BFF host.

* ***AnonymousSessionResponse*** (added in 2.0)

    This sets the response status code behavior on the [user endpoint](/bff/fundamentals/session/management/user) to either return 401 or 200 with a *null* payload when the user is anonymous.

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

* ***DPoPJsonWebKey***

    Specifies the Json Web Key to use when creating DPoP proof tokens. 
    Defaults to null, which is appropriate when not using DPoP.

* ***RemoveSessionAfterRefreshTokenExpiration***
    Flag that specifies if a user session should be removed after an attempt to use a Refresh Token to acquire
    a new Access Token fails. This behavior is only triggered when proxying requests to remote
    APIs with TokenType.User or TokenType.UserOrClient. Defaults to True. 


# BFF Blazor Server Options

In the Blazor Server, you configure the **BffBlazorServerOptions** by using the **AddBlazorServer** method. 

```csharp
builder.Services.AddBlazorServer(opt =>
{
    // configure options here..
})
```

The following options are available:

* ***ServerStateProviderPollingInterval*** 
    The delay, in milliseconds, between polling requests by the
    BffServerAuthenticationStateProvider to the /bff/user endpoint. Defaults to 5000
    ms.

# BFF Blazor Client Options

In WASM, you configure the **BffBlazorClientOptions** using the **AddBffBlazorClient** method:

```csharp
builder.Services.AddBffBlazorClient(opt =>
{
    // configure options here..
})
```

The following options are available:

* ***RemoteApiPath*** 
    The base path to use for remote APIs.

* ***RemoteApiBaseAddress*** 
    The base address to use for remote APIs. If unset (the default), the
    blazor hosting environment's base address is used.
 
* ***StateProviderBaseAddress*** 
    The base address to use for the state provider's calls to the /bff/user
    endpoint. If unset (the default), the blazor hosting environment's base
    address is used.

* ***WebAssemblyStateProviderPollingDelay*** 

    The delay, in milliseconds, before the BffClientAuthenticationStateProvider will
    start polling the /bff/user endpoint. Defaults to 1000 ms.

* ***WebAssemblyStateProviderPollingInterval*** 
    The delay, in milliseconds, between polling requests by the
    BffClientAuthenticationStateProvider to the /bff/user endpoint. Defaults to 5000
    ms.

