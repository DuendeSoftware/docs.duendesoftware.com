---
title: Service Workers and Background Tasks
date: 2024-10-12
description: Learn how to manage OAuth access tokens in worker applications and background tasks using Duende.AccessTokenManagement
sidebar:
  label: Service Workers
  order: 2
redirect_from:
  - /foss/accesstokenmanagement/workers/
---

A common scenario in worker applications or background tasks (or really any daemon-style applications) is to call APIs using an OAuth token obtained via the client credentials flow.

The access tokens need to be requested and cached (either locally or shared between multiple instances) and made available to the code calling the APIs. In case of expiration (or other token invalidation reasons), a new access token needs to be requested.

The actual business code should not need to be aware of this.

Have a look for the [`Worker` project in the samples folder](https://github.com/DuendeSoftware/foss/tree/main/access-token-management/samples/) for running code.

## Setup

Start by adding a reference to the `Duende.AccessTokenManagement` NuGet package to your application.

```bash
dotnet add package Duende.AccessTokenManagement
```

You can add the necessary services to the ASP.NET Core service provider by calling `AddClientCredentialsTokenManagement()`. After that you can add one or more named client definitions by calling `AddClient`.

```csharp
// Program.cs
// default cache
services.AddDistributedMemoryCache();

services.AddClientCredentialsTokenManagement()
    .AddClient("catalog.client", client =>
    {
        client.TokenEndpoint = "https://demo.duendesoftware.com/connect/token";

        client.ClientId = "6f59b670-990f-4ef7-856f-0dd584ed1fac";
        client.ClientSecret = "d0c17c6a-ba47-4654-a874-f6d576cdf799";

        client.Scope = "catalog inventory";
    })
    .AddClient("invoice.client", client =>
    {
        client.TokenEndpoint = "https://demo.duendesoftware.com/connect/token";

        client.ClientId = "ff8ac57f-5ade-47f1-b8cd-4c2424672351";
        client.ClientSecret = "4dbbf8ec-d62a-4639-b0db-aa5357a0cf46";

        client.Scope = "invoice customers";
    });
```

### HTTP Client Factory

You can register HTTP clients with the factory that will automatically use the above client definitions to request and use access tokens.

The following code registers an HTTP client called `invoices` to automatically use the `invoice.client` definition:

```csharp
// Program.cs
services.AddClientCredentialsHttpClient("invoices", "invoice.client", client =>
{
    client.BaseAddress = new Uri("https://apis.company.com/invoice/");
});
```

You can also set up a typed HTTP client to use a token client definition, e.g.:

```csharp
// Program.cs
services.AddHttpClient<CatalogClient>(client =>
    {
        client.BaseAddress = new Uri("https://apis.company.com/catalog/");
    })
    .AddClientCredentialsTokenHandler("catalog.client");
```

## Usage

There are two fundamental ways to interact with token management - manually, or via the HTTP factory.

### Manual

You can retrieve the current access token for a given token client via `IClientCredentialsTokenManagementService.GetAccessTokenAsync`.

```csharp
// WorkerManual.cs
public class WorkerManual : BackgroundService
{
    private readonly IHttpClientFactory _clientFactory;
    private readonly IClientCredentialsTokenManagementService _tokenManagementService;

    public WorkerManualIHttpClientFactory factory, IClientCredentialsTokenManagementService tokenManagementService)
    {
        _clientFactory = factory;
        _tokenManagementService = tokenManagementService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {          
        while (!stoppingToken.IsCancellationRequested)
        {
            var client = _clientFactory.CreateClient();
            client.BaseAddress = new Uri("https://apis.company.com/catalog/");
            
            // get access token for client and set on HttpClient
            var token = await _tokenManagementService.GetAccessTokenAsync("catalog.client");
            client.SetBearerToken(token.Value);
            
            var response = await client.GetAsync("list", stoppingToken);
                
            // rest omitted
        }
    }
}
```

You can customize some of the per-request parameters by passing in an instance of `ClientCredentialsTokenRequestParameters`. This allows forcing a fresh token request (even if a cached token would exist) and also allows setting a per-request scope, resource and client assertion.

### HTTP Factory

If you have set up HTTP clients in the HTTP factory, then no token related code is needed at all, e.g.:

```csharp
// WorkerHttpClient.cs
public class WorkerHttpClient : BackgroundService
{
    private readonly ILogger<WorkerHttpClient> _logger;
    private readonly IHttpClientFactory _clientFactory;

    public WorkerHttpClient(ILogger<WorkerHttpClient> logger, IHttpClientFactory factory)
    {
        _logger = logger;
        _clientFactory = factory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var client = _clientFactory.CreateClient("invoices");
            var response = await client.GetAsync("test", stoppingToken);

            // rest omitted
        }
    }
}
```

**remark** The clients in the factory have a message handler attached to them that automatically re-tries the request in case of a `401` response code. The request get re-sent with a newly requested access token. If this still results in a `401`, the response is returned to the caller.