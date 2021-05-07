---
title: "ASP.NET Core Authentication System"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

You typically use the following two ASP.NET Core authentication handlers to implement remote authentication:

* the OpenID Connect authentication handler to interact with the remote OIDC / OAuth token service
* the cookie handler to do local session management

Furthermore the BFF plumbing relies on the configuration of the ASP.NET Core default authentication schemes. This describes how the two handlers share the work.

OpenID Connect for *challenge* and *signout* - cookies for all the other operations:

```csharp
services.AddAuthentication(options =>
{
    options.DefaultScheme = "cookie";
    options.DefaultChallengeScheme = "oidc";
    options.DefaultSignOutScheme = "oidc";
})
    .AddCookie("cookie", options => { ... })
    .AddOpenIdConnect("oidc", options => { ... })
);    
```

### The OpenID Connect Authentication Handler
The OIDC handler connects the application to the authentication / access token system.

The exact settings depend on the OIDC provider and its configuration settings. We recommend:

* use authorization code flow with PKCE
* use a *response_mode* of *query* since this plays nicer with *SameSite* cookies
* use a strong client secret. Since the BFF can be a confidential client, it is totally possible to use strong client authentication like JWT assertions, JAR or MTLS
* turn off inbound claims mapping
* save the tokens into the authentication session so they can be automatically managed
* request a refresh token using the *offline_access* scope

```csharp
services.AddAuthentication().AddOpenIdConnect("oidc", options =>
{
    options.Authority = "https://demo.duendesoftware.com";
    
    // confidential client using code flow + PKCE
    options.ClientId = "spa";
    options.ClientSecret = "secret";
    options.ResponseType = "code";

    // query response type is compatible with strict SameSite mode
    options.ResponseMode = "query";

    // get claims without mappings
    options.MapInboundClaims = false;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // save tokens into authentication session
    // to enable automatic token management
    options.SaveTokens = true;

    // request scopes
    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("api");

    // and refresh token
    options.Scope.Add("offline_access");
});
```
The OIDC handler will use the default sign-in handler (the cookie handler) to establish a session after successful validation of the OIDC response.

### The Cookie Handler
The cookie handler is responsible for establishing the session and manage authentication session related data.

Things to consider:

* determine the session lifetime - and if the session lifetime should be sliding or absolute
* it is recommended to use a cookie name [prefix](https://tools.ietf.org/html/draft-ietf-httpbis-rfc6265bis-07#section-4.1.3) if compatible with your application
* use the highest available *SameSite* mode that is compatible with your application, e.g. *strict*, but at least *lax*

```csharp
services.AddAuthentication().AddCookie("cookie", options =>
{
    // set session lifetime
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    
    // sliding or absolute
    options.SlidingExpiration = false;

    // host prefixed cookie name
    options.Cookie.Name = "__Host-spa";
    
    // strict SameSite handling
    options.Cookie.SameSite = SameSiteMode.Strict;
});
```