---
title: "Interactive Applications with ASP.NET Core"
date: 2020-09-10T08:22:12+02:00
weight: 3
---
{{% notice note %}}

This quickstart builds on the solution created in 
[Quickstart 1]({{< ref "1_client_credentials" >}}). We recommend you do the 
quickstarts in order, but if you'd like to start here, begin from a copy of 
[Quickstart 1's source code](({{< param qs_base >}}/1_ClientCredentials)). You 
will also need to [install the IdentityServer 
templates]({{< ref "0_overview#preparation" >}}).

{{% /notice %}}

In this quickstart, you will add support for interactive user authentication via
the OpenID Connect protocol to the IdentityServer you built in the previous 
chapter. Once that is in place, you will create an MVC application that will use 
IdentityServer for authentication.

## Enable OIDC in IdentityServer 
To enable OIDC in IdentityServer you need:
- An interactive UI
- Configuration for OIDC scopes
- Configuration for an OIDC client
- Users to log in with

### Add the UI
All the protocol support needed for OpenID Connect is already built into 
IdentityServer. You need to provide the necessary UI parts for login, logout, 
consent and error.

While the look & feel and workflows will differ in each implementation, we
provide a Razor Pages-based UI that you can use as a starting point. This UI can
be found in the Quickstart UI
[repo](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI). You can
clone or download this repo and copy the Pages and wwwroot folders into your
IdentityServer project. Alternatively, you can use the .NET CLI and run the
following command from the the *src/IdentityServer* folder:

```console
dotnet new isui
```

### Enable the UI
Once you have added the UI, you will need to enable Razor Pages in the DI system
and the pipeline. In *HostingExtensions.cs* you will find commented out code in
the *ConfigureServices* and *ConfigurePipeline* methods that enable the UI. Note
that there are three places to comment in - two in *ConfigurePipeline* and one
in *ConfigureServices*.

{{% notice note %}}

There is also a template called *isinmem* which combines the basic
IdentityServer from the isempty template with the starting UI from the isui
template.

{{% /notice %}}

Run the IdentityServer project and navigate to https://localhost:5001. You
should now see a home page.

Spend some time inspecting the pages and models, especially those in the
*Pages/Account* folder. These pages are the main UI entry points for login and
logout. The better you understand them, the easier it will be to make future
modifications.

### Configure OIDC Scopes
Similar to OAuth 2.0, OpenID Connect uses the scopes concept. Again, scopes
represent something you want to protect and that clients want to access. In
contrast to OAuth, scopes in OIDC don't represent APIs, but identity data like
user id, name or email address.

Add support for the standard *openid* (subject id) and *profile* (first name, last name etc..) scopes
by amending the *IdentityResources* property in *Config.cs* in the IdentityServer project:

```cs
public static IEnumerable<IdentityResource> IdentityResources =>
    new List<IdentityResource>
    {
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
    };
```

Register the identity resources with IdentityServer in *HostingExtensions.cs*:

```cs
var builder = services.AddIdentityServer()
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryClients(Config.Clients);
```

{{% notice note %}}
All standard scopes and their corresponding claims can be found in the OpenID Connect [specification](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims).
{{% /notice %}}

### Add Test Users
The sample UI also comes with an in-memory "user database". You can enable this in IdentityServer by adding the *AddTestUsers* extension method:

```cs
builder.Services.AddIdentityServer()
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryClients(Config.Clients)
    .AddTestUsers(TestUsers.Users);
```

In the *TestUsers* class, you can see that two users called *alice* and *bob*
are defined with some identity claims. You can use those users to login.

### Register an OIDC client

The last step needed in the IdentityServer project is to add a new configuration
entry for a client that will use OIDC to log in. You will create the application
code for this client in the next section using MVC. For now, you will register
it with IdentityServer.

OpenID Connect-based clients are very similar to the OAuth 2.0 clients we added
in quickstart 1. But since the flows in OIDC are always interactive, we need to
add some redirect URLs to our configuration.

The client list in *Config.cs* should look like this:

```cs
public static IEnumerable<Client> Clients =>
    new List<Client>
    {
        // machine to machine client (from quickstart 1)
        new Client
        {
            ClientId = "client",
            ClientSecrets = { new Secret("secret".Sha256()) },

            AllowedGrantTypes = GrantTypes.ClientCredentials,
            // scopes that client has access to
            AllowedScopes = { "api1" }
        },
        // interactive ASP.NET Core MVC client
        new Client
        {
            ClientId = "mvc",
            ClientSecrets = { new Secret("secret".Sha256()) },

            AllowedGrantTypes = GrantTypes.Code,
            
            // where to redirect to after login
            RedirectUris = { "https://localhost:5002/signin-oidc" },

            // where to redirect to after logout
            PostLogoutRedirectUris = { "https://localhost:5002/signout-callback-oidc" },

            AllowedScopes = new List<string>
            {
                IdentityServerConstants.StandardScopes.OpenId,
                IdentityServerConstants.StandardScopes.Profile
            }
        }
    };
```

## Create the OIDC client
Next you will create an MVC application that will allow interactive users to log
in using OIDC. Use the *ASP.NET Core Web App (Model-View-Controller)* (i.e. mvc)
template to create the project. Run the following commands from the
*quickstart/src* folder:

```console
dotnet new mvc -n MvcClient
cd ..
dotnet sln add .\src\MvcClient\MvcClient.csproj
```

### Install the OIDC Nuget Package
To add support for OpenID Connect authentication to the MVC application, you
need to add the nuget package containing the OpenID Connect handler to your
project. From the *quickstart\src\MvcClient* folder, run the following command:

```console
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
```

### Configure Authentication Services
Then add the following to *ConfigureServices* in *Program.cs*:

```cs
using System.IdentityModel.Tokens.Jwt;

// ...

JwtSecurityTokenHandler.DefaultMapInboundClaims = false;

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "Cookies";
        options.DefaultChallengeScheme = "oidc";
    })
    .AddCookie("Cookies")
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://localhost:5001";

        options.ClientId = "mvc";
        options.ClientSecret = "secret";
        options.ResponseType = "code";

        options.SaveTokens = true;
    });
```

*AddAuthentication* adds the authentication services to DI. Notice that in its
options, the DefaultChallengeScheme is set to "oidc", and the DefaultScheme is
set to "Cookies". The DefaultChallengeScheme is used when an unauthenticated
user must log in. This begins the OpenID Connect protocol, redirecting the user
to IdentityServer. After the user has logged in and been redirected back to the
MvcClient, the MvcClient creates its own local cookie. Subsequent requests to
the MvcClient will include this cookie and be authenticated with the default
Cookie scheme.

After the call to *AddAuthentication*, *AddCookie* adds the handler that can
process the local auth cookie.

Finally, *AddOpenIdConnect* is used to configure the handler that performs the
OpenID Connect protocol. The *Authority* indicates where the trusted token
service is located. The *ClientId* and the *ClientSecret* identify this client.
*SaveTokens* is used to persist the tokens from IdentityServer in the cookie (as
they will be needed later).

{{% notice note %}}

This uses the *authorization code* flow with PKCE to connect to the OpenID
Connect provider. See [here]({{< ref "/fundamentals/clients" >}}) for more
information on protocol flows.

{{% /notice %}}

### Configure the Pipeline
Now, to ensure the execution of the authentication services on each request, add
*UseAuthentication* to the ASP.NET pipeline in *Program.cs*. Also add
*RequireAuthorization* to the controller routing to disable anonymous access for
the entire application. 

```cs
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .RequireAuthorization();

```

{{% notice note %}}

You could use the *[Authorize]* attribute instead of RequireAuthorization on all
routes if you want to specify authorization on a per controller or action method
basis.

{{% /notice %}}

### Display the Auth Cookie

Modify *Views/Home/Index.cshtml* to display the claims of the user and the
cookie properties:

```cs
@using Microsoft.AspNetCore.Authentication

<h2>Claims</h2>

<dl>
    @foreach (var claim in User.Claims)
    {
        <dt>@claim.Type</dt>
        <dd>@claim.Value</dd>
    }
</dl>

<h2>Properties</h2>

<dl>
    @foreach (var prop in (await Context.AuthenticateAsync()).Properties.Items)
    {
        <dt>@prop.Key</dt>
        <dd>@prop.Value</dd>
    }
</dl>
```

### Configure MvcClient Port
Update the MvcClient's applicationUrl in *launchSettings.json* to use port 5002.

{{% notice note %}}

We recommend using the self-host option over IIS Express. The rest of the docs
assume that MvcClient is self-hosted on port 5002.

{{% /notice %}}

If you now navigate to the application using the browser, a redirect attempt
will be made to IdentityServer. This will result in an error because the MVC
client is not registered yet.

## Test the client
Now everything should be in place to log in to the MVC client. Run
IdentityServer and MvcClient and then trigger the authentication handshake by
navigating to the protected controller action. You should see a redirect to the
login page of the IdentityServer.

![](../images/3_login.png)

After you log in, IdentityServer will redirect back to the MVC client, where the
OpenID Connect authentication handler will process the response and sign-in the
user locally by setting a cookie. Finally the MVC view will show the contents of
the cookie.

![](../images/3_claims.png)

As you can see, the cookie has two parts: the claims of the user and some
metadata. This metadata also contains the original token that was issued by the
IdentityServer. Feel free to copy this token to [jwt.ms](https://jwt.ms>) to
inspect its content.

## Adding sign-out
Next you will add sign-out to the MVC client.

With an authentication service like IdentityServer, it is not enough to clear
the local application cookies. In addition, you also need to make a roundtrip to
the IdentityServer to clear the central single sign-on session.

The protocol steps are implemented inside the OpenID Connect handler. Simply add
the following code to the home controller to trigger the sign-out:

```cs
public IActionResult Logout()
{
    return SignOut("Cookies", "oidc");
}
```

This will clear the local cookie and then redirect to the IdentityServer. The
IdentityServer will clear its cookies and then give the user a link to return
back to the MVC application.

Create a link in _layout.cshtml to the Logout action:
```cs
<div class="navbar-collapse collapse d-sm-inline-flex justify-content-between">
// Other navbar items omitted for brevity
@if (User.Identity.IsAuthenticated)
{
    <li class="nav-item">
        <a class="nav-link text-dark" asp-area="" asp-controller="Home" asp-action="Logout">Logout</a>
    </li>
}
```

## Getting claims from the UserInfo endpoint
You might have noticed that even though you've configured the client to be
allowed to retrieve the *profile* identity scope, the claims associated with
that scope (such as *name*, *family_name*, *website* etc.) don't appear in the
returned token. You need to tell the client to retrieve those claims from the
userinfo endpoint by specifying scopes that the client application needs to
access and setting the *GetClaimsFromUserInfoEndpoint* option. In the following
example we're requesting the *profile* scope, but it could be any scope (or
scopes) that the client is authorized to access:

```cs
.AddOpenIdConnect("oidc", options =>
{
    // ...
    options.Scope.Add("profile");
    options.GetClaimsFromUserInfoEndpoint = true;
    // ...
});
```

After restarting the client app, logging out, and logging back in you should see
additional user claims associated with the *profile* identity scope displayed on
the page.

![](../images/3_additional_claims.png)

## Further Experiments
This quickstart created a client with interactive login using OIDC. To
experiment further you can
- Add additional claims to the identity
- Add support for external authentication

### Add More Claims
To add more claims to the identity:

* Add a new identity resource to the list in *src/IdentityServer/Config.cs*.
  Name it and specify which claims should be returned when it is requested. The
  *Name* property of the resource is the scope value that clients can request to
  get the associated *UserClaims*. For example, you could add an
  *IdentityResource* named "email" which would include the *email* and
  *email_verified* claims.
  ```csharp
    public static IEnumerable<IdentityResource> IdentityResources =>
    new List<IdentityResource>
    { 
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
        new IdentityResource()
        {
            Name = "email",
            UserClaims = new List<string> 
            { 
                JwtClaimTypes.Email,
                JwtClaimTypes.EmailVerified
            }
        }
    };
  ```
  
* Give the client access to the resource via the *AllowedScopes* property on the
  client configuration. The string value in *AllowedScopes* must match the
  *Name* property of the resource.
  ```csharp
    new Client
    {
        ClientId = "mvc",
        //...
        AllowedScopes = new List<string>
        {
            IdentityServerConstants.StandardScopes.OpenId,
            IdentityServerConstants.StandardScopes.Profile,
            "email"
        }
  ```
* Request the resource by adding it to the *Scopes* collection on the OpenID
  Connect handler configuration in *src/MvcClient/Program.cs*, and add a
  [ClaimAction](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnectoptions.claimactions?view=aspnetcore-6.0)
  to map the new claims returned from the userinfo endpoint onto user claims.
  ```csharp
    .AddOpenIdConnect("oidc", options =>
    {
        // ...
        options.Scope.Add("email");
        options.ClaimActions.MapJsonKey("email", "email");
        options.ClaimActions.MapJsonKey("email_verified", "email_verified");
        // ...
    }
  ```

IdentityServer uses the *IProfileService* to retrieve claims for tokens and the
userinfo endpoint. You can provide your own implementation of *IProfileService*
to customize this process with custom logic, data access, etc. Since you are
using *AddTestUsers*, the *TestUserProfileService* is used automatically. It
will automatically include requested claims from the test users added in
*TestUsers.cs*. 

### Add Support for External Authentication
Next we will add support for external authentication.
This is really easy, because all you really need is an ASP.NET Core compatible authentication handler.

ASP.NET Core itself ships with support for Google, Facebook, Twitter, Microsoft Account and OpenID Connect.
In addition you can find implementations for many other authentication providers [here](https://github.com/aspnet-contrib/AspNet.Security.OAuth.Providers).

#### Adding Google support
To be able to use Google for authentication, you first need to register with them.
This is done at their developer [console](https://console.developers.google.com).

Create a new project, enable the Google+ ????? API and configure the callback address of your
local IdentityServer by adding the */signin-google* path to your base-address (e.g. https://localhost:5001/signin-google).

The developer console will show you a client ID and secret issued by Google - you will need that in the next step.

Add the Google authentication handler to the DI of the IdentityServer host.
This is done by first adding the *Microsoft.AspNetCore.Authentication.Google* nuget package and then adding this snippet to *ConfigureServices* in *Startup*:

```cs
services.AddAuthentication()
    .AddGoogle("Google", options =>
    {
        options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;

        options.ClientId = "<insert here>";
        options.ClientSecret = "<insert here>";
    });
```
By default, IdentityServer configures a cookie handler specifically for the results of external authentication (with the scheme based on the constant *IdentityServerConstants.ExternalCookieAuthenticationScheme*).
The configuration for the Google handler is then using that cookie handler.

Now run the MVC client and try to authenticate - you will see a Google button on the login page:

.. image:: images/4_login_page.png

After authentication with the MVC client, you can see that the claims are now being sourced from Google data.

.. note:: If you are interested in the magic that automatically renders the Google button on the login page, inspect the *BuildLoginViewModel* method on the *AccountController*.

#### Adding an additional OpenID Connect-based external provider
You can add an additional external provider.
We have a [cloud-hosted demo](https://demo.duendesoftware.com) version of Duende IdentityServer which you can integrate using OpenID Connect.

Add the OpenId Connect handler to DI:

```cs
services.AddAuthentication()
    .AddGoogle("Google", options =>
    {
        options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;

        options.ClientId = "<insert here>";
        options.ClientSecret = "<insert here>";
    })
    .AddOpenIdConnect("oidc", "Demo IdentityServer", options =>
    {
        options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;
        options.SignOutScheme = IdentityServerConstants.SignoutScheme;
        options.SaveTokens = true;

        options.Authority = "https://demo.duendesoftware.com";
        options.ClientId = "interactive.confidential";
        options.ClientSecret = "secret";
        options.ResponseType = "code";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "name",
            RoleClaimType = "role"
        };
    });
```

And now a user should be able to use the cloud-hosted demo identity provider.

{{% notice note %}}
The quickstart UI auto-provisions external users. As an external user logs in for the first time, a new local user is created, and all the external claims are copied over and associated with the new user. The way you deal with such a situation is completely up to you though. Maybe you want to show some sort of registration UI first. The source code for the default quickstart can be found [here](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI). The controller where auto-provisioning is executed can be found [here](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI/blob/main/Quickstart/Account/ExternalController.cs).
{{% /notice %}}
