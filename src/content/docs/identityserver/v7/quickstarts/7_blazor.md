---
title: "Building Blazor WASM client applications"
date: 2020-09-10T08:22:12+02:00
weight: 15
---

Similar to JavaScript SPAs, you can build Blazor WASM applications with and without a backend. Not having a backend has all the security disadvantages we discussed already in the JavaScript quickstart. 

If you are building Blazor WASM apps that do not deal with sensitive data and you want to use the no-backend approach, have a look at the standard Microsoft templates, which are using this style.

In this quickstart we will focus on how to build a Blazor WASM application using our Duende.BFF security framework. You can find the full source code [here](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Quickstarts/7_Blazor)

:::note
To keep things simple, we will utilize our demo IdentityServer instance hosted at https://demo.duendesoftware.com. We will provide more details on how to configure a Blazor client in your own IdentityServer at then end.
:::

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

Next, we will add OpenID Connect and OAuth support to the backend. For this we are adding the Microsoft OpenID Connect authentication handler for the protocol interactions with the token service, and the cookie authentication handler for managing the resulting authentication session. See [here](/identityserver/v7/bff/session/handlers) for more background information.

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
A couple of steps are necessary to add the security and identity plumbing to a Blazor application.

**a)** Add the authentication/authorization related package to the client project file:

```xml
<PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.Authentication" Version="6.0.0" />
```

**b)** Add a using statement to *_Imports.razor* to bring the above package in scope:

```cs
@using Microsoft.AspNetCore.Components.Authorization
```

**c)** To propagate the current authentication state to all pages in your Blazor client, you add a special component called *CascadingAuthenticationState* to your application.  This is done by wrapping the Blazor router with that component in *App.razor*:

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

**d)** Last but not least, we will add some conditional rendering to the layout page to be able to trigger login/logout as well as displaying the current user name when logged in. This is achieved by using the *AuthorizeView* component in *MainLayout.razor*:

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

*CascadingAuthenticationState* is an abstraction over an arbitrary authentication system. It internally relies on a service called *AuthenticationStateProvider* to return the required information about the current authentication state and the information about the currently logged on user.

This component needs to be implemented, and that's what we'll do next.

### Modifying the frontend (part 2)
The BFF library has a server-side component that allows querying the current authentication session and state (see [here](/identityserver/v7/bff/session/management/user)). We will now add a Blazor *AuthenticationStateProvider* that will internally use this endpoint.

Add a file with the following content:

```cs
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;

namespace Blazor6.Client.BFF;

public class BffAuthenticationStateProvider 
    : AuthenticationStateProvider
{
    private static readonly TimeSpan UserCacheRefreshInterval 
        = TimeSpan.FromSeconds(60);

    private readonly HttpClient _client;
    private readonly ILogger<BffAuthenticationStateProvider> _logger;

    private DateTimeOffset _userLastCheck 
        = DateTimeOffset.FromUnixTimeSeconds(0);
    private ClaimsPrincipal _cachedUser 
        = new ClaimsPrincipal(new ClaimsIdentity());

    public BffAuthenticationStateProvider(
        HttpClient client,
        ILogger<BffAuthenticationStateProvider> logger)
    {
        _client = client;
        _logger = logger;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        return new AuthenticationState(await GetUser());
    }

    private async ValueTask<ClaimsPrincipal> GetUser(bool useCache = true)
    {
        var now = DateTimeOffset.Now;
        if (useCache && now < _userLastCheck + UserCacheRefreshInterval)
        {
            _logger.LogDebug("Taking user from cache");
            return _cachedUser;
        }

        _logger.LogDebug("Fetching user");
        _cachedUser = await FetchUser();
        _userLastCheck = now;

        return _cachedUser;
    }

    record ClaimRecord(string Type, object Value);

    private async Task<ClaimsPrincipal> FetchUser()
    {
        try
        {
            _logger.LogInformation("Fetching user information.");
            var response = await _client.GetAsync("bff/user?slide=false");

            if (response.StatusCode == HttpStatusCode.OK)
            {
                var claims = await response.Content.ReadFromJsonAsync<List<ClaimRecord>>();

                var identity = new ClaimsIdentity(
                    nameof(BffAuthenticationStateProvider),
                    "name",
                    "role");

                foreach (var claim in claims)
                {
                    identity.AddClaim(new Claim(claim.Type, claim.Value.ToString()));
                }

                return new ClaimsPrincipal(identity);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Fetching user failed.");
        }

        return new ClaimsPrincipal(new ClaimsIdentity());
    }
}
```

..and register it in the client's *Program.cs*:

```cs
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<AuthenticationStateProvider, BffAuthenticationStateProvider>();
```

If you run the server app now again, you will see a different error:

```
fail: Duende.Bff.Endpoints.BffMiddleware[1]
      Anti-forgery validation failed. local path: '/bff/user'
```

This is due to the antiforgery protection that is applied automatically to the management endpoints in the BFF host. To properly secure the call, you need to add a static *X-CSRF* header to the call. See [here](/identityserver/v7/bff/apis/local) for more background information.

This can be easily accomplished by a delegating handler that can be plugged into the default HTTP client used by the Blazor frontend. Let's first add the handler:

```cs
public class AntiforgeryHandler : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.Add("X-CSRF", "1");
        return base.SendAsync(request, cancellationToken);
    }
}
````

..and register it in the client's *Program.cs* (overriding the standard HTTP client configuration; requires package Microsoft.Extensions.Http):

```cs
// HTTP client configuration
builder.Services.AddTransient<AntiforgeryHandler>();

builder.Services.AddHttpClient("backend", client => client.BaseAddress = new Uri(builder.HostEnvironment.BaseAddress))
    .AddHttpMessageHandler<AntiforgeryHandler>();
builder.Services.AddTransient(sp => sp.GetRequiredService<IHttpClientFactory>().CreateClient("backend"));
```

This requires an additional reference in the client project:

```
<PackageReference Include="Microsoft.Extensions.Http" Version="6.0.0" />
```

If you restart the application again, the logon/logoff logic should work now. In addition you can display the contents of the session on the main page by adding this code to *Index.razor*:

```
@page "/"

<PageTitle>Home</PageTitle>

<h1>Hello, Blazor BFF!</h1>

<AuthorizeView>
    <Authorized>
        <dl>
            @foreach (var claim in @context.User.Claims)
            {
                <dt>@claim.Type</dt>
                <dd>@claim.Value</dd>
            }
        </dl>
    </Authorized>
</AuthorizeView>
```

### Securing the local API
The standard Blazor template contains an API endpoint (*WeatherForecastController.cs*). Try invoking the weather page from the UI. It works both in logged in and anonymous state. We want to change the code to make sure, that only authenticated users can call the API.

The standard way in ASP.NET Core would be to add an authorization requirement to the endpoint, either on the controller/action or via the endpoint routing, e.g.:

```cs
app.MapControllers()
        .RequireAuthorization();
```

When you now try to invoke the API anonymously, you will see the following error in the browser console:

```
Access to fetch at 'https://demo.duendesoftware.com/connect/authorize?client_id=...[shortened]... (redirected from 'https://localhost:5002/WeatherForecast') from origin 'https://localhost:5002' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```

This happens because the ASP.NET Core authentication plumbing is triggering a redirect to the OpenID Connect provider for authentication. What we really want in that case is an API friendly status code - 401 in this scenario.

This is one of the features of the BFF middleware, but you need to mark the endpoint as a BFF API endpoint for that to take effect:

```cs
app.MapControllers()
        .RequireAuthorization()
        .AsBffApiEndpoint();
```

After making this change, you should see a much better error message:

```
Response status code does not indicate success: 401 (Unauthorized).
```

The client code can properly respond to this, e.g. triggering a login redirect.

When you logon now and call the API, you can put a breakpoint server-side and inspect that the API controller has access to the claims of the authenticated user via the *.User* property.

### Setting up a Blazor BFF client in IdentityServer
In essence a BFF client is "just" a normal authorization code flow client:

* use the code grant type
* set a client secret
* enable *AllowOfflineAccess* if you want to use refresh tokens
* enable the required identity and resource scopes
* set the redirect URIs for the OIDC handler

Below is a typical code snippet for the client definition:

```cs
var bffClient = new Client
{
    ClientId = "bff",
    
    ClientSecrets =
    {
        new Secret("secret".Sha256())
    },

    AllowedGrantTypes = GrantTypes.Code,

    RedirectUris = { "https://bff_host/signin-oidc" },
    FrontChannelLogoutUri = "https://bff_host/signout-oidc",
    PostLogoutRedirectUris = { "https://bff_host/signout-callback-oidc" },

    AllowOfflineAccess = true,

    AllowedScopes = { "openid", "profile", "remote_api" }
};
```

### Further experiments
Our Blazor BFF [sample](/identityserver/v7/samples/bff#blazor-wasm) is based on this Quickstart. In addition it shows concepts like

* better organization with components
* reacting to logout
* using the authorize attribute to trigger automatic redirects to the login page
