---
title: "Authentication Session"
weight: 20
---

## Authentication Session

Regardless of how the user proves their identity on the login page, an authentication session must be established.
This authentication session is based on ASP.NET Core’s authentication system, and is tracked with a cookie managed by the [cookie authentication](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/cookie) handler.

To establish the session, ASP.NET Core provides a *SignInAsync* extension method on the *HttpContext*. 
This API accepts a *ClaimsPrincipal* which contains claims that describe the user. 
IdentityServer requires a special claim called *sub* whose value uniquely identifies the user.
On your login page, this would be the code to establish the authentication session and issue the cookie:

```csharp
var claims = new Claim[] {
    new Claim("sub", "unique_id_for_your_user")
};
var identity = new ClaimsIdentity(claims, "pwd");
var user = new ClaimsPrincipal(identity);

await HttpContext.SignInAsync(user);
```

{{% notice note %}}
The *sub* claim is the [subject identifier](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims) and is the most important claim your IdentityServer will issue.
It will uniquely identify the user and must never change and must never be reassigned to a different user.
A GUID data type is a very common choice for the *sub*. 
{{% /notice %}}

Additional claims can be added to the cookie if desired or needed at at other UI pages.
For example, it's common to also issue a *name* claim which represents the user's display name.

The claims issued in the cookie are passed as the *Subject* on the [ProfileDataRequestContext]({{<ref "/reference/profile_service#duendeidentityservermodelsprofiledatarequestcontext">}}) in the [profile service]({{<ref "/fundamentals/claims">}}).


## Well Known Claims Issued From the Login Page

There are some claims beyond *sub* that can be issued by your login page to capture additional information about the user's authentication session.
Internally Duende IdentityServer will set these values if you do not specify them when calling *SignInAsync*.
The claims are:

* ***name***: The display name of the user.
* ***amr***: Name of the [authentication method](https://tools.ietf.org/html/rfc8176) used for user authentication (defaults to *pwd*).
* ***auth_time***: Time in epoch format the user entered their credentials (defaults to the current time).
* ***idp***: Authentication scheme name of the external identity provider used for login. When not specified then the value defaults to *local* indicating that it was a local login.

While you can create the *ClaimsPrincipal* yourself, you can alternatively use IdentityServer extension methods and the *IdentityServerUser* class to make this easier:

```cs
var user = new IdentityServerUser("unique_id_for_your_user")
{
    DisplayName = user.Username
};

await HttpContext.SignInAsync(user);
```

## Cookie Handler Configuration

Duende IdentityServer registers a cookie authentication handler by default for the authentication session. 
The scheme that the handler in the authentication system is identified by is from the constant *IdentityServerConstants.DefaultCookieAuthenticationScheme*.

When configuring IdentityServer, the [AuthenticationOptions]({{<ref "/reference/options#Authentication">}}) expose some settings to control the cookie (e.g. expiration and sliding). For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options =>
    {
        options.Authentication.CookieLifetime = TimeSpan.FromHours(1);
        options.Authentication.CookieSlidingExpiration = false;
    });
}
```

{{% notice note %}}
In addition to the authentication cookie, IdentityServer will issue an additional cookie which defaults to the name *idsrv.session*. This cookie is derived from the main authentication cookie, and it used for the check session endpoint for [browser-based JavaScript clients at signout time]({{<ref "/ui/logout/notification#browser-based-javascript-clients">}}). It is kept in sync with the authentication cookie, and is removed when the user signs out.
{{% /notice %}}

If you require more control over the cookie authentication handler you can register your own cookie handler.
You can then configure IdentityServer to use your cookie handler by setting the *CookieAuthenticationScheme* on the [AuthenticationOptions]({{<ref "/reference/options#Authentication">}}). For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddAuthentication()
        .AddCookie("your_cookie", options => { 
            // ...
        });

    services.AddIdentityServer(options =>
    {
        options.Authentication.CookieAuthenticationScheme = "your_cookie";
    });
}
```

If the *CookieAuthenticationScheme* is not set, the cookie handler marked as the *DefaultAuthenticateScheme* configured for the ASP.NET Core application when using *AddAuthentication* will be the one used. So a scheme registered as the default after the call to *AddIdentityServer* in your startup will be the one used. For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer();

    services.AddAuthentication(defaultScheme: "your_cookie")
        .AddCookie("your_cookie", options => { 
            // ...
        });
}
```
