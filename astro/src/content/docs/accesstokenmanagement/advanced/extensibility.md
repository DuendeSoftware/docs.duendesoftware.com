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

The following example demonstrates a multi-tenant scenario where the customizer extracts the tenant identifier from the HTTP request context and applies tenant-specific token parameters:

```csharp
// MultiTenantTokenRequestCustomizer.cs
public class MultiTenantTokenRequestCustomizer(
    ITenantResolver tenantResolver,
    ITenantConfigurationStore tenantConfigStore) : ITokenRequestCustomizer
{
    public async Task<TokenRequestParameters> Customize(
        HttpRequestContext httpRequestContext,
        TokenRequestParameters baseParameters,
        CancellationToken cancellationToken = default)
    {
        // Extract tenant identifier from the request context
        // HttpRequestContext provides access to the HttpRequestMessage
        // This could come from a header, subdomain, or route parameter
        var tenantId = await tenantResolver.GetTenantIdAsync(
            httpRequestContext.HttpRequestMessage, cancellationToken);
        
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

## Principal Transformation After Token Refresh

After a token refresh, you can update the user's claims before the authentication session is re-issued. The `TransformPrincipalAfterRefreshAsync` delegate transforms the `ClaimsPrincipal` after a successful token refresh.

```csharp
public delegate Task<ClaimsPrincipal> TransformPrincipalAfterRefreshAsync(
    ClaimsPrincipal principal, 
    CancellationToken ct);
```

### Use Cases

- **Refreshing claims from the identity provider**: Fetch updated claims from the userinfo endpoint after token refresh
- **Updating role or permission claims**: Update roles or permissions that changed between token refreshes
- **Adding computed claims**: Add claims based on external data sources that may have changed

### Example: Updating Claims After Refresh

```csharp
// Program.cs
builder.Services.AddOpenIdConnectAccessTokenManagement(options =>
{
    // Configure other options...
});

// Register the principal transformation
builder.Services.AddSingleton<TransformPrincipalAfterRefreshAsync>(
    serviceProvider =>
        async (principal, ct) =>
        {
            // Create a new identity with the existing claims
            var identity = (ClaimsIdentity)principal.Identity!;
        
            // Example: Fetch updated roles from a service
            var roleService = serviceProvider.GetRequiredService<ICustomUserRoleService>();
            var currentRoles = await roleService.GetRolesForUserAsync(
                principal.FindFirstValue("sub"), ct);
        
            // Remove old role claims and add new ones
            var existingRoleClaims = identity.FindAll("role").ToList();
            foreach (var claim in existingRoleClaims)
            {
                identity.RemoveClaim(claim);
            }
        
            foreach (var role in currentRoles)
            {
                identity.AddClaim(new Claim("role", role));
            }
        
            return principal;
        });
```

:::tip[When to use TransformPrincipalAfterRefreshAsync]
Use this delegate when claims need to be synchronized with external systems during token refresh. For static claim transformations that happen at login time, use `IClaimsTransformation` instead.
:::

## User Accessor

The `IUserAccessor` interface provides access to the current user's `ClaimsPrincipal`. Use this to access the current user outside of an HTTP request context, such as in background services or message handlers.

```csharp
public interface IUserAccessor
{
    /// <summary>
    /// Gets the current user's ClaimsPrincipal
    /// </summary>
    Task<ClaimsPrincipal> GetCurrentUserAsync(CancellationToken ct = default);
}
```

### Custom User Accessor Example

The default implementation uses `IHttpContextAccessor`. For scenarios where you need to access the user from a different context (e.g., a background job with a captured user identity), implement a custom `IUserAccessor`:

```csharp
public class BackgroundJobUserAccessor : IUserAccessor
{
    private readonly AsyncLocal<ClaimsPrincipal?> _currentUser = new();

    public void SetUser(ClaimsPrincipal user)
    {
        _currentUser.Value = user;
    }

    public Task<ClaimsPrincipal> GetCurrentUserAsync(CancellationToken ct = default)
    {
        return Task.FromResult(_currentUser.Value 
            ?? throw new InvalidOperationException("No user context available"));
    }
}
```

Register your custom accessor:

```csharp
// Program.cs
builder.Services.AddSingleton<BackgroundJobUserAccessor>();
builder.Services.AddSingleton<IUserAccessor>(sp => sp.GetRequiredService<BackgroundJobUserAccessor>());
```

## Token Refresh Concurrency Control

The `IUserTokenRequestConcurrencyControl` interface provides synchronization for token refresh operations. This prevents the "thundering herd" problem where multiple concurrent requests all attempt to refresh the same token simultaneously.

```csharp
public interface IUserTokenRequestConcurrencyControl
{
    /// <summary>
    /// Executes a token retrieval operation with concurrency control.
    /// If multiple requests attempt to refresh the same token concurrently,
    /// only one will execute the refresh and others will wait for the result.
    /// </summary>
    Task<TokenResult<UserToken>> ExecuteWithConcurrencyControlAsync(
        UserRefreshToken key,
        Func<Task<TokenResult<UserToken>>> tokenRetriever,
        CancellationToken ct = default);
}
```

### Custom Concurrency Control

The default implementation uses in-memory locking, which works for single-server deployments. For distributed scenarios (multiple servers), implement a custom version using distributed locking:

```csharp
public class DistributedTokenConcurrencyControl : IUserTokenRequestConcurrencyControl
{
    private readonly IDistributedLockProvider _lockProvider;

    public DistributedTokenConcurrencyControl(IDistributedLockProvider lockProvider)
    {
        _lockProvider = lockProvider;
    }

    public async Task<TokenResult<UserToken>> ExecuteWithConcurrencyControlAsync(
        UserRefreshToken key,
        Func<Task<TokenResult<UserToken>>> tokenRetriever,
        CancellationToken ct = default)
    {
        // Create a lock key based on the refresh token hash
        var lockKey = $"token-refresh:{key.RefreshToken.ToString().GetHashCode()}";
        
        await using var handle = await _lockProvider.AcquireLockAsync(
            lockKey, 
            timeout: TimeSpan.FromSeconds(30), 
            ct);
        
        // Execute the token retrieval while holding the lock
        return await tokenRetriever();
    }
}
```

## Token Endpoint Operations

The `IOpenIdConnectUserTokenEndpoint` interface provides low-level access to token endpoint operations. Use this for testing, mocking, or custom token refresh logic.

```csharp
public interface IOpenIdConnectUserTokenEndpoint
{
    /// <summary>
    /// Refreshes an access token using a refresh token
    /// </summary>
    Task<TokenResult<UserToken>> RefreshAccessTokenAsync(
        UserRefreshToken userToken,
        UserTokenRequestParameters parameters,
        CancellationToken ct = default);

    /// <summary>
    /// Revokes a refresh token at the identity provider
    /// </summary>
    Task RevokeRefreshTokenAsync(
        UserRefreshToken userToken,
        UserTokenRequestParameters parameters,
        CancellationToken ct = default);
}
```

### Testing with Mock Token Endpoint

```csharp
public class MockUserTokenEndpoint : IOpenIdConnectUserTokenEndpoint
{
    public Task<TokenResult<UserToken>> RefreshAccessTokenAsync(
        UserRefreshToken userToken,
        UserTokenRequestParameters parameters,
        CancellationToken ct = default)
    {
        // Return a test token for integration testing
        var token = new UserToken
        {
            AccessToken = AccessToken.Parse("test-access-token"),
            RefreshToken = RefreshToken.Parse("test-refresh-token"),
            Expiration = DateTimeOffset.UtcNow.AddHours(1)
        };
        
        return Task.FromResult(TokenResult.Success(token));
    }

    public Task RevokeRefreshTokenAsync(
        UserRefreshToken userToken,
        UserTokenRequestParameters parameters,
        CancellationToken ct = default)
    {
        // No-op for testing
        return Task.CompletedTask;
    }
}
```

## OpenID Connect Configuration Service

The `IOpenIdConnectConfigurationService` interface extracts configuration from the registered OpenID Connect authentication handler. Use this to access OIDC configuration for custom token operations.

```csharp
public interface IOpenIdConnectConfigurationService
{
    /// <summary>
    /// Gets the OpenID Connect configuration for the specified scheme
    /// </summary>
    Task<OpenIdConnectClientConfiguration> GetOpenIdConnectConfigurationAsync(
        Scheme? schemeName = default,
        CancellationToken ct = default);
}
```

The returned `OpenIdConnectClientConfiguration` contains:

| Property | Description |
|----------|-------------|
| `TokenEndpoint` | The token endpoint URI |
| `RevocationEndpoint` | The revocation endpoint URI |
| `ClientId` | The configured client ID |
| `ClientSecret` | The configured client secret (if any) |
| `HttpClient` | The `HttpClient` configured for the OIDC handler |
| `Scheme` | The authentication scheme name |

### Example: Accessing OIDC Configuration

```csharp
public class CustomTokenService
{
    private readonly IOpenIdConnectConfigurationService _configService;

    public CustomTokenService(IOpenIdConnectConfigurationService configService)
    {
        _configService = configService;
    }

    public async Task<string> GetTokenEndpointAsync(CancellationToken ct)
    {
        var config = await _configService.GetOpenIdConnectConfigurationAsync(ct: ct);
        return config.TokenEndpoint.ToString();
    }
}
```

:::tip[Extensibility Summary]
| Interface | Purpose |
|-----------|---------|
| `ITokenRetriever` | Replace entire token acquisition logic |
| `ITokenRequestCustomizer` | Modify token request parameters per-request |
| `TransformPrincipalAfterRefreshAsync` | Transform claims after token refresh |
| `IUserAccessor` | Access current user outside HTTP context |
| `IUserTokenRequestConcurrencyControl` | Control concurrent token refresh |
| `IOpenIdConnectUserTokenEndpoint` | Low-level token endpoint operations |
| `IOpenIdConnectConfigurationService` | Access OIDC handler configuration |
:::
