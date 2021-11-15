---
title: "Building Blazor WASM client applications"
date: 2020-09-10T08:22:12+02:00
weight: 6
---

Similar to JavaScript SPAs, you can build Blazor WASM applications with and without a backend. Not having a backend has all the security disadvantages we discussed already in the JavaScript quickstart. 

If you are building Blazor WASM apps that do not deal with sensitive data and you want to use the no-backend approach, have a look at the standard Microsoft templates, which are using this style.

In this quickstart we will focus on how to build a Blazor WASM application using our Duende.BFF security framework.

{{% notice note %}}
To keep things simple, we will utilize our demo IdentityServer instance hosted at https://demo.duendesoftware.com. We will provide more details on how to configure a Blazor client in your own IdentityServer at then end.
{{% /notice %}}

### Setting up the project
The .NET 6 CLI includes a Blazor WASM with backend template. Create the directory where you want to work in, and run the following command:

```
dotnet new blazorwasm --hosted
```

This will create three projects - server, client and shared. 

### Configuring the backend
First add the following package references to the server project:

```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.OpenIdConnect" Version="6.0.0" />
<PackageReference Include="Duende.BFF" Version="1.1.0" />
```

Next, we will add OpenID Connect and OAuth support to the backend. For this we are adding the Microsoft OpenID Connect authentication handler for the protocol interactions with the token service, and the cookie authentication handler for managing the resulting authentication session. See [here]({{< ref "/bff/session/handlers" >}}) for more background information.

The BFF services provide the logic to invoke the authentication plumbing from the frontend (more about this later).

Add the following snippet to your *Program.cs* above the call to *builder.Build();*

```cs
builder.Services.AddBff();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
        options.DefaultSignOutScheme = "oidc";
    })
    .AddCookie("cookie", options =>
    {
        options.Cookie.Name = "__Host-blazor";
        options.Cookie.SameSite = SameSiteMode.Strict;
    })
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://demo.duendesoftware.com";

        options.ClientId = "interactive.confidential";
        options.ClientSecret = "secret";
        options.ResponseType = "code";
        options.ResponseMode = "query";

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("api");
        options.Scope.Add("offline_access");

        options.MapInboundClaims = false;
        options.GetClaimsFromUserInfoEndpoint = true;
        options.SaveTokens = true;
    });
```

The last step is to add the required middleware for authentication, authorization and BFF session management. Add the following snippet after the call to *UseRouting*:

```cs
app.UseAuthentication();
app.UseBff();
app.UseAuthorization();

app.MapBffManagementEndpoints();
```

Finally you can run the server project. This will start the host, which will in turn deploy the Blazor application to your browser.

Try to manually invoke the BFF login endpoint on */bff/login* - this should bring you to the demo IdentityServer. After login (e.g. using bob/bob), the browser will return to the Blazor application. 

In other words, the fundamental authentication plumbing is already working. Now we need to make the frontend aware of it.

### Modifying the frontend (part 1)
A couple of steps are necessary to security and identity plumbing to a Blazor application.

**a)** Add the authentication/authorization related package to the client project file:

```xml
<PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.Authentication" Version="6.0.0" />
```

**b)** Add a using statement to *_Imports.razor* to bring the above package in scope:

```cs
@using Microsoft.AspNetCore.Components.Authorization
```

**c)** To propagate the current authentication state to all pages in your Blazor client, you a special component called *CascadingAuthenticationState* to your application.  This is done by wrapping the Blazor router with that component in *App.razor*:

```xml
<CascadingAuthenticationState>
    <Router AppAssembly="@typeof(App).Assembly">
        <Found Context="routeData">
            <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)"/>
            <FocusOnNavigate RouteData="@routeData" Selector="h1"/>
        </Found>
        <NotFound>
            <PageTitle>Not found</PageTitle>
            <LayoutView Layout="@typeof(MainLayout)">
                <p role="alert">Sorry, there's nothing at this address.</p>
            </LayoutView>
        </NotFound>
    </Router>
</CascadingAuthenticationState>
```

**d)** Last but not least, we will some conditional rendering to the layout page to be able to trigger login/logout as well as displaying the current user name when logged in. This is achieved by using the *AuthorizeView* component in *MainLayout.razor*:

```xml
<div class="page">
    <div class="sidebar">
        <NavMenu />
    </div>

    <div class="main">
        <div class="top-row px-4">
            <AuthorizeView>
                <Authorized>
                    <strong>Hello, @context.User.Identity.Name!</strong>
                    <a href="@context.User.FindFirst("bff:logout_url")?.Value">Log out</a>
                </Authorized>
                <NotAuthorized>
                    <a href="bff/login">Log in</a>
                </NotAuthorized>
            </AuthorizeView>
        </div>

        <div class="content px-4">
            @Body
        </div>
    </div>
</div>
```

When you now run the Blazor application, you will see the following error in your browser console:

```
crit: Microsoft.AspNetCore.Components.WebAssembly.Rendering.WebAssemblyRenderer[100]
      Unhandled exception rendering component: Cannot provide a value for property 'AuthenticationStateProvider' on type 'Microsoft.AspNetCore.Components.Authorization.CascadingAuthenticationState'. There is no registered service of type 'Microsoft.AspNetCore.Components.Authorization.AuthenticationStateProvider'.
```

*CascadingAuthenticationState* is an abstraction over an arbitrary authentication system. It internally relies on a so called *AuthenticationStateProvider* to return the required information about the current authentication state and the information about the currently logged on user.

This component needs to be implemented, and that's what we'll do next.

### Modifying the frontend (part 2)
The BFF library has a server-side component that allows querying the current authentication session (see [here]({{< ref "/bff/session/management#user" >}})). We will now add a Blazor *AuthenticationStateProvider* that will internally use this endpoint.
