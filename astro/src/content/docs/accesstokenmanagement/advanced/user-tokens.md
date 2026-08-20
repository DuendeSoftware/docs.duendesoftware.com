---
title: Customizing User Token Management
description: Learn how to customize user token management options, per-request parameters, and token storage mechanisms in ASP.NET Core applications.
sidebar:
  label: User Tokens
  order: 2
redirect_from:
  - /foss/accesstokenmanagement/advanced/user_tokens/
---

The most common way
to use [access token management is for interactive web applications](/accesstokenmanagement/web-apps.mdx) -
however, you may want to customize certain aspects of it. Here's what you can do.

## General Options

You can pass in some global options when registering token management in the ASP.NET Core service provider.

* `ChallengeScheme` - by default the OIDC configuration is inferred from the default challenge scheme. This is
  recommended approach. If for some reason your OIDC handler is not the default challenge scheme, you can set the scheme
  name on the options
* `UseChallengeSchemeScopedTokens` - the general assumption is that you only have one OIDC handler configured. If that
  is not the case, token management needs to maintain multiple sets of token artefacts simultaneously. You can opt in to
  that feature using this setting.
* `RefreshBeforeExpiration` - specifies how long before expiration the token should be refreshed (defaults to 1 minute)
* `ClientCredentialsScope` - when requesting client credentials tokens from the OIDC provider, the scope parameter will
  not be set since its value cannot be inferred from the OIDC configuration. With this setting you can set the value of
  the scope parameter.
* `ClientCredentialsResource` - same as previous, but for the resource parameter
* `ClientCredentialStyle` - specifies how client credentials are transmitted to the OIDC provider

```csharp
// Program.cs
builder.Services.AddOpenIdConnectAccessTokenManagement(options =>
{
    options.ChallengeScheme = Scheme.Parse("schemeName");
    options.UseChallengeSchemeScopedTokens = false;
    options.RefreshBeforeExpiration = TimeSpan.FromMinutes(2);
    
    options.ClientCredentialsScope = Scope.Parse("api1 api2");
    options.ClientCredentialsResource = Resource.Parse("urn:resource");
    options.ClientCredentialStyle = ClientCredentialStyle.PostBody;  
});
```

## Per Request Parameters

You can also modify token management parameters on a per-request basis.

The `UserTokenRequestParameters` class can be used for that:

* `SignInScheme` - allows specifying a sign-in scheme. This is used by the default token store
* `ChallengeScheme` - allows specifying a challenge scheme. This is used to infer token service configuration
* `ForceTokenRenewal` - forces token retrieval even if a cached token would be available
* `Scope` - overrides the globally configured scope parameter
* `Resource` - override the globally configured resource parameter
* `Assertion` - allows setting a client assertion for the request

The request parameters can be passed via the manual API:

```csharp
var token = await _tokenManagementService
    .GetAccessTokenAsync(User, new UserTokenRequestParameters {
        // ... 
    });
```

...the extension methods

```csharp
var token = await HttpContext.GetUserAccessTokenAsync(
    new UserTokenRequestParameters {
        // ... 
    });
```

...or the HTTP client factory

```csharp
// Program.cs
// registers HTTP client that uses the managed user access token
builder.Services.AddUserAccessTokenHttpClient("invoices",
    parameters: new UserTokenRequestParameters {
        // ... 
    },
    configureClient: client => 
       { 
         client.BaseAddress = new Uri("https://api.company.com/invoices/"); 
       });

// registers a typed HTTP client with token management support
builder.Services.AddHttpClient<InvoiceClient>(client =>
    {
        client.BaseAddress = new Uri("https://api.company.com/invoices/");
    })
    .AddUserAccessTokenHandler(new UserTokenRequestParameters {
        // ... 
    });
```

## Token Storage

By default, the user's access and refresh token will be stored in the ASP.NET Core authentication session (implemented by
the cookie handler).

You can modify this in two ways:

* the cookie handler itself has an extensible storage mechanism via the `TicketStore` mechanism
* replace the store altogether by providing an `IUserTokenStore` implementation and registering it in the service provider at application startup

### IUserTokenStore Interface

The `IUserTokenStore` interface is the primary abstraction for token storage. Implement this interface to store tokens in a database, distributed cache, or other backing store.

```csharp
public interface IUserTokenStore
{
    /// <summary>
    /// Stores a token for a user
    /// </summary>
    Task StoreTokenAsync(
        ClaimsPrincipal user,
        UserToken token,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default);

    /// <summary>
    /// Retrieves a token for a user. Returns a TokenForParameters which contains
    /// either the cached token or just the refresh token if no cached token exists.
    /// </summary>
    Task<TokenResult<TokenForParameters>> GetTokenAsync(
        ClaimsPrincipal user,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default);

    /// <summary>
    /// Clears/removes the stored token for a user
    /// </summary>
    Task ClearTokenAsync(
        ClaimsPrincipal user,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default);
}
```

#### Custom Token Store Example

The following example shows a custom token store that persists tokens to a database:

```csharp
public class DatabaseUserTokenStore : IUserTokenStore
{
    private readonly ITokenRepository _repository;
    
    public DatabaseUserTokenStore(ITokenRepository repository)
    {
        _repository = repository;
    }

    public async Task StoreTokenAsync(
        ClaimsPrincipal user,
        UserToken token,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default)
    {
        var userId = user.FindFirstValue("sub") 
            ?? throw new InvalidOperationException("No sub claim found");
        
        await _repository.SaveTokenAsync(userId, new StoredToken
        {
            AccessToken = token.AccessToken.ToString(),
            RefreshToken = token.RefreshToken?.ToString(),
            Expiration = token.Expiration,
            Scope = token.Scope?.ToString()
        }, ct);
    }

    public async Task<TokenResult<TokenForParameters>> GetTokenAsync(
        ClaimsPrincipal user,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default)
    {
        var userId = user.FindFirstValue("sub");
        if (userId == null)
        {
            return TokenResult.Failure<TokenForParameters>(
                new TokenResultFailure("No sub claim found"));
        }

        var stored = await _repository.GetTokenAsync(userId, ct);
        if (stored == null)
        {
            return TokenResult.Failure<TokenForParameters>(
                new TokenResultFailure("No token found"));
        }

        var userToken = new UserToken
        {
            AccessToken = AccessToken.Parse(stored.AccessToken),
            RefreshToken = stored.RefreshToken != null 
                ? RefreshToken.Parse(stored.RefreshToken) 
                : null,
            Expiration = stored.Expiration
        };

        var refreshToken = stored.RefreshToken != null
            ? new UserRefreshToken(RefreshToken.Parse(stored.RefreshToken), null)
            : null;

        return TokenResult.Success(new TokenForParameters(userToken, refreshToken));
    }

    public async Task ClearTokenAsync(
        ClaimsPrincipal user,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default)
    {
        var userId = user.FindFirstValue("sub");
        if (userId != null)
        {
            await _repository.DeleteTokenAsync(userId, ct);
        }
    }
}
```

Register your custom store in the service provider:

```csharp
// Program.cs
builder.Services.AddOpenIdConnectAccessTokenManagement();
builder.Services.AddSingleton<IUserTokenStore, DatabaseUserTokenStore>();
```

### IStoreTokensInAuthenticationProperties Interface

For more granular control over how tokens are stored within the ASP.NET Core `AuthenticationProperties`, implement `IStoreTokensInAuthenticationProperties`. This is a lower-level interface used by the default `IUserTokenStore` implementation.

```csharp
public interface IStoreTokensInAuthenticationProperties
{
    /// <summary>
    /// Gets a user token from the authentication properties
    /// </summary>
    TokenResult<TokenForParameters> GetUserToken(
        AuthenticationProperties authenticationProperties,
        UserTokenRequestParameters parameters = default);

    /// <summary>
    /// Sets a user token in the authentication properties
    /// </summary>
    Task SetUserTokenAsync(
        UserToken token,
        AuthenticationProperties authenticationProperties,
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default);

    /// <summary>
    /// Removes the user token from the authentication properties
    /// </summary>
    void RemoveUserToken(
        AuthenticationProperties authenticationProperties,
        UserTokenRequestParameters parameters = default);

    /// <summary>
    /// Gets the authentication scheme to use
    /// </summary>
    Task<Scheme> GetSchemeAsync(
        UserTokenRequestParameters parameters = default,
        CancellationToken ct = default);
}
```

This interface is useful when you need to customize how tokens are serialized or structured within the authentication ticket, while still using the cookie-based storage mechanism
