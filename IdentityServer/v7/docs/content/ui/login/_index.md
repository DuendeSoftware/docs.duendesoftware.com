+++
title = "Login"
weight = 10
chapter = true
+++

# Login Page

The login page is responsible for establishing the user's authentication session.
This requires a user to present credentials and typically involves these steps:
* Provide the user with a page to allow them to enter credentials locally, use an external login provider, or use some other means of authenticating.
* Start the session by creating the authentication session cookie in your IdentityServer.
* If the login is client initiated, redirect the user back to the client.

When IdentityServer needs to show the login page, it redirects the user to a configurable
*LoginUrl*.
```cs
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.LoginUrl = "/path/to/login";
})
```

If no *LoginUrl* is set, IdentityServer will infer it from the *LoginPath* of your Cookie
Authentication Handler. For example:
```cs
builder.Services.AddAuthentication()
    .AddCookie("cookie-handler-with-custom-path", options => 
    {
        options.LoginPath = "/path/to/login/from/cookie/handler";
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
        options.LoginPath = "/path/to/login/for/aspnet_identity";
    });
```
