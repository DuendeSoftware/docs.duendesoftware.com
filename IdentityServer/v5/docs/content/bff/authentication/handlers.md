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


### The Cookie Handler

```csharp
services.AddAuthentication().AddCookie("cookie", options =>
{
    // host prefixed cookie name
    options.Cookie.Name = "__Host-spa5";
    
    // strict SameSite handling
    options.Cookie.SameSite = SameSiteMode.Strict;
});
```