+++
title = "Bff Blazor App"
weight = 150
chapter = true
+++

This quickstart walks you through how to create a BFF Blazor application. The sourcecode for this quickstart is available on [github]([link to source code]({{< param samples_base >}}/Quickstarts/BlazorBffApp))


## Creating the project structure

The first step is to create a Blazor app. You can do so using the command line:

``` powershell

mkdir BlazorBffApp
cd BlazorBffApp

dotnet new blazor --interactivity auto --all-interactive
```

This creates a blazor application with a Server project and a client project. 

## Configuring the BffApp server project

To configure the server, the first step is to add the BFF Blazor package. 

``` powershell

cd BlazorBffApp
dotnet add package Duende.BFF.Blazor --version 3.0.0

```

Then you need to configure the application to use the BFF Blazor application. Add this to your services:

``` csharp
// BFF setup for blazor
builder.Services.AddBff()
    .AddServerSideSessions() // Add in-memory implementation of server side sessions
    .AddBlazorServer();


// Configure the authentication
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
        options.DefaultSignOutScheme = "oidc";
    })
    .AddCookie("cookie", options =>
    {
        options.Cookie.Name = "__Host-blazor";

        // Because we use an identity server that's configured on a different site
        // (duendesoftware.com vs localhost), we need to configure the SameSite property to Lax. 
        // Setting it to Strict would cause the authentication cookie not to be sent after loggin in.
        // The user would have to refresh the page to get the cookie.
        // Recommendation: Set it to 'strict' if your IDP is on the same site as your BFF.
        options.Cookie.SameSite = SameSiteMode.Lax;
    })
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://demo.duendesoftware.com";
        options.ClientId = "interactive.confidential";
        options.ClientSecret = "secret";
        options.ResponseType = "code";
        options.ResponseMode = "query";

        options.GetClaimsFromUserInfoEndpoint = true;
        options.SaveTokens = true;
        options.MapInboundClaims = false;

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("api");
        options.Scope.Add("offline_access");

        options.TokenValidationParameters.NameClaimType = "name";
        options.TokenValidationParameters.RoleClaimType = "role";
    });

// Make sure authentication state is available to all components. 
builder.Services.AddCascadingAuthenticationState();

builder.Services.AddAuthorization();

```
To configure the web app pipeline. Replace the app.UseAntiforgery() with the code below:

``` csharp


app.UseRouting();
app.UseAuthentication();

// Add the BFF middleware which performs anti forgery protection
app.UseBff();
app.UseAuthorization();
app.UseAntiforgery();

// Add the BFF management endpoints, such as login, logout, etc.
app.MapBffManagementEndpoints();

```

## Configuring the BffApp.Client project

To add the BFF to the client project, add the following:

``` powershell

cd..
cd BlazorBffApp.Client
dotnet add package Duende.BFF.Blazor.Client --version 3.0.0

```

Then add the following to your program.cs:

``` csharp

builder.Services
    .AddBffBlazorClient(); // Provides auth state provider that polls the /bff/user endpoint

builder.Services
    .AddCascadingAuthenticationState();

```

Your application is ready to use BFF now. 

## Configuring your application to use bff's features

Add the following components to your BlazorBffApp.Client's Component folder:

### LoginDisplay.razor

The following code shows a login / logout button depending on your state. Note, you'll need to use the 
logout link from the LogoutUrl claim, because this contains both the correct route and the session id. 
Add it to the BffBlazorApp.Client/Components folder

``` csharp

@using Duende.Bff.Blazor.Client
@using Microsoft.AspNetCore.Components.Authorization
@using Microsoft.Extensions.Options

@rendermode InteractiveAuto

@inject IOptions<BffBlazorClientOptions> Options

<AuthorizeView>
  <Authorized>
    <strong>Hello, @context.User.Identity?.Name</strong>
    <a class="nav-link btn btn-link" href="@BffLogoutUrl(context)">Log Out</a>
  </Authorized>
  <Authorizing>
    <a class="nav-link btn btn-link disabled">Log in</a>
  </Authorizing>
  <NotAuthorized>
    <a class="nav-link btn btn-link" href="bff/login">Log in</a>
  </NotAuthorized>
</AuthorizeView>


@code {
  string BffLogoutUrl(AuthenticationState context)
  {
    var logoutUrl = context.User.FindFirst(Constants.ClaimTypes.LogoutUrl);
    return $"{Options.Value.StateProviderBaseAddress}{logoutUrl?.Value}";
  }
}

```

### RedirectToLogin.razor

The following code will redirect users to Identity Server for authentication. Once authentication is complete,
the users will be redirected back to where they came from. Add it to the BffBlazorApp.Client/Components folder

``` csharp

@inject NavigationManager Navigation

@rendermode InteractiveAuto

@code {
    protected override void OnInitialized()
    {
        var returnUrl = Uri.EscapeDataString("/" + Navigation.ToBaseRelativePath(Navigation.Uri));
        Navigation.NavigateTo($"bff/login?returnUrl={returnUrl}", forceLoad: true);
    }
}

```

### Modifications to Routes.razor

Replace the contents of routes.razor so it matches below:

``` csharp

@using Microsoft.AspNetCore.Components.Authorization
@using BlazorBffApp.Client.Components

<Router AppAssembly="typeof(Program).Assembly" AdditionalAssemblies="new[] { typeof(Client._Imports).Assembly }">
    <Found Context="routeData">
        <AuthorizeRouteView RouteData="routeData" DefaultLayout="typeof(Layout.MainLayout)">
            <NotAuthorized>
                @if (context.User.Identity?.IsAuthenticated != true)
                {
                    <RedirectToLogin />
                }
                else
                {
                    <p role="alert">You (@context.User.Identity?.Name) are not authorized to access this resource.</p>
                }
            </NotAuthorized>
        </AuthorizeRouteView>
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
</Router>


```

This makes sure that, if you're accessing a page that requires authorization, that you are automatically redirected to Identity Server for authentication. 

### Modifications to MainLayout.razor

Modify your MainLayout so it matches below:

``` csharp
@inherits LayoutComponentBase
@using BlazorBffApp.Client.Components

<div class="page">
    <div class="sidebar">
        <NavMenu />
    </div>

    <main>
        <div class="top-row px-4">
            <LoginDisplay />
        </div>

        <article class="content px-4">
            @Body
        </article>
    </main>
</div>

<div id="blazor-error-ui" data-nosnippet>
    An unhandled error has occurred.
    <a href="." class="reload">Reload</a>
    <span class="dismiss">🗙</span>
</div>

```

This adds the LoginDisplay to the header. 

Now your application supports logging in / out. 

## Exposing api's. 

Now we're going to expose a local api for weather forecasts to Blazor wasm and call it via a HttpClient. 

> By default, the system will perform both pre-rendering on the server AND WASM based rendering on the client. For this reason, you'll need to register both a server and client version of a component that retrieves data.
> See the [Microsoft documentation](https://learn.microsoft.com/en-us/aspnet/core/blazor/components/render-modes?view=aspnetcore-9.0#client-side-services-fail-to-resolve-during-prerendering) for more information on this. 

### Configuring the Client app

Add a class called WeatherClient to the BffBlazorApp.Client project:

``` csharp

public class WeatherHttpClient(HttpClient client) : IWeatherClient
{
    public async Task<WeatherForecast[]> GetWeatherForecasts() => await client.GetFromJsonAsync<WeatherForecast[]>("WeatherForecast")
                                                                  ?? throw new JsonException("Failed to deserialize");
}

public class WeatherForecast
{
    public DateOnly Date { get; set; }
    public int TemperatureC { get; set; }
    public string? Summary { get; set; }
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

// The IWeatherClient interface will form an abstraction between 'server' logic and client logic. 
public interface IWeatherClient
{
    Task<WeatherForecast[]> GetWeatherForecasts();
}

```

Then register this as a component in program.cs. 

``` csharp
builder.Services
    .AddBffBlazorClient()// Provides auth state provider that polls the /bff/user endpoint

    // Register a HTTP Client that's configured to fetch data from the server. 
    .AddLocalApiHttpClient<WeatherHttpClient>() ;

// Register the concrete implementation with the abstraction
builder.Services.AddSingleton<IWeatherClient, WeatherHttpClient>();

```

### Configuring the server

Add a class called ServerWeatherClient to your BlazorBffApp server project:

``` csharp

public class ServerWeatherClient : IWeatherClient
{
    public Task<WeatherForecast[]> GetWeatherForecasts()
    {
        var startDate = DateOnly.FromDateTime(DateTime.Now);

        string[] summaries = [
            "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
        ];


        return Task.FromResult(Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = startDate.AddDays(index),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = summaries[Random.Shared.Next(summaries.Length)]
        }).ToArray());
    }
}

```


Then add an endpoint to your http pipeline:

``` csharp

app.MapGet("/WeatherForecast", (IWeatherClient weatherClient) => weatherClient.GetWeatherForecasts());

```

Also register the 'server abstraction. 
``` csharp
builder.Services.AddSingleton<IWeatherClient, ServerWeatherClient>();
```

### Displaying weather information from the api

By default, the blazor template ships with a weather page. 

Change the content of the **Weather.razor** like this:

``` csharp
@page "/weather"
@using BlazorBffApp.Client.Components
@using Microsoft.AspNetCore.Authorization

@rendermode InteractiveWebAssembly
@attribute [Authorize]

<PageTitle>Weather</PageTitle>

<WeatherComponent @rendermode="new InteractiveWebAssemblyRenderMode()" />
```

Now add a component called WeatherComponent

``` csharp
@inject IWeatherClient WeatherClient
<h1>Weather</h1>

<p>This component demonstrates showing data.</p>

@if (forecasts == null)
{
    <p><em>Loading...</em></p>
}
else
{
    <table class="table">
        <thead>
            <tr>
                <th>Date</th>
                <th aria-label="Temperature in Celsius">Temp. (C)</th>
                <th aria-label="Temperature in Farenheit">Temp. (F)</th>
                <th>Summary</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var forecast in forecasts)
            {
                <tr>
                    <td>@forecast.Date.ToShortDateString()</td>
                    <td>@forecast.TemperatureC</td>
                    <td>@forecast.TemperatureF</td>
                    <td>@forecast.Summary</td>
                </tr>
            }
        </tbody>
    </table>
}

@code {
    private WeatherForecast[]? forecasts;

    protected override async Task OnInitializedAsync()
    {
        forecasts = await WeatherClient.GetWeatherForecasts();
    }
}

```