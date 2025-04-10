---
title: "Blazor Rendering modes"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 10
  label: Rendering Modes
redirect_from:
  - /bff/v2/blazor/rendering-modes/
  - /bff/v3/fundamentals/blazor/rendering-modes/
  - /identityserver/v5/bff/fundamentals/blazor/rendering-modes/
  - /identityserver/v6/bff/fundamentals/blazor/rendering-modes/
  - /identityserver/v7/bff/fundamentals/blazor/rendering-modes/
---

Blazor supports [several rendering](https://learn.microsoft.com/en-us/aspnet/core/blazor/components/render-modes?view=aspnetcore-9.0#render-modes) modes:
* **Static Server** - Static server-side rendering (static SSR)	
* **Interactive Server** - Interactive server-side rendering (interactive SSR) using Blazor Server.	
* **Interactive WebAssembly** - Client-side rendering (CSR) using Blazor WebAssembly.	
* **Interactive Auto** - Interactive SSR using Blazor Server initially and then CSR on subsequent visits after the Blazor bundle is downloaded.	

While these options give a lot of flexibility on how sites and components are rendered, it also provides some complexity. 

It's important to understand that, if you use a rendering mode that uses WebAssembly (so InteractiveWebAssembly or Auto), that you're effectively building two applications. One is a server process that renders HTML, the other is a WASM application that runs in the browser. 

If you have a component that's rendered both on the server AND on the client, then you effectively need to make sure that all the services it requires are available both on the server AND on the client. 

## Fetching Data From Local APIs

If your BFF application can directly access data (for example from a database), then you have to decide where this information is rendered. 

For server side rendering, you'll typically abstract your data access logic into a separate class (such as a repository or a query object) and inject this into your component for rendering. 

For web assembly rendering, you'll need to make the data available via a web service on the server. Then on the client, you'll need a configured HTTP client that accesses this information securely. 

When using auto-rendering mode, you'll need to make sure that the component get's a different 'data access' component for server rendering vs client rendering. Consider the following diagram:

![local APIs](../../images/bff_blazor_local_api.svg)

In this diagram, you'll see the example **IDataAccessor** that has two implementations. One that accesses the data via an HTTP client (for use in WASM) and one that directly accesses the data. 

The data is also exposed (and secured by the BFF) via a local api. 

Below is an example of registering an abstraction 

```csharp
// Setup on the server

// Register the server implementation for accessing some data
builder.Services.AddSingleton<IDataAccessor, ServerDataAccessor>();

// Register an api that will access the data
        app.MapGet("/some_data", async (IDataAccessor dataAccessor) => await dataAccessor.GetData())
            .RequireAuthorization()
            .AsBffApiEndpoint();

// Create a class that would actually get the data from the database
internal class ServerWeatherClient() : IDataAccessor
{
    public Task<Data[]> GetData()
    {
        // get the actual data from the database
    }
}

```

```csharp
// setup on the client

// Register a http client that can access the data via a local api. 
builder.Services.AddLocalApiHttpClient<DataAccessHttpClient>();

// Register an adapter that would abstract between the data accessor and the http client. 
builder.Services.AddSingleton<IDataAccessor>(sp => sp.GetRequiredService<HttpClientDataAccessor>());

internal class HttpClientDataAccessor(HttpClient client) : IDataAccessor
{
    public async Task<Data[]> GetSomeData() => await client.GetFromJsonAsync<Data[]>("/some_data")
                                                                  ?? throw new JsonException("Failed to deserialize");
}

``` 

## Fetching Data From Remote APIs

If your BFF needs to secure access to remote APIs, then your components can both directly use a (typed) **HttpClient**. How this HttpClient is configured is quite different on the client vs the server though. 


* On the **Client**, the http client needs to be secured with the authentication cookie and CORS protection headers. This 
then calls the http endpoint on the server. 

* On the **Server**, you'd need to expose the proxied http endpoint. This then uses a http client that's configured to send access tokens. These may or may not contain a user token. 

This diagram shows this in more detail:

![remote APIs](../../images/bff_blazor_remote_api.svg)

```csharp
// setup on the server

app.MapRemoteBffApiEndpoint("/remote-apis/user-token", "https://localhost:5010")

builder.Services.AddUserAccessTokenHttpClient("callApi",
    configureClient: client => client.BaseAddress = new Uri("https://localhost:5010/"));


```

```csharp
// setup on the client
builder.services.AddRemoteApiHttpClient("callApi");
```