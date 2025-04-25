---
title: Customizing Client Credentials Token Management
description: Learn how to customize client credentials token management including client options, backchannel communication, and token caching configurations.
sidebar:
  label: Client Credentials
  order: 1
redirect_from:
  - /foss/accesstokenmanagement/advanced/client_credentials/
---

The most common way to use the access token management for [machine-to-machine communication](/accesstokenmanagement/workers) - however, you may want to customize certain aspects of it. Here's what you can do.

## Client Options

You can add token client definitions to your host while configuring the ASP.NET Core service provider, e.g.:

```csharp
// Program.cs
services.AddClientCredentialsTokenManagement()
  .AddClient("invoices", client =>
  {
        client.TokenEndpoint = "https://sts.company.com/connect/token";

    	client.ClientId = "4a632e2e-0466-4e5a-a094-0455c6105f57";
    	client.ClientSecret = "e8ae294a-d5f3-4907-88fa-c83b3546b70c";
    	client.ClientCredentialStyle = ClientCredentialStyle.AuthorizationHeader;
                        
    	client.Scope = "list";
    	client.Resource = "urn:invoices";
  })
```

You can set the following options:

* `TokenEndpoint` - URL of the OAuth token endpoint where this token client requests tokens from
* `ClientId` - client ID
* `ClientSecret` - client secret (if a shared secret is used)
* `ClientCredentialStyle` - Specifies how the client ID / secret is sent to the token endpoint. Options are using the authorization header, or POST body values (defaults to header)
* `Scope` - the requested scope of access (if any)
* `Resource` - the resource indicator (if any)

Internally the standard .NET options system is used to register the configuration. This means you can also register clients like this:

```csharp
// Program.cs
services.Configure<ClientCredentialsClient>("invoices", client =>
{
    client.TokenEndpoint = "https://sts.company.com/connect/token";

    client.ClientId = "4a632e2e-0466-4e5a-a094-0455c6105f57";
   	client.ClientSecret = "e8ae294a-d5f3-4907-88fa-c83b3546b70c";

    client.Scope = "list";
    client.Resource = "urn:invoices";
});
```

Or use the `IConfigureNamedOptions` if you need access to the ASP.NET Core service provider during registration, e.g.:

```csharp
// ClientCredentialsClientConfigureOptions.cs
using Duende.AccessTokenManagement;
using Duende.IdentityModel.Client;
using Microsoft.Extensions.Options;

public class ClientCredentialsClientConfigureOptions(DiscoveryCache cache)
    : IConfigureNamedOptions<ClientCredentialsClient>
{
    public void Configure(string? name, ClientCredentialsClient options)
    {
        if (name == "invoices")
        {
            var disco = cache.GetAsync().GetAwaiter().GetResult();

            options.TokenEndpoint = disco.TokenEndpoint;
            
            options.ClientId = "4a632e2e-0466-4e5a-a094-0455c6105f57";
            options.ClientSecret = "e8ae294a-d5f3-4907-88fa-c83b3546b70c";

            options.Scope = "list";
            options.Resource = "urn:invoices";
        }
    }

    public void Configure(ClientCredentialsClient options)
    {
        // implement default configure
        Configure("", options);
    }
}
```

You will also need to register the config options, for example:

```csharp
// Program.cs
services.AddClientCredentialsTokenManagement();

services.AddSingleton(new DiscoveryCache("https://sts.company.com"));
services.AddSingleton<IConfigureOptions<ClientCredentialsClient>, 	
	ClientCredentialsClientConfigureOptions>();
```

### Backchannel Communication

By default, all backchannel communication will be done using a named client from the HTTP client factory. The name is `Duende.AccessTokenManagement.BackChannelHttpClient` which is also a constant called `ClientCredentialsTokenManagementDefaults.BackChannelHttpClientName`.

You can register your own HTTP client with the factory using the above name and thus provide your own custom HTTP client.

The client registration object has two additional properties to customize the HTTP client:

* `HttpClientName` - if set, this HTTP client name from the factory will be used instead of the default one
* `HttpClient` - allows setting an instance of `HttpClient` to use. Will take precedence over a client name

### Token caching

By default, tokens will be cached using the `IDistributedCache` abstraction in ASP.NET Core. You can either use the in-memory cache version, or a real distributed cache like Redis.

For development purposes, you can use the `MemoryDistributedCache`:

```cs
// Program.cs
services.AddDistributedMemoryCache();
```

Note that `MemoryDistributedCache` will be cleared whenever the process is restarted. It won't be shared between multiple instances of your application in a load-balanced environment. 
As a result, a new token will have to be obtained when you restart your application, and each instance will obtain a different token.

For production deployments, we recommend using a [distributed cache](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed#establish-distributed-caching-services).

The built-in cache in `Duende.AccessTokenManagment` uses two settings from the options, which apply with any `IDistributedCache`: 

```cs
// Program.cs
services.AddClientCredentialsTokenManagement(options =>
    {
        options.CacheLifetimeBuffer = 60;
        options.CacheKeyPrefix = "Duende.AccessTokenManagement.Cache::";
    });
```

`CacheLifetimeBuffer` is a value in seconds that will be subtracted from the token lifetime, e.g. if a token is valid for one hour, it will be cached for 59 minutes only. The cache key prefix is used to construct the unique key for the cache item based on client name, requested scopes and resource.

Finally, you can also replace the caching implementation altogether by registering your own `IClientCredentialsTokenCache`. 

