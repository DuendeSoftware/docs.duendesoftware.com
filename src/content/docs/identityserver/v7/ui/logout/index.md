---
title: Getting Started
sidebar:
  order: 1
---

# Logout Page

The logout page is responsible for terminating the user's authentication session.
This is a potentially complicated process and involves these steps:
* Ending the session by removing the authentication session cookie in your IdentityServer.
* Possibly triggering sign-out in an external provider if an external login was used.
* Notify all client applications that the user has signed out.
* If the logout is client initiated, redirect the user back to the client.

When IdentityServer needs to show the logout page, it redirects the user to a configurable
`LogoutUrl`.
```cs
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.LogoutUrl = "/path/to/logout";
})
```
If no `LogoutUrl` is set, IdentityServer will infer it from the `LogoutPath` of your Cookie
Authentication Handler. For example:
```cs
builder.Services.AddAuthentication()
    .AddCookie("cookie-handler-with-custom-path", options => 
    {
        options.LogoutPath = "/path/to/logout/from/cookie/handler";
    })
```

If you are using ASP.NET Identity, configure its cookie authentication handler like this:
```cs
builder.Services
    .AddIdentityServer()
    .AddAspNetIdentity<ApplicationUser>();

builder.Services
    .ConfigureApplicationCookie(options => 
    {
        options.LogoutPath = "/path/to/logout/for/aspnet_identity";
    });
```