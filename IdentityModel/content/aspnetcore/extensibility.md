Extensibility
=============

The main extensibility points are around token storage (users), token
caching (clients) and configuration.

Client access tokens
--------------------

Client access tokens are cached in memory by default. The default cache
implementation uses the *IDistributedCache* abstraction in ASP.NET Core.

You can either

-   replace the standard distributed cache with something else
-   replace the *IClientAccessTokenCache* implementation in DI
```
altogether
```

User access tokens
------------------

User access tokens are stored/cached using the ASP.NET Core
authentication session mechanism. For that you need to set the
*SaveTokens* flag on the OpenID Connect handler to *true*.

ASP.NET Core stores the authentication session in a cookie by default.
You can replace that storage mechanisms by setting the *SessionStore*
property on the cookie handler.

If you want to take over the token handling altogether, replace the
*IUserTokenStore* implementation in DI.

Configuration
-------------

By default, clients statically configured in startup. But there are
situations where you want to resolve configuration dynamically, e.g. for
endpoint URLs or creating client assertions on the fly.

The default configuration service reads all configuration from startup.
You can either replace the whole system, or derive from the default
implementation to augment the static configuration:

```
/// <summary>
/// Retrieves request details for client credentials, refresh and revocation requests
/// </summary>
public interface ITokenClientConfigurationService
{
    /// <summary>
    /// Returns the request details for a client credentials token request
    /// </summary>
    /// <param name="clientName"></param>
    /// <returns></returns>
    Task<ClientCredentialsTokenRequest> GetClientCredentialsRequestAsync(string clientName);

    /// <summary>
    /// Returns the request details for a refresh token request
    /// </summary>
    /// <returns></returns>
    Task<RefreshTokenRequest> GetRefreshTokenRequestAsync();

    /// <summary>
    /// Returns the request details for a token revocation request
    /// </summary>
    /// <returns></returns>
    Task<TokenRevocationRequest> GetTokenRevocationRequestAsync();
}
```

### Dynamically creating assertions

Instead of static client secrets, you can also use client assertions to
authenticate to the token service. The default configuration service has
a special method to override for that:

```
public class AssertionConfigurationService : DefaultTokenClientConfigurationService
{
    private readonly AssertionService _assertionService;

    public AssertionConfigurationService(
        IOptions<AccessTokenManagementOptions> accessTokenManagementOptions,
        IOptionsMonitor<OpenIdConnectOptions> oidcOptions,
        IAuthenticationSchemeProvider schemeProvider,
        AssertionService assertionService) : base(accessTokenManagementOptions,
        oidcOptions,
        schemeProvider)
    {
        _assertionService = assertionService;
    }

    protected override Task<ClientAssertion> CreateAssertionAsync(string clientName = null)
    {
        var assertion = new ClientAssertion
        {
            Type = OidcConstants.ClientAssertionTypes.JwtBearer,
            Value = _assertionService.CreateClientToken()
        };

        return Task.FromResult(assertion);
    }
}
```
