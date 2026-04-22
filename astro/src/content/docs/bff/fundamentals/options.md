---
title: Configuration Options
sidebar:
  order: 10
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

The `Duende.BFF.BffOptions` allows to configure several aspects of the BFF framework.

You set the options at startup time:

```csharp
builder.Services.AddBff(options =>
{
    // configure options here...
})
```

## Common Configurations

The sections below show complete, annotated options blocks for the most common deployment scenarios. The full reference for every option follows after.

### Production Deployment

```csharp
builder.Services.AddBff(options =>
{
    // Required for production — obtain from the Duende licensing portal
    options.LicenseKey = builder.Configuration["Duende:LicenseKey"];

    // Revoke refresh tokens on logout (default: true — keep enabled)
    options.RevokeRefreshTokenOnLogout = true;

    // Log out all sessions for a user when back-channel logout is received
    // Set to true if you want global logout across devices
    options.BackchannelLogoutAllUserSessions = false;

    // Session cleanup (v4+): call .AddSessionCleanupBackgroundProcess() instead
    options.SessionCleanupInterval = TimeSpan.FromMinutes(10);
})
// Use Entity Framework for production-grade session storage
.AddServerSideSessions()
.AddEntityFrameworkServerSideSessions(options =>
{
    options.UseSqlServer(connectionString);
});
```

### Development with a Separate Frontend (Split Host)

When your SPA is served by a separate dev server (e.g., Vite on `localhost:3000`) and the BFF is on a different port:

```csharp
builder.Services.AddBff(options =>
{
    // Allow the separate frontend origin to use silent login
    options.AllowedSilentLoginReferers = ["https://localhost:3000"];
})
.ConfigureCookies(options =>
{
    // Lax is required when the IDP is on a different site than the BFF
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// Allow CORS requests from the dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevSpa", policy =>
        policy.WithOrigins("https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});
```

### Multi-Frontend with Per-Frontend OIDC

```csharp
builder.Services.AddBff()
    // Global OIDC defaults (overridden per-frontend where needed)
    .ConfigureOpenIdConnect(options =>
    {
        options.Authority = "https://login.example.com";
        options.ClientId = "shared-client";
        options.ClientSecret = "secret";
        options.SaveTokens = true;
        options.Scope.Add("offline_access");
    })
    // Register named frontends
    .AddFrontends(
        new BffFrontend(BffFrontendName.Parse("main-app"))
            .WithCdnIndexHtmlUrl(new Uri("https://cdn.example.com/app/index.html")),

        new BffFrontend(BffFrontendName.Parse("admin-app"))
            .MapToPath("/admin")
            .WithOpenIdConnectOptions(opt =>
            {
                // Admin frontend uses a different client ID
                opt.ClientId = "admin-client";
                opt.ClientSecret = "admin-secret";
            })
            .WithCdnIndexHtmlUrl(new Uri("https://cdn.example.com/admin/index.html"))
    );
```

## General

* **`EnforceBffMiddleware`**

    Enables checks in the user management endpoints that ensure that the BFF middleware has been added to the pipeline. Since the middleware performs important security checks, this protects from accidental configuration errors. You can disable this check if it interferes with some custom logic you might have. Defaults to true.

* **`LicenseKey`**

    This sets the license key for Duende.BFF. A license key is required for production deployments. See [licensing](/general/licensing.md) for details about how to configure the license key.

* **`AnonymousSessionResponse`** (added in 2.0)

    This sets the response status code behavior on the [user endpoint](/bff/fundamentals/session/management/user.md) to either return 401 or 200 with a *null* payload when the user is anonymous.

* **`DiagnosticsEnvironments`**
 
    The ASP.NET environment names that enable the diagnostics endpoint. Defaults to "Development".

* **`BackChannelHttpHandler`** 

    A HTTP message handler that's used to configure backchannel communication. Typically used during testing. Configuring this will automatically configure the BackChannelHttpHandler property in _OpenIDConnectOptions_ and also set it as the primary http message handler for retrieving the index.html. 

* **`AutomaticallyRegisterBffMiddleware`** (added in 4.0)

    When using BFF V4 with multiple frontends, several middlewares are automatically added to the pipeline (frontend
    selection, path mapping, OpenID Connect callbacks, management endpoints, and static file proxying). If you need
    full control over the middleware pipeline, set this to `false` and register the middleware manually:

    ```csharp
    builder.Services.AddBff(options =>
    {
        options.AutomaticallyRegisterBffMiddleware = false;
    });
    ```

    When disabled, you must call `UseBffPreProcessing()` early in the pipeline (before authentication) and
    `UseBffPostProcessing()` at the end:

    ```csharp
    app.UseForwardedHeaders();
    app.UseBffPreProcessing();  // Frontend selection, path mapping, OpenID callbacks

    app.UseAuthentication();
    app.UseRouting();
    app.UseBff();               // Anti-forgery checks
    app.UseAuthorization();

    // map your endpoints here...

    app.UseBffPostProcessing();  // Management endpoints, remote API handling, static file proxying
    ```

    You can also use the individual middleware methods for even more granular control:

    * `UseBffFrontendSelection()` — Selects the current frontend based on host/path matching
    * `UseBffPathMapping()` — Adjusts `PathBase` and `Path` for the selected frontend
    * `UseBffOpenIdCallbacks()` — Handles OpenID Connect callback requests
    * `UseBffAntiForgery()` — Validates anti-forgery headers (same as `UseBff()`)
    * `UseBffStaticFileProxying()` — Proxies static file requests to CDN or development server
    

* **`StaticAssetsClientName`**

    If BFF is configured to automatically retrieve the `index.html`, or to proxy the static assets, it needs an HTTP client to do so. With this name, you can automatically configure this HTTP client in the `HttpClientFactory`. 

* **`AllowedSilentLoginReferers`** 

    For silent login to work, you normally need to have the BFF backend and the frontend on the same origin. If you have a split host scenario, meaning the backend on a different origin (but same site) as the frontend, then you can use the referer header to differentiate which browser window to post the silent login results to. This array must then contain the list of allowed referer header values. 

## Paths

* **`LoginPath`**

    Sets the path to the login endpoint. Defaults to */bff/login*.

* **`SilentLoginPath`**

    Sets the path to the silent login endpoint. Defaults to */bff/silent-login*.

* **`SilentLoginCallbackPath`**

    Sets the path to the silent login callback endpoint. Defaults to */bff/silent-login-callback*.

* **`LogoutPath`**

    Sets the path to the logout endpoint. Defaults to */bff/logout*.

* **`UserPath`**

    Sets the path to the user endpoint. Defaults to */bff/user*.

* **`BackChannelLogoutPath`**

    Sets the path to the backchannel logout endpoint. Defaults to */bff/backchannel*.

* **`DiagnosticsPath`**

    Sets the path to the diagnostics endpoint. Defaults to */bff/diagnostics*.

## Session Management

* **`ManagementBasePath`**

    Base path for management endpoints. Defaults to */bff*.

* **`RequireLogoutSessionId`**

    Flag that specifies if the `sid` claim needs to be present in the logout request as query string parameter.
    Used to prevent cross site request forgery.
    Defaults to `true`.

* **`RevokeRefreshTokenOnLogout`**

    Specifies if the user's refresh token is automatically revoked at logout time.
    Defaults to `true`.

* **`BackchannelLogoutAllUserSessions`**

    Specifies if during backchannel logout all matching user sessions are logged out.
    If `true`, all sessions for the subject will be revoked. If false, just the specific session will be revoked.
    Defaults to `false`.

* **`~~EnableSessionCleanup~~`** (removed in V4)

    Indicates if expired server side sessions should be cleaned up.
    This requires an implementation of IUserSessionStoreCleanup to be registered in the ASP.NET Core service provider.
    Defaults to `false`.

    In V4, you need to opt into this value by calling `.AddSessionCleanupBackgroundProcess()`

* **`SessionCleanupInterval`**

    Interval at which expired sessions are cleaned up.
    Defaults to *10 minutes*.


## APIs

* **`AntiForgeryHeaderName`**

    Specifies the name of the header used for anti-forgery header protection.
    Defaults to `X-CSRF`.

* **`AntiForgeryHeaderValue`**

    Specifies the expected value of Anti-forgery header.
    Defaults to `1`.

* **`DPoPJsonWebKey`**

    Specifies the Json Web Key to use when creating DPoP proof tokens. 
    Defaults to null, which is appropriate when not using DPoP.

* **`RemoveSessionAfterRefreshTokenExpiration`**
    Flag that specifies if a user session should be removed after an attempt to use a Refresh Token to acquire
    a new Access Token fails. This behavior is only triggered when proxying requests to remote
    APIs with TokenType.User or TokenType.UserOrClient. Defaults to True. 

* **`DisableAntiForgeryCheck`** (added in V4)
    A delegate that determines if the anti-forgery check should be disabled for a given request. The default is not to disable anti-forgery checks.

## CDN / Static Assets

* **`IndexHtmlDefaultCacheDuration`** (added in V4)

    If you use CDN Index HTML proxying (via `BffFrontend.CdnIndexHtmlUrl`), this controls how long the fetched `index.html` is cached. Defaults to *5 minutes*.

## Diagnostics

* **`Diagnostics`** (added in V4)

    Options that control the way that diagnostic data is logged. This is a nested options object with the following properties:

    * **`LogFrequency`** — Frequency at which diagnostic summaries are logged. Defaults to *1 hour*.
    * **`ChunkSize`** — Max size of diagnostic data log message chunks in bytes. Defaults to *8160 bytes* (8 KB minus 32 bytes for log message formatting overhead).


# BFF Blazor Server Options

In the Blazor Server, you configure the `BffBlazorServerOptions` by using the `AddBlazorServer` method. 

```csharp
builder.Services.AddBlazorServer(opt =>
{
    // configure options here..
})
```

The following options are available:

* **`ServerStateProviderPollingInterval`** 

    The delay, in milliseconds, between polling requests by the
    BffServerAuthenticationStateProvider to the /bff/user endpoint. Defaults to 5000
    ms.

# BFF Blazor Client Options

In WASM, you configure the `BffBlazorClientOptions` using the `AddBffBlazorClient` method:

```csharp
builder.Services.AddBffBlazorClient(opt =>
{
    // configure options here...
})
```

The following options are available:

* **`RemoteApiPath`** 

    The base path to use for remote APIs.

* **`RemoteApiBaseAddress`** 

    The base address to use for remote APIs. If unset (the default), the
    blazor hosting environment's base address is used.
 
* **`StateProviderBaseAddress`** 

    The base address to use for the state provider's calls to the /bff/user
    endpoint. If unset (the default), the blazor hosting environment's base
    address is used.

* **`WebAssemblyStateProviderPollingDelay`** 

    The delay, in milliseconds, before the BffClientAuthenticationStateProvider will
    start polling the /bff/user endpoint. Defaults to 1000 ms.

* **`WebAssemblyStateProviderPollingInterval`** 

    The delay, in milliseconds, between polling requests by the
    BffClientAuthenticationStateProvider to the /bff/user endpoint. Defaults to 5000
    ms.


# Proxy Servers and Load Balancers :badge[v4.0]

When your BFF is hosted behind another reverse proxy or load balancer, you'll want to use `X-Forwarded-*` headers. 

BFF automatically registers the `ForwardedHeaders` middleware in the pipeline, without any additional configuration. You will need to configure which headers should be considered by the middleware, typically the `X-Forwarded-For` and `X-Forwarded-Proto` headers. Here's an example of how you can configure this.  

```csharp
// Program.cs
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    // Consider configuring the 'KnownProxies' and the 'AllowedHosts' to prevent IP spoofing attacks
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});
```

See [proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-9.0) in the Microsoft documentation for more information. 

:::note
Be careful processing `X-Forwarded-*` headers from untrusted sources. Accepting these headers without validating the proxy IP address or network origin may leave you vulnerable to IP Spoofing attacks.

See [Microsoft Security Advisory CVE-2018-0787](https://github.com/aspnet/Announcements/issues/295) for information 
on an elevation-of-privileges vulnerability that affects systems where the proxy doesn't validate or restrict `Host` headers to known good values.
:::
