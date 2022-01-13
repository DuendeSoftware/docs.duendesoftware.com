---
title: "Interactive Applications with ASP.NET Core"
date: 2020-09-10T08:22:12+02:00
weight: 3
---

Welcome to Quickstart 2 for Duende IdentityServer!

In this quickstart, you will add support for interactive user authentication via
the OpenID Connect protocol to the IdentityServer you built in [Quickstart
1]({{< ref "1_client_credentials" >}}). Once that is in place, you will create
an MVC application that will use IdentityServer for authentication.

{{% notice note %}}

This quickstart builds on the solution created in 
[Quickstart 1]({{< ref "1_client_credentials" >}}). We recommend you do the 
quickstarts in order, but if you'd like to start here, begin from a copy of 
[Quickstart 1's source code](({{< param qs_base >}}/1_ClientCredentials)). You 
will also need to [install the IdentityServer 
templates]({{< ref "0_overview#preparation" >}}).

{{% /notice %}}

## Enable OIDC in IdentityServer 
To enable OIDC in IdentityServer you need:
- An interactive UI
- Configuration for OIDC scopes
- Configuration for an OIDC client
- Users to log in with

### Add the UI
Support for the OpenID Connect protocol is already built into IdentityServer.
You need to provide the User Interface for login, logout, consent and error.

While the look & feel and workflows will differ in each implementation, we
provide a Razor Pages-based UI that you can use as a starting point. You can use
the .NET CLI to add the quickstart UI to a project. Run the following command
from the *IdentityServer* folder:

```console
dotnet new isui
```

### Enable the UI
Once you have added the UI, you will need to register its services and enable it
in the pipeline. In *IdentityServer\HostingExtensions.cs* you will find
commented out code in the *ConfigureServices* and *ConfigurePipeline* methods
that enable the UI. Note that there are three places to comment in - two in
*ConfigurePipeline* and one in *ConfigureServices*.

{{% notice note %}}

There is also a template called *isinmem* which combines the basic
IdentityServer from the *isempty* template with the quickstart UI from the
*isui* template.

{{% /notice %}}

Comment in the service registration and pipeline configuration, run the
*IdentityServer* project, and navigate to https://localhost:5001. You should now
see a home page.

Spend some time reading the pages and models, especially those in the
*Pages/Account* folder. These pages are the main UI entry points for login and
logout. The better you understand them, the easier it will be to make future
modifications.

### Configure OIDC Scopes
Similar to OAuth, OpenID Connect uses scopes to represent something you want to
protect and that clients want to access. In contrast to OAuth, scopes in OIDC
represent identity data like user id, name or email address rather than APIs.

Add support for the standard *openid* (subject id) and *profile* (first name,
last name, etc) scopes by declaring them in *IdentityServer\Config.cs*:

```cs
public static IEnumerable<IdentityResource> IdentityResources =>
    new List<IdentityResource>
    {
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
    };
```

Then register the identity resources in *IdentityServer\HostingExtensions.cs*:

```cs
builder.Services.AddIdentityServer()
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryClients(Config.Clients);
```

{{% notice note %}}

All standard scopes and their corresponding claims can be found in the OpenID
Connect
[specification](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims).

{{% /notice %}}

### Add Test Users
The sample UI also comes with an in-memory "user database". You can enable this
by calling *AddTestUsers* in *IdentityServer\HostingExtensions.cs*:

```cs
builder.Services.AddIdentityServer()
    .AddInMemoryIdentityResources(Config.IdentityResources)
    .AddInMemoryApiScopes(Config.ApiScopes)
    .AddInMemoryClients(Config.Clients)
    .AddTestUsers(TestUsers.Users);
```

In the *TestUsers* class, you can see that two users called *alice* and *bob*
are defined with some identity claims. You can use those users to login. Note
that the test users' passwords match their usernames.

### Register an OIDC client

The last step in the *IdentityServer* project is to add a new configuration
entry for a client that will use OIDC to log in. You will create the application
code for this client in the next section. For now, you will register
its configuration.

OpenID Connect-based clients are very similar to the OAuth clients we added in
[Quickstart 1]({{< ref "1_client_credentials" >}}). But since the flows in OIDC
are always interactive, we need to add some redirect URLs to our configuration.

The *Clients* list in *IdentityServer\Config.cs* should look like this:

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
in using OIDC. Use the mvc template to create the project. Run the following
commands from the *quickstart\src* folder:  

```console
dotnet new mvc -n MvcClient
cd ..
dotnet sln add .\src\MvcClient\MvcClient.csproj
```

### Install the OIDC NuGet Package
To add support for OpenID Connect authentication to *MvcClient*, you need to add
the NuGet package containing the OpenID Connect handler. From the *MvcClient*
folder, run the following command:

```console
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
```

### Configure Authentication Services
Then add the following to *ConfigureServices* in *MvcClient\Program.cs*:

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

*AddAuthentication* registers the authentication services. Notice that in its
options, the DefaultChallengeScheme is set to "oidc", and the DefaultScheme is
set to "Cookies". The DefaultChallengeScheme is used when an unauthenticated
user must log in. This begins the OpenID Connect protocol, redirecting the user
to *IdentityServer*. After the user has logged in and been redirected back to the
client, the client creates its own local cookie. Subsequent requests to the
client will include this cookie and be authenticated with the default Cookie
scheme.

After the call to *AddAuthentication*, *AddCookie* adds the handler that can
process the local cookie.

Finally, *AddOpenIdConnect* is used to configure the handler that performs the
OpenID Connect protocol. The *Authority* indicates where the trusted token
service is located. The *ClientId* and the *ClientSecret* identify this client.
*SaveTokens* is used to persist the tokens in the cookie (as they will be needed
later).

{{% notice note %}}

This uses the *authorization code* flow with PKCE to connect to the OpenID
Connect provider. See [here]({{< ref "/fundamentals/clients" >}}) for more
information on protocol flows.

{{% /notice %}}

### Configure the Pipeline
Now add *UseAuthentication* to the ASP.NET pipeline in *MvcClient\Program.cs*.
Also add *RequireAuthorization* to the controller routing to disable anonymous
access for the entire application. 

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

You could use the *[Authorize]* attribute instead of this *RequireAuthorization*
call if you want to specify authorization on a per controller or action basis.

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

### Configure MvcClient's Port
Update the client's applicationUrl in
*MvcClient\Properties\launchSettings.json* to use port 5002.

```json
{
  "profiles": {
    "MvcClient": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "https://localhost:5002",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

## Test the client
Now everything should be in place to log in to *MvcClient* using OIDC. Run
*IdentityServer* and *MvcClient* and then trigger the authentication handshake by
navigating to the protected controller action. You should see a redirect to the
login page in *IdentityServer*.

![](../images/2_login.png)

After you log in, *IdentityServer* will redirect back to *MvcClient*, where the
OpenID Connect authentication handler will process the response and sign-in the
user locally by setting a cookie. Finally the MVC view will show the contents of
the cookie.

![](../images/2_claims.png)

As you can see, the cookie has two parts: the claims of the user and some
metadata. This metadata also contains the original token that was issued by
*IdentityServer*. Feel free to copy this token to [jwt.ms](https://jwt.ms>) to
inspect its content.

## Adding sign-out
Next you will add sign-out to *MvcClient*. 

To sign out, you need to 
- Clear local application cookies
- Make a roundtrip to *IdentityServer* using the OIDC protocol to clear its
  session

The cookie auth handler will clear the local cookie when you sign out from its
authentication scheme. The OpenId Connect handler will perform the protocol
steps for the roundtrip to *IdentityServer* when you sign out of its scheme. Add
the following code to the home controller to trigger sign-out of both schemes:

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
access and setting the *GetClaimsFromUserInfoEndpoint* option. Add the following
to *ConfigureServices* in *MvcClient\Program.cs*:

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

![](../images/2_additional_claims.png)

## Further Experiments
This quickstart created a client with interactive login using OIDC. To
experiment further you can
- Add additional claims to the identity
- Add support for external authentication

### Add More Claims
To add more claims to the identity:

* Add a new identity resource to the list in *IdentityServer\Config.cs*.
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
  client configuration in *IdentityServer\Config.cs*. The string value in
  *AllowedScopes* must match the *Name* property of the resource.
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
    }
  ```
* Request the resource by adding it to the *Scopes* collection on the OpenID
  Connect handler configuration in *MvcClient\Program.cs*, and add a
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
Adding support for external authentication to your IdentityServer can be done
with very little code; all that is needed is an authentication handler.

ASP.NET Core ships with handlers for Google, Facebook, Twitter, Microsoft
Account and OpenID Connect. In addition, you can find handlers for many
other authentication providers
[here](https://github.com/aspnet-contrib/AspNet.Security.OAuth.Providers).

#### Add Google support
To use Google for authentication, you need to:
- Add the *Microsoft.AspNetCore.Authentication.Google* nuget package to
  the IdentityServer project.
- Register with Google and set up a client.
- Store the client id and secret securely with *dotnet user-secrets*.
- Add the Google authentication handler to the middleware pipeline and configure
  it.

See  [Microsoft's
guide](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/social/google-logins?view=aspnetcore-6.0#create-a-google-api-console-project-and-client-id)
for details on how to register with Google, create the client, and store the
secrets in user-secrets. **Stop before adding the authentication middleware and
Google authentication handler to the pipeline.** You will need an
IdentityServer specific option.

Add the following to *ConfigureServices* in
*IdentityServer\HostingExtensions.cs*:

```cs
builder.Services.AddAuthentication()
    .AddGoogle("Google", options =>
    {
        options.SignInScheme = IdentityServerConstants.ExternalCookieAuthenticationScheme;

        options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientId"];
    });
```

When authenticating with Google, there are again two [authentication
schemes](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/?view=aspnetcore-6.0#authentication-scheme).
*AddGoogle* adds the Google scheme, which handles the protocol flow back and
forth with Google. After successful login, the application needs to sign in to
an additional scheme that can authenticate future requests without needing a
round-trip to Google - typically by issuing a local cookie. The *SignInScheme*
tells the Google handler to use the scheme named
*IdentityServerConstants.ExternalCookieAuthenticationScheme*, which is a cookie
authentication handler automatically created by IdentityServer that is intended
for external logins.

Now run *IdentityServer* and *MvcClient* and try to authenticate (you may need
to log out and log back in). You will see a Google button on the login page.

 ![](../images/2_google_login.png)

Click on Google and authenticate with a Google account. You should land back on
the *MvcClient* home page, showing that the user is now coming from Google with 
claims sourced from Google's data.

{{% notice note %}}

The Google button is rendered by the login page automatically when there are
external providers registered as authentication schemes. See the
*BuildModelAsync* method in *IdentityServer\Pages\Login\Index.cshtml.cs* and
the corresponding Razor template for more details.

{{% /notice %}}

#### Adding an additional OpenID Connect-based external provider
A [cloud-hosted demo](https://demo.duendesoftware.com) version of Duende
IdentityServer can be added as an additional external provider.

Register and configure the services for the OpenId Connect handler in
*IdentityServer\HostingExtensions.cs*:
```cs
builder.Services.AddAuthentication()
    .AddGoogle("Google", options => { /* ... */ })
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

Now if you try to authenticate, you should see an additional button to log in to
the cloud-hosted Demo IdentityServer. If you click that button, you will be
redirected to https://demo.duendesoftware.com/. Note that the demo site is using
the same UI as your site, so there will not be very much that changes visually
when you're redirected. Check that the page's location has changed and then log
in using the alice or bob users (their passwords are their usernames, just as
they are for the local test users). You should land back at *MvcClient*,
authenticated with a demo user. 

The demo users are logically distinct entities from the local test
users, even though they happen to have identical usernames. Inspect their claims
in *MvcClient* and note the differences between them, such as the distinct sub
claims.

{{% notice note %}}

The quickstart UI auto-provisions external users. When an external user logs in
for the first time, a new local user is created with a copy of all the external
user's claims. This auto-provisioning process occurs in the *OnGet* method of
*IdentityServer\Pages\ExternalLogin\Callback.cshtml.cs*, and is completely
customizable. For example, you could modify *Callback* so that it will require
registration before provisioning the external user. 

{{% /notice %}}
