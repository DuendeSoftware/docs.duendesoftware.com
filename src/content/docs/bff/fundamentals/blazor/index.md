---
title: Blazor support in the BFF Security Framework
sidebar:
  label: Applications
  order: 1
redirect_from:
  - /bff/v2/blazor/
  - /bff/v3/fundamentals/blazor/
  - /identityserver/v5/bff/fundamentals/blazor/
  - /identityserver/v6/bff/fundamentals/blazor/
  - /identityserver/v7/bff/fundamentals/blazor/
---

Microsoft Blazor is a framework for building interactive web applications using C# and .NET. Blazor allows developers to create rich, dynamic web UIs with the same ease as building desktop applications. 

The Duende BFF (Backend for Frontend) Security Framework addresses common security challenges faced by Blazor applications. It provides a unified approach to managing authentication and authorization, ensuring secure interactions between the client and server. 

## Architecture

The following diagram shows how the support for Blazor applications in the Duende BFF Security Framework works:

![blazor-architecture](../../images/bff_blazor.svg)

The BFF exposes endpoints to perform login / logout functionality. The actual authentication (to an identity server) is handled by the **OpenIDConnectHandler**. Once succesfully authenticated, the CookieAuthenticationHandler stores a secure, httponly cookie in the browser. This cookie is then responsible for authenticating all requests from the front-end to the BFF. 

## Handling the various blazor rendering modes

Blazor is very flexible in how it renders applications (and even individual components) and where code is actually executed:

* **Server Side Rendering**: All rendering (and interactivity) happens on the server. 
* **Interactive Server Side Rendering**: All rendering happens on the server, but a streaming connection to the server allows parts of the UI to be updated when the user interacts with the application. This does mean that all interactivity still actually executes on the server. 
* **WASM** It's possible to create web assembly components that render completely in the browser. All interactivity is executed in the browser. 
* **Auto** It's even possible to create components that initially render on the server, but then transition to WASM based rendering (and interactivity) when the WASM Components have been downloaded by the browser. 

These rendering modes are very powerful, but also add additional complexity when it comes to authentication and authorization. Any code that executes on the server can directly access local resources, such has a database, but code that executes on the client needs to through a local http endpoint (that requires authentication). Accessing external APIs is also different between server and client, where the client needs to go through a proxy which performs a token exchange. 

For more information on this, see [rendering-modes](/bff/fundamentals/blazor/rendering-modes)

### Authentication State
The **AuthenticationState ** contains information about the currently logged-in user. This is partly populated from information from the user, but is also enriched with several management claims, such as the Logout URL. 

Blazor uses AuthenticationStateProviders to make authentication state available to components. On the server, the authentication state is already mostly managed by the authentication framework. However, the BFF will add the Logout url to the claims using the **AddServerManagementClaimsTransform**.  On the client, there are some other claims that might be useful. The **BffClientAuthenticationStateProvider** will poll the server to update the client on the latest authentication state, such as the user's claims. This also notifies the front-end if the session is terminated on the server. 

### Server Side Token Store

Blazor Server applications have the same token management requirements as a regular ASP.NET Core web application. Because Blazor Server streams content to the application over a websocket, there often is no HTTP request or response to interact with during the execution of a Blazor Server application. You therefore cannot use *HttpContext* in a Blazor Server application as you would in a traditional ASP.NET Core web application.

This means:

* you cannot use *HttpContext* extension methods
* you cannot use the ASP.NET authentication session to store tokens
* the normal mechanism used to automatically attach tokens to Http Clients making API calls won't work

The **ServerSideTokenStore**, together with the Blazor Server functionality in Duende.AccessTokenManagement is automatically registered when you register Blazor Server. 

For more information on this, see [Blazor Server](/accesstokenmanagement/blazor-server/)

## Adding the BFF Security framework to your Blazor application

Adding 

```csharp
builder.Services.AddBff()
    .AddServerSideSessions() // Add in-memory implementation of server side sessions
    .AddBlazorServer();


// ... <snip>..

// Add the BFF middleware which performs anti forgery protection
app.UseBff();

app.UseAuthorization();
app.UseAntiforgery();

// Add the BFF management endpoints, such as login, logout, etc.
// This has to be added after 'UseAuthorization()'
app.MapBffManagementEndpoints();

// .. <snip>
```

```csharp

var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.Services
    .AddBffBlazorClient() // Provides auth state provider that polls the /bff/user endpoint
    .AddCascadingAuthenticationState();

builder.Services.AddLocalApiHttpClient<WeatherHttpClient>();

```