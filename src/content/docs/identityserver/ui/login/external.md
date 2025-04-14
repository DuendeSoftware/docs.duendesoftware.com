---
title: "Integrating with External Providers"
sidebar:
  order: 60
redirect_from:
  - /identityserver/v5/ui/login/external/
  - /identityserver/v6/ui/login/external/
  - /identityserver/v7/ui/login/external/
---


Integrating with external identity providers enables your application to leverage trusted third-party authentication
systems, such as social logins or corporate directories. This approach simplifies user login while ensuring secure and
standardized authentication workflows.

## External Identity Providers

One option for allowing your users to login is by using an external identity provider.
These external providers can be a social login for your users (e.g. Google), a corporate login system (e.g. Azure AD for
employees), or some other login system your users use.

The workflow using an external provider is much like the workflow from one of your client applications using your
IdentityServer.
Your login page must redirect the user to the identity provider for login, and the identity provider will redirect the
user to a callback endpoint in your IdentityServer to process the results.
This means the external provider should implement a standard protocol (e.g. Open ID Connect, SAML2-P, or WS-Federation)
to allow such an integration.

:::note
It is possible to use a custom protocol to allow logins from an external provider, but you are taking on risk using
something that is not as widely validated and scrutinized as one of the standard authentication protocols (e.g. Open ID
Connect, SAML2-P, or WS-Federation).
:::

To ease integration with external providers, it is recommended to use an authentication handler for ASP.NET Core that
implements the corresponding protocol used by the provider. Many are available as part of ASP.NET Core, but you might
need to find others (both commercial and free) for things like SAML2-P and other social login systems not provided by
ASP.NET Core.

## Registering Authentication Handlers For External Providers

Supporting an external provider is achieved by simply registering the handler in your IdentityServer's startup
configuration.
For example, to use employee logins from Azure AD (AAD):

```csharp
// Program.cs
builder.Services.AddIdentityServer();

builder.Services.AddAuthentication()
    .AddOpenIdConnect("AAD", "Employee Login", options =>
    {
        // options omitted
    });
```

The above snippet registers a scheme called `AAD` in the ASP.NET Core authentication system, and uses a human-friendly
display name of "Employee Login".
The options necessary will be different based on the protocol and identity provider used, and are beyond the scope of
this documentation.

## Triggering The Authentication Handler

To allow the user to be redirected to the external provider, there must be some code in your login page that triggers
the handler.
This can be done because you have provided the user with a button to click, or it could be due to inspecting some
property of the [authorization context](/identityserver/ui/login/context), or it could be based on any
other aspect of the request (e.g. such as the user entering their email).

:::note
The process of determining which identity provider to use is called *Home Realm Discovery*, or `HRD` for short.
:::

To invoke an external authentication handler use the `ChallengeAsync` extension method on the `HttpContext` (or using
the MVC `ChallengeResult`).
When triggering challenge, it's common to pass some properties to indicate the callback URL where you intend to process
the external login results and any other state you need to maintain across the workflow (e.g. such as
the [return URL passed to the login page](/identityserver/ui/login/redirect)):

```cs
var callbackUrl = Url.Action("MyCallback");

var props = new AuthenticationProperties
{
    RedirectUri = callbackUrl,
    Items = 
    { 
        { "scheme", "AAD" },
        { "returnUrl", returnUrl }
    }
};

return Challenge("AAD", props);
```

## The Role Of Cookies In External Logins

ASP.NET Core needs a way to manage the state produced from the result of the external login.
This state is managed (by default) with another cookie using ASP.NET Core's cookie authentication handler.

This extra cookie is necessary since there are typically several redirects involved until you are done with the external
authentication process.

:::note
If you are using ASP.NET Identity, many of these technical details are hidden from you. It is recommended that you also
read the Microsoft [docs](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/social) and do the
ASP.NET Identity [quickstart](/identityserver/quickstarts/5-aspnetid/).
:::

### Sign In Scheme

One option on external authentication handlers is called `SignInScheme`.
This specifies the cookie handler to manage the state:

```cs
// Program.cs
builder.Services.AddAuthentication()
    .AddOpenIdConnect("AAD", "Employee Login", options =>
    {
        options.SignInScheme = "scheme of cookie handler to use";

        // other options omitted
    });
```

Given that this is such a common practice, IdentityServer registers a cookie handler specifically for this external
provider workflow.
The scheme is represented via the `IdentityServerConstants.ExternalCookieAuthenticationScheme` constant.
If you were to use our external cookie handler, then for the `SignInScheme` above, you'd assign the value to be the
`IdentityServerConstants.ExternalCookieAuthenticationScheme` constant:

```cs
// Program.cs
builder.Services.AddAuthentication()
    .AddOpenIdConnect("AAD", "Employee Login", options =>
    {
        options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;

        // other options omitted
    });
```

Alternatively, you can also register your own custom cookie handler instead.
For example:

```cs
// Program.cs
builder.Services.AddAuthentication()
    .AddCookie("MyTempHandler")
    .AddOpenIdConnect("AAD", "Employee Login", options =>
    {
        options.SignInScheme = "MyTempHandler";

        // other options omitted
    });
```

:::note
For specialized scenarios, you can also short-circuit the external cookie mechanism and forward the external user
directly to the main cookie handler. This typically involves handling events on the external handler to make sure you do
the correct claims transformation from the external identity source.
:::

### Sign Out Scheme

`SignInScheme` of the external provider should always be `IdentityServerConstants.ExternalCookieAuthenticationScheme`. 
The `SignOutScheme` depends on whether **ASP.NET Identity** is used or not:

```csharp title="With ASP.NET Identity"
// Program.cs
builder.Services.AddAuthentication()
    .AddCookie("MyTempHandler")
    .AddOpenIdConnect("AAD", "Employee Login", options =>
    {
        options.SignOutScheme = IdentityConstants.ApplicationScheme
        // other options omitted
    });
```

```csharp title="Without ASP.NET Identity"
// Program.cs
builder.Services.AddAuthentication()
    .AddCookie("MyTempHandler")
    .AddOpenIdConnect("AAD", "Employee Login", options =>
    {
        options.SignOutScheme = IdentityServerConstants.SignoutScheme
        // other options omitted
    });
```

Learn more about [ASP.NET Identity and its relationship to Duende IdentityServer](/identityserver/aspnet-identity/).

## Handling The Callback

On the callback page your typical tasks are:

* Inspect the identity returned by the external provider.
* Make a decision how you want to deal with that user. This might be different based on if this is a new user or a
  returning user.
* New users might need additional steps and UI before they are allowed in. Typically, this involves creating a new
  internal user account that is linked to the user from the external provider.
* Store the external claims that you want to keep.
* Delete the temporary cookie.
* Establish the user's [authentication session](/identityserver/ui/login/session).
* Complete the login workflow.

### Inspecting The External Identity

To access the result of the external login, invoke the `AuthenticateAsync` method.
This will read the external cookie to retrieve the claims issued by the external provider and any other state you
previously stored when calling `ChallengeAsync`:

```cs
// read external identity from the temporary cookie
var result = await HttpContext.AuthenticateAsync(IdentityServerConstants.ExternalCookieAuthenticationScheme);
if (result?.Succeeded != true)
{
    throw new Exception("External authentication error");
}

// retrieve claims of the external user
var externalUser = result.Principal;
if (externalUser == null)
{
    throw new Exception("External authentication error");
}

// retrieve claims of the external user
var userId = externalUser.FindFirst("sub").Value;
var scheme = result.Properties.Items["scheme"];

// retrieve returnUrl
var returnUrl = result.Properties.Items["returnUrl"] ?? "~/";

// use the user information to find your user in your database, or provision a new user
```

The `sub` claim from the external cookie is the external provider's unique id for the user.
This value should be used to locate your local user record for the user.

### Establish Session, Clean Up, And Resume Workflow

Once your callback page logic has identified the user based on the external identity provider,
it will log the user in and complete the original login workflow:

```cs
var user = FindUserFromExternalProvider(scheme, userId);

// issue authentication cookie for user
await HttpContext.SignInAsync(new IdentityServerUser(user.SubjectId) 
{
    DisplayName = user.DisplayName,
    IdentityProvider = scheme
});

// delete temporary cookie used during external authentication
await HttpContext.SignOutAsync(IdentityServerConstants.ExternalCookieAuthenticationScheme);

// return back to protocol processing
return Redirect(returnUrl);
```

Typically, the `sub` value used to log the user in would be the user's unique id from your local user database.

## State, URL length, And ISecureDataFormat

When redirecting to an external provider for sign-in, frequently state from the client application must be
round-tripped.
This means that state is captured prior to leaving the client and preserved until the user has returned to the client
application.
Many protocols, including OpenID Connect, allow passing some sort of state as a parameter as part of the request, and
the identity provider will return that state in the response.
The OpenID Connect authentication handler provided by ASP.NET Core utilizes this feature of the protocol, and that is
how it implements the `returnUrl` feature mentioned above.

The problem with storing state in a request parameter is that the request URL can get too large (over the common limit
of 2000 characters).
The OpenID Connect authentication handler does provide an extensibility point to store the state in your server, rather
than in the request URL.
You can implement this yourself by implementing `ISecureDataFormat<AuthenticationProperties>` and configuring it on the
`OpenIdConnectOptions`.

Fortunately, IdentityServer provides an implementation of this for you, backed by the `IDistributedCache` implementation
registered in the DI container (e.g. the standard `MemoryDistributedCache`).
To use the IdentityServer provided secure data format implementation, simply call the `AddOidcStateDataFormatterCache`
extension method on the `IServiceCollection` when configuring DI.

If no parameters are passed, then all OpenID Connect handlers configured will use the IdentityServer provided secure
data format implementation:

```cs
// Program.cs
// configures the OpenIdConnect handlers to persist the state parameter into the server-side IDistributedCache.
builder.Services.AddOidcStateDataFormatterCache();

builder.Services.AddAuthentication()
    .AddOpenIdConnect("demoidsrv", "IdentityServer", options =>
    {
        // ...
    })
    .AddOpenIdConnect("aad", "Azure AD", options =>
    {
        // ...
    })
    .AddOpenIdConnect("adfs", "ADFS", options =>
    {
        // ...
    });
```

If only particular schemes are to be configured, then pass those schemes as parameters:

```cs
// configures the OpenIdConnect handlers to persist the state parameter into the server-side IDistributedCache.
builder.Services.AddOidcStateDataFormatterCache("aad", "demoidsrv");
```

See this [quickstart](/identityserver/quickstarts/2-interactive/) for step-by-step instructions for adding external
authentication and configuring it.
