---
title: Extensibility
description: Learn how to extend and customize Duende.AccessTokenManagement, including custom token retrieval.
sidebar:
  label: Extensibility
  order: 50
  badge:
    text: v4.0
    variant: tip
---

There are several extension points where you can customize the behavior of Duende.AccessTokenManagement.
The extension model is designed to favor composition over inheritance, making it easier to customize and extend while maintaining the library's core functionality.

## Token Retrieval

Token retrieval can be customized by implementing the `AccessTokenRequestHandler.ITokenRetriever` interface.
This interface defines a single method, `GetTokenAsync`, which is called by the `AccessTokenRequestHandler` to retrieve an access token.

A common scenario for this would be if you wanted to implement a different token retrieval flow, that's currently not implemented, such as [Impersonation or Delegation grants (RFC 8693)](https://datatracker.ietf.org/doc/html/rfc8693). Implementing this particular flow is outside the scope of this document.

The following snippet demonstrates how to implement fictive scenario where a custom token retriever dynamically determines which credential flow to use. 

```csharp
// CustomTokenRetriever.cs
public class CustomTokenRetriever(
    UserTokenRequestParameters parameters,
    IClientCredentialsTokenManager clientCredentialsTokenManager,
    IUserTokenManager userTokenManagement,
    IUserAccessor userAccessor,
    ClientCredentialsClientName clientName) : AccessTokenRequestHandler.ITokenRetriever
{
    public async Task<TokenResult<AccessTokenRequestHandler.IToken>> GetTokenAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        // You'll have to make a decision on what token parameters to use,
        // and you can override the default parameters.
        var param = parameters with
        {
            Scope = Scope.Parse("some scope"),
            ForceTokenRenewal = request.GetForceRenewal() // for retry policies. 
        };

        AccessTokenRequestHandler.IToken token;

        // Get the type from current context.
        // Using a random number as an example here.
        int tokenType = new Random().Next(1, 2);

        if (tokenType == 1)
        {
            var getTokenResult = await clientCredentialsTokenManager
                .GetAccessTokenAsync(clientName, param, ct);
            
            if (!getTokenResult.Succeeded)
            {
                return getTokenResult.FailedResult;
            }

            token = getTokenResult.Token;
        }
        else
        {
            var user = await userAccessor.GetCurrentUserAsync(ct);

            var getTokenResult = await userTokenManagement
                .GetAccessTokenAsync(user, param, ct);
            
            if (!getTokenResult.Succeeded)
            {
                return getTokenResult.FailedResult;
            }
            
            token = getTokenResult.Token;
        }

        return TokenResult.Success(token);
    }
}
```

A custom token handler can be linked to your `HttpClient` by creating an `AccessTokenRequestHandler` and adding it to the request pipeline:

```csharp
// Program.cs
services.AddHttpClient<YourTypedHttpClient>()
    .AddDefaultAccessTokenResiliency()
    .AddHttpMessageHandler(provider =>
    {
        var yourCustomTokenRetriever = new CustomTokenRetriever(...);

        var logger = provider.GetRequiredService<ILogger<AccessTokenRequestHandler>>();
        var dPoPProofService = provider.GetRequiredService<IDPoPProofService>();
        var dPoPNonceStore = provider.GetRequiredService<IDPoPNonceStore>();

        return new AccessTokenRequestHandler(
            tokenRetriever: yourCustomTokenRetriever,
            dPoPNonceStore: dPoPNonceStore,
            dPoPProofService: dPoPProofService,
            logger: logger);
    });
```

## Token Request Customization

Token request parameters can be customized by implementing the `ITokenRequestCustomizer` interface.
This interface allows you to dynamically modify token request parameters based on the incoming HTTP request context, making it ideal for multi-tenant applications where token parameters need to vary per tenant.

The customizer is invoked before token retrieval and works with both user and client credentials flows. Unlike implementing a custom token retriever, which replaces the entire token acquisition logic, the customizer focuses on modifying parameters such as scopes, resources or other parts of the `TokenRequestParameters`.

### Multi-Tenant Scenario

In multi-tenant applications, different tenants often require different parameters. For example, each tenant might have:
- A unique API resource or audience identifier
- Tenant-specific scopes

The `ITokenRequestCustomizer` provides a clean way to handle these variations without needing separate `HttpClient` configurations for each tenant.

The following example demonstrates a multi-tenant scenario where the customizer extracts the tenant identifier from the HTTP request and applies tenant-specific token parameters:

```csharp
// MultiTenantTokenRequestCustomizer.cs
public class MultiTenantTokenRequestCustomizer(
    ITenantResolver tenantResolver,
    ITenantConfigurationStore tenantConfigStore) : ITokenRequestCustomizer
{
    public async Task<TokenRequestParameters> Customize(
        HttpRequestMessage httpRequest,
        TokenRequestParameters baseParameters,
        CancellationToken cancellationToken)
    {
        // Extract tenant identifier from the request
        // This could come from a header, subdomain, or route parameter
        var tenantId = await tenantResolver.GetTenantIdAsync(httpRequest, cancellationToken);
        
        // Get tenant-specific configuration
        var tenantConfig = await tenantConfigStore.GetConfigurationAsync(tenantId, cancellationToken);
        
        // Customize parameters with tenant-specific values
        return baseParameters with
        {
            Resource = Resource.Parse(tenantConfig.ApiResource),
            Scope = Scope.Parse(tenantConfig.RequiredScopes),
            // Add any additional customizations
        };
    }
}
```

An instance of the `ITokenRequestCustomizer` implementation can be registered as part of the call to the `Add*Handler` methods:

```csharp
// Program.cs
var customizer = new MultiTenantTokenRequestCustomizer(tenantResolver, tenantConfigStore);

// Client Credentials Token Handler
services.AddHttpClient("client-credentials-token-http-client")
        .AddClientCredentialsTokenHandler(customizer,
            ClientCredentialsClientName.Parse("pure-client-credentials"));

// User Access Token Handler
services.AddHttpClient("user-access-token-http-client")
        .AddUserAccessTokenHandler(customizer);

// Client Access Token Handler
services.AddHttpClient("client-access-token-http-client")
        .AddClientAccessTokenHandler(customizer);
```

If you require access to services from the service provider, you can use the `Add*Handler` method overloads that accept a factory delegate:

```csharp
// Program.cs
builder.Services.AddScoped<MultiTenantTokenRequestCustomizer>();

// Client Credentials Token Handler
services.AddHttpClient("client-credentials-token-http-client")
        .AddClientCredentialsTokenHandler(
            serviceProvider => serviceProvider.GetRequiredService<MultiTenantTokenRequestCustomizer>(),
            ClientCredentialsClientName.Parse("pure-client-credentials"));

// User Access Token Handler
services.AddHttpClient("user-access-token-http-client")
        .AddUserAccessTokenHandler(
            serviceProvider => serviceProvider.GetRequiredService<MultiTenantTokenRequestCustomizer>());

// Client Access Token Handler
services.AddHttpClient("client-access-token-http-client")
        .AddClientAccessTokenHandler(
            serviceProvider => serviceProvider.GetRequiredService<MultiTenantTokenRequestCustomizer>());
```

:::tip[When to use ITokenRequestCustomizer vs ITokenRetriever]
- Use `ITokenRequestCustomizer` when you need to modify token request parameters (scopes, resources, audiences) based on request context
- Use `ITokenRetriever` when you need to replace the entire token acquisition logic with a custom flow
:::

### Additional Use Cases

Beyond multi-tenancy, `ITokenRequestCustomizer` can be used for:
- Dynamically setting scopes based on the target API endpoint
- Adding audience or resource parameters based on request headers or route data
- Implementing per-request token parameter logic without changing the core retrieval flow
