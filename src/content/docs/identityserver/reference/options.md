---
title: "IdentityServer Options"
sidebar:
  order: 10
redirect_from:
  - /identityserver/v5/reference/options/
  - /identityserver/v6/reference/options/
  - /identityserver/v7/reference/options/
---

#### Duende.IdentityServer.Configuration.IdentityServerOptions

The `IdentityServerOptions` is the central place to configure fundamental settings in Duende IdentityServer.

You set the options when registering IdentityServer at startup time, using a lambda expression in the AddIdentityServer method:

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{
    // configure options here..
})
```

## Main
Top-level settings. Available directly on the `IdentityServerOptions` object.

* **`IssuerUri`**

    The name of the token server, used in the discovery document as the `issuer` claim and in JWT tokens and introspection responses as the `iss` claim.

    It is not recommended to set this option. If it is not set (the default), the issuer is inferred from the URL used by clients. This better conforms to the OpenID Connect specification, which requires that issuer values be "identical to the Issuer URL that was directly used to retrieve the configuration information". It is also more convenient for clients to validate the issuer of tokens, because they will not need additional configuration or customization to know the expected issuer.

* **`LowerCaseIssuerUri`**

    Controls the casing of inferred `IssuerUri`s. When set to `false`, the original casing of the IssuerUri in requests is preserved. When set to `true`, the `IssuerUri` is converted to lowercase. Defaults to `true`.

* **`AccessTokenJwtType`**
  
    The value used for the `typ` header in JWT access tokens. Defaults to `at+jwt`, as specified by the [RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068). If `AccessTokenJwtType` is set to `null` or the empty string, the `typ` header will not be emitted in JWT access tokens.

* **`LogoutTokenJwtType`**

    The value for the `typ` header in back-channel logout tokens. Defaults to "logout+jwt", as specified by [OpenID Connect Back-Channel Logout 1.0](https://openid.net/specs/openid-connect-backchannel-1_0.html#logouttoken).


* **`EmitScopesAsSpaceDelimitedStringInJwt`**
  
    Controls the format of scope claims in JWTs and introspection responses. Historically scopes values were emitted as an array in JWT access tokens. [RFC 9068](https://datatracker.ietf.org/doc/html/rfc9068) now specifies a space delimited string instead. Defaults to `false` for backwards compatibility.

* **`EmitStaticAudienceClaim`**
    
    Emits a static `aud` (audience) claim in all access tokens with the format `{issuer}/resources`. For example, if IdentityServer was running at `https://identity.example.com`, the static `aud` claim's value would be `https://identity.example.com/resources`. Historically, older versions of IdentityServer produced tokens with a static audience claim in this format. This flag is intended for use when you need to produce backwards-compatible access tokens. Also note that multiple audience claims are possible. If you enable this flag and also configure `ApiResource`s you can have both the static audience and audiences from the API resources. Defaults to `false`.

* **`EmitIssuerIdentificationResponseParameter`**
     
    Emits the `iss` response parameter on authorize responses, as specified by [RFC 9207](https://datatracker.ietf.org/doc/rfc9207/). Defaults to `true`.

* **`EmitStateHash`** 
  
    Emits the s_hash claim in identity tokens. The s_hash claim is a hash of the state parameter that is specified in the OpenID Connect [Financial-grade API Security Profile](https://openid.net/specs/openid-financial-api-part-2-1_0.html). Defaults to `false`.

* **`StrictJarValidation`**

    Strictly validate JWT-secured authorization requests according to [RFC 9101](https://datatracker.ietf.org/doc/rfc9101/). When enabled, JWTs used to secure authorization requests must have the `typ` header value `oauth-authz-req+jwt` and JWT-secured authorization requests must have the HTTP `content-type` header value `application/oauth-authz-req+jwt`. This might break older OIDC conformant request objects. Defaults to `false`.  


* **`ValidateTenantOnAuthorization`**
    
    Specifies if a user's `tenant` claim is compared to the tenant `acr_values` parameter value to determine if the login page is displayed. Defaults to `false`.


## Key management
Automatic key management settings. Available on the `KeyManagement` property of the `IdentityServerOptions` object.

* **`Enabled`**

    Enables automatic key management. Defaults to true.

* **`SigningAlgorithms`**

    The signing algorithms for which automatic key management will manage keys. 

    This option is configured with a list of objects containing a Name property, which is the name of a supported signing algorithm, and a UseX509Certificate property, which is a flag indicating if the signing key should be wrapped in an X.509 certificate.
    
    The first algorithm in the collection will be used as the default for clients that do not specify `AllowedIdentityTokenSigningAlgorithms`.
    
    The supported signing algorithm names are `RS256`, `RS384`, `RS512`, `PS256`, `PS384`, `PS512`, `ES256`, `ES384`, and `ES512`.

    X.509 certificates are not supported for `ES256`, `ES384`, and `ES512` keys.

    Defaults to `RS256` without an X.509 certificate.

:::note 
*X.509 certificates* have an expiration date, but IdentityServer does
not use this data to validate the certificate and throw an exception. If a certificate has expired then you
must decide whether to continue using it or replace it with a new certificate.
:::

* **`RsaKeySize`**
    
    Key size (in bits) of RSA keys. The signing algorithms that use RSA keys (`RS256`, `RS384`, `RS512`, `PS256`, `PS384`, and `PS512`) will generate an RSA key of this length. Defaults to 2048.
  
* **`RotationInterval`**

    Age at which keys will no longer be used for signing, but will still be used in discovery for validation.
    Defaults to 90 days.

* **`PropagationTime`**

    Time expected to propagate new keys to all servers, and time expected all clients to refresh discovery.
    Defaults to 14 days.

* **`RetentionDuration`**

    Duration for keys to remain in discovery after rotation.
    Defaults to 14 days.

* **`DeleteRetiredKeys`**

    Automatically delete retired keys.
    Defaults to true.
        
* **`KeyPath`**

    Path for storing keys when using the default file system store.
    Defaults to the "keys" directory relative to the hosting application.

* **`DataProtectKeys`**

    Automatically protect keys in the storage using data protection.
    Defaults to true.

* **`KeyCacheDuration`**

    When in normal operation, duration to cache keys from store.
    Defaults to 24 hours.

* **`InitializationDuration`**

    When no keys have been created yet, this is the window of time considered to be an initialization 
    period to allow all servers to synchronize if the keys are being created for the first time.
    Defaults to 5 minutes.

* **`InitializationSynchronizationDelay`**

    Delay used when re-loading from the store when the initialization period. It allows
    other servers more time to write new keys so other servers can include them.
    Defaults to 5 seconds.

* **`InitializationKeyCacheDuration`**

    Cache duration when within the initialization period.
    Defaults to 1 minute.

## Endpoints
Endpoint settings, including flags to disable individual endpoints and support for the request_uri JAR parameter. Available on the `Endpoints` property of the `IdentityServerOptions` object.

* **`EnableAuthorizeEndpoint`**

    Enables the authorize endpoint. Defaults to true.

* **`EnableTokenEndpoint`**

    Enables the token endpoint. Defaults to true.

* **`EnableDiscoveryEndpoint`**

    Enables the discovery endpoint. Defaults to true.

* **`EnableUserInfoEndpoint`**

    Enables the user info endpoint. Defaults to true.

* **`EnableEndSessionEndpoint`**

    Enables the end session endpoint. Defaults to true.

* **`EnableCheckSessionEndpoint`**

    Enables the check session endpoint. Defaults to true.

* **`EnableTokenRevocationEndpoint`**

    Enables the token revocation endpoint. Defaults to true.

* **`EnableIntrospectionEndpoint`**

    Enables the introspection endpoint. Defaults to true.

* **`EnableDeviceAuthorizationEndpoint`**

    Enables the device authorization endpoint. Defaults to true.

* **`EnableBackchannelAuthenticationEndpoint`**

    Enables the backchannel authentication endpoint. Defaults to true.

* **`EnablePushedAuthorizationEndpoint`**

    Enables the pushed authorization endpoint. Defaults to true.

* **`EnableJwtRequestUri`**
  Enables the `request_uri` parameter for JWT-Secured Authorization Requests. This allows the JWT to be passed by reference. Disabled by default, due to the security implications of enabling the request_uri parameter (see [RFC 9101 section 10.4](https://datatracker.ietf.org/doc/rfc9101/)).

## Discovery
Discovery settings, including flags to toggle sections of the discovery document and settings to add custom entries to it. Available on the `Discovery` property of the `IdentityServerOptions` object. 

If you want to take full control over the rendering of the discovery and jwks documents, you can implement the `IDiscoveryResponseGenerator` interface (or derive from our default implementation).

* **`ShowEndpoints`**

    Shows endpoints (authorization_endpoint, token_endpoint, etc.) in the discovery document. Defaults to true.
* **`ShowKeySet`**

    Shows the jwks_uri in the discovery document and enables the jwks endpoint. Defaults to true.
* **`ShowIdentityScopes`**

    Includes IdentityResources in the supported_scopes of the discovery document. Defaults to true.
* **`ShowApiScopes`**

    Includes ApiScopes in the supported_scopes of the discovery document. Defaults to true.
* **`ShowClaims`**

    Shows claims_supported in the discovery document. Defaults to true.
* **`ShowResponseTypes`**

    Shows response_types_supported in the discovery document. Defaults to true.
* **`ShowResponseModes`**

    Shows response_modes_supported in the discovery document. Defaults to true.
* **`ShowGrantTypes`**

    Shows grant_types_supported in the discovery document. Defaults to true.
* **`ShowExtensionGrantTypes`**

    Includes extension grant types in the grant_types_supported of the discovery document. Defaults to true.
* **`ShowTokenEndpointAuthenticationMethods`**

    Shows token_endpoint_auth_methods_supported in the discovery document. Defaults to true.
* **`CustomEntries`**
Adds custom elements to the discovery document. For example:

```cs
var idsvrBuilder = builder.Services.AddIdentityServer(options =>
{
    options.Discovery.CustomEntries.Add("my_setting", "foo");
    options.Discovery.CustomEntries.Add("my_complex_setting",
        new
        {
            foo = "foo",
            bar = "bar"
        });
});
```

* **`ExpandRelativePathsInCustomEntries`**
Expands paths in custom entries that begin with "~/" into absolute paths below the IdentityServer base address. Defaults to true. In the following example, if IdentityServer's base address is `https://localhost:5001`, then `my_custom_endpoint`'s value will be expanded to `https://localhost:5001/custom`.

```cs
options.Discovery.CustomEntries.Add("my_custom_endpoint", "~/custom");
```

## Authentication

Login/logout related settings. Available on the `Authentication` property of the `IdentityServerOptions`

* **`CookieAuthenticationScheme`**
    
    Sets the cookie authentication scheme configured by the host used for interactive users. If not set, the scheme will be inferred from the host's default authentication scheme. This setting is typically used when AddPolicyScheme is used in the host as the default scheme.
    
* **`CookieLifetime`**

    The authentication cookie lifetime (only effective if the IdentityServer-provided cookie handler is used). Defaults to 10 hours.

* **`CookieSlidingExpiration`**
    
    Specifies if the cookie should be sliding or not (only effective if the IdentityServer-provided cookie handler is used). Defaults to false.

* **`CookieSameSiteMode`**
    
    Specifies the SameSite mode for the internal cookies. Defaults to None.

* **`RequireAuthenticatedUserForSignOutMessage`**
    
    Indicates if user must be authenticated to accept parameters to end session endpoint. Defaults to false.

* **`CheckSessionCookieName`**
    
    The name of the cookie used for the check session endpoint. Defaults to the constant `IdentityServerConstants.DefaultCheckSessionCookieName`, which has the value "idsrv.session".

* **`CheckSessionCookieDomain`**
    
    The domain of the cookie used for the check session endpoint. Defaults to `null`.

* **`CheckSessionCookieSameSiteMode`**
    
    The SameSite mode of the cookie used for the check session endpoint. Defaults to None.

* **`RequireCspFrameSrcForSignout`**

    Enables all content security policy headers on the end session endpoint. For historical reasons, this option's name mentions `frame-src`, but the content security policy headers on the end session endpoint also include other fetch directives, including a *default-src 'none'* directive, which prevents most resources from being loaded by the end session endpoint, and a `style-src` directive that specifies the hash of the expected style on the page.

* **`CoordinateClientLifetimesWithUserSession`** (added in `v6.1`)
    
    When enabled, all clients' token lifetimes (e.g. refresh tokens) will be tied to the user's session lifetime.
    This means when the user logs out, any revokable tokens will be removed.
    If using server-side sessions, expired sessions will also remove any revokable tokens, and backchannel logout will be triggered.
    An individual client can override this setting with its own `CoordinateLifetimeWithUserSession` configuration setting.

## Events
Configures which [events](/identityserver/diagnostics/events) should be raised at the  registered event sink.

* **`RaiseSuccessEvents`**

    Enables success events. Defaults to false. Success events include all the events whose names are postfixed with "SuccessEvent". In general, they are raised when properly formed and valid requests are processed without errors.

* **`RaiseFailureEvents`**

    Enables failure events. Defaults to false. Failure events include all the events whose names are postfixed with "FailureEvent". In general, they are raised when an action has failed because of incorrect or badly formed parameters in a request. They indicate that the user or client calling IdentityServer has done something wrong and are analogous to a 400: bad request error.

* **`RaiseErrorEvents`**

    Enables Error events. Defaults to false. Error events are raised when an error has occurred, either because of invalid configuration or an unhandled exception. They indicate that there is something wrong within the token server or its configuration and are analogous to a 500: internal server error.

* **`RaiseInformationEvents`**

    Enables Information events. Defaults to false. Information events are emitted when an action has occurred that is of informational interest, but that is neither a success nor a failure. For example, when the end user grants, denies, or revokes consent, that is considered an information event, because these events capture a valid choice of the user rather than success or failure.



## Logging
Logging related settings, including filters that will remove sensitive values and unwanted exceptions from logs. Available on the `Logging` property of the `IdentityServerOptions` object.

* **`AuthorizeRequestSensitiveValuesFilter`**
    
    Collection of parameter names passed to the authorize endpoint that are considered sensitive and will be excluded from logging. Defaults to `id_token_hint`.

* **`TokenRequestSensitiveValuesFilter`**
    
    Collection of parameter names passed to the token endpoint that are considered sensitive and will be excluded from logging. In `v7.0` and earlier, defaults to `client_secret`, `password`, `client_assertion`, `refresh_token`, and `device_code`. In `v7.1`, `subject_token` is also excluded.

* **`BackchannelAuthenticationRequestSensitiveValuesFilter`**
  
    Collection of parameter names passed to the backchannel authentication endpoint that are considered sensitive and will be excluded from logging. Defaults to `client_secret`, `client_assertion`, and `id_token_hint`.

* **`UnhandledExceptionLoggingFilter`** (added in `v6.2`)
  
  A function that is called when the IdentityServer middleware detects an unhandled exception, and is used to determine if the exception is logged.
  The arguments to the function are the HttpContext and the Exception. It should return true to log the exception, and false to suppress.
  The default is to suppress logging of cancellation-related exceptions when the `CancellationToken` on the `HttpContext` has requested cancellation. Such exceptions are thrown when Http requests are canceled, which is an expected occurrence. Logging them creates unnecessary noise in the logs. In `v7.0` and earlier, only `TaskCanceledException`s were filtered. Beginning in `v7.1`, `OperationCanceledException`s are filtered as well.

## InputLengthRestrictions

Settings that control the allowed length of various protocol parameters, such as client id, scope, redirect URI etc. Available on the `InputLengthRestrictions` property of the `IdentityServerOptions` object.

* **`ClientId`**

    Max length for ClientId. Defaults to 100.

* **`ClientSecret`**
    
    Max length for external client secrets. Defaults to 100.

* **`Scope`**
    
    Max length for scope. Defaults to 300.

* **`RedirectUri`**
    
    Max length for redirect_uri. Defaults to 400.

* **`Nonce`**
    
    Max length for nonce. Defaults to 300.

* **`UiLocale`**
    
    Max length for ui_locale. Defaults to 100.

* **`LoginHint`**
    
    Max length for login_hint. Defaults to 100.

* **`AcrValues`**
    
    Max length for acr_values. Defaults to 300.

* **`GrantType`**
    
    Max length for grant_type. Defaults to 100.

* **`UserName`**
    
    Max length for username. Defaults to 100.

* **`Password`**
    
    Max length for password. Defaults to 100.

* **`CspReport`**
    
    Max length for CSP reports. Defaults to 2000.

* **`IdentityProvider`**
    
    Max length for external identity provider name. Defaults to 100.

* **`ExternalError`**
    
    Max length for external identity provider errors. Defaults to 100.

* **`AuthorizationCode`**
    
    Max length for authorization codes. Defaults to 100.

* **`DeviceCode`**
    
    Max length for device codes. Defaults to 100.

* **`RefreshToken`**
    
    Max length for refresh tokens. Defaults to 100.

* **`TokenHandle`**
    
    Max length for token handles. Defaults to 100.

* **`Jwt`**
    
    Max length for JWTs. Defaults to 51200.

* **`CodeChallengeMinLength`**
    
    Min length for the code challenge. Defaults to 43.

* **`CodeChallengeMaxLength`**
    
    Max length for the code challenge. Defaults to 128.

* **`CodeVerifierMinLength`**
    
    Min length for the code verifier. Defaults to 43.

* **`CodeVerifierMaxLength`**
        
    Max length for the code verifier. Defaults to 128.

* **`ResourceIndicatorMaxLength`**
    
    Max length for resource indicator parameter. Defaults to 512.

* **`BindingMessage`**
        
    Max length for binding_message. Defaults to 100.

* **`UserCode`**
    
    Max length for user_code. Defaults to 100.

* **`IdTokenHint`**
    
    Max length for id_token_hint. Defaults to 4000.

* **`LoginHintToken`**
    
    Max length for login_hint_token. Defaults to 4000.

* **`AuthenticationRequestId`**
    Max length for auth_req_id. Defaults to 100.

## UserInteraction

User interaction settings, including urls for pages in the UI, names of parameters to those pages, and other settings related to interactive flows. Available on the `UserInteraction` property of the `IdentityServerOptions` object.

* **`LoginUrl`**, **`LogoutUrl`**, **`ConsentUrl`**, **`ErrorUrl`**, **`DeviceVerificationUrl`**

    Sets the URLs for the login, logout, consent, error and device verification pages.

* **`CreateAccountUrl`** (added in `v6.3`)

    Sets the URL for the create account page, which is used by OIDC requests that include the `prompt=create` parameter. When this option is set, including the `prompt=create` parameter will cause the user to be redirected to the specified url. `create` will also be added to the discovery document's `prompt_values_supported` array to announce support for this feature. When this option is not set, the `prompt=create` parameter is ignored, and `create` is not added to discovery. Defaults to `null`.

* **`LoginReturnUrlParameter`**

    Sets the name of the return URL parameter passed to the login page. Defaults to `returnUrl`.

* **`LogoutIdParameter`**

    Sets the name of the logout message id parameter passed to the logout page. Defaults to `logoutId`.

* **`ConsentReturnUrlParameter`**

    Sets the name of the return URL parameter passed to the consent page. Defaults to `returnUrl`.

* **`ErrorIdParameter`**
    
    Sets the name of the error message id parameter passed to the error page. Defaults to `errorId`.

* **`CustomRedirectReturnUrlParameter`**
    
    Sets the name of the return URL parameter passed to a custom redirect from the authorization endpoint. Defaults to `returnUrl`.

* **`DeviceVerificationUserCodeParameter`**
    
    Sets the name of the user code parameter passed to the device verification page. Defaults to `userCode`.

* **`CookieMessageThreshold`**
    
    Certain interactions between IdentityServer and some UI pages require a cookie to pass state and context (any of the pages above that have a configurable "message id" parameter).
    Since browsers have limits on the number of cookies and their size, this setting is used to prevent too many cookies being created. 
    The value sets the maximum number of message cookies of any type that will be created.
    The oldest message cookies will be purged once the limit has been reached.
    This effectively indicates how many tabs can be opened by a user when using IdentityServer. Defaults to 2.

* **`AllowOriginInReturnUrl`**

    Flag that allows return URL validation to accept full URL that includes the IdentityServer origin. Defaults to `false`.

* **`PromptValuesSupported`** (added in `v7.0.7`)

    The collection of OIDC prompt modes supported and that will be published in discovery. By
    default, this includes all values in `Constants.SupportedPromptModes`. If the
    `CreateAccountUrl` option is set, then the "create" value is also included. If additional
    prompt values are added, a customized [`IAuthorizeInteractionResponseGenerator"`](/identityserver/ui/custom) is also required to handle those values.

## Caching
Caching settings for the stores. Available on the `Caching` property of the `IdentityServerOptions` object. These settings only apply if the respective caching has been enabled in the services configuration in startup.

* **`ClientStoreExpiration`**

    Cache duration of client configuration loaded from the client store. Defaults to 15 minutes.

* **`ResourceStoreExpiration`**

    Cache duration of identity and API resource configuration loaded from the resource store. Defaults to 15 minutes.

* **`CorsExpiration`**

    Cache duration of CORS configuration loaded from the CORS policy service. Defaults to 15 minutes.

* **`IdentityProviderCacheDuration`**

    Cache duration of identity provider configuration loaded from the identity provider store. Defaults to 60 minutes.

* **`CacheLockTimeout`**

    The timeout for concurrency locking in the default cache. Defaults to 60 seconds.


## CORS
CORS settings for IdentityServer's endpoints. Available on the `Cors` property of the `IdentityServerOptions` object. The underlying CORS implementation is provided from ASP.NET Core, and as such it is automatically registered in the dependency injection system. 

* **`CorsPolicyName`**

    Name of the CORS policy that will be evaluated for CORS requests into IdentityServer. Defaults to `IdentityServer`.
    The policy provider that handles this is implemented in terms of the `ICorsPolicyService` registered in the dependency injection system.
    If you wish to customize the set of CORS origins allowed to connect, then it is recommended that you provide a custom implementation of `ICorsPolicyService`.

* **`CorsPaths`**
    
    The endpoints within IdentityServer where CORS is supported. 
    Defaults to the discovery, user info, token, and revocation endpoints.

* **`PreflightCacheDuration`**

    Indicates the value to be used in the preflight `Access-Control-Max-Age` response header.
    Defaults to `null` indicating no caching header is set on the response.

## Content Security Policy
Settings for Content Security Policy (CSP) headers that IdentityServer emits. Available on the `Csp` property of the `IdentityServerOptions` object.

* **`Level`**
    
    The level of CSP to use. CSP Level 2 is used by default, but this can be changed to `CspLevel.One` to accommodate older browsers.

* **`AddDeprecatedHeader`**
    
    Indicates if the older `X-Content-Security-Policy` CSP header should also be emitted in addition to the standards-based header value. Defaults to `true`.

## Device Flow
OAuth device flow settings. Available on the `DeviceFlow` property of the `IdentityServerOptions` object.

* **`DefaultUserCodeType`**
    
    The user code type to use, unless set at the client level. Defaults to `Numeric`, a 9-digit code.

* **`Interval`**

    The maximum frequency in seconds that a client may poll the token endpoint in the device flow. Defaults to `5`.

## Mutual TLS
[Mutual TLS](/identityserver/tokens/client-authentication/) settings. Available on the `MutualTls` property of the `IdentityServerOptions` object.

```cs
var builder = services.AddIdentityServer(options =>
{
    options.MutualTls.Enabled = true;
    
    // use mtls subdomain
    options.MutualTls.DomainName = "mtls";

    options.MutualTls.AlwaysEmitConfirmationClaim = true;
})
```

* **`Enabled`**
    
    Specifies if MTLS support should be enabled. Defaults to `false`.

* **`ClientCertificateAuthenticationScheme`**

    Specifies the name of the authentication handler for X.509 client certificates. Defaults to `Certificate`.

* **`DomainName`**

    Specifies either the name of the subdomain or full domain for running the MTLS endpoints. MTLS will use path-based endpoints if not set (the default).
    Use a simple string (e.g. "mtls") to set a subdomain, use a full domain name (e.g. "identityserver-mtls.io") to set a full domain name.
    When a full domain name is used, you also need to set the `IssuerName` to a fixed value.

* **`AlwaysEmitConfirmationClaim`**

    Specifies whether a cnf claim gets emitted for access tokens if a client certificate was present.
    Normally the cnf claims only gets emitted if the client used the client certificate for authentication,
    setting this to true, will set the claim regardless of the authentication method. Defaults to false.

## PersistentGrants
Shared settings for persisted grants behavior.

* **`DataProtectData`**
    
    Data protect the persisted grants "data" column. Defaults to `true`.
    If your database is already protecting data at rest, then you can consider disabling this.

* **`DeleteOneTimeOnlyRefreshTokensOnUse`** (added in `v6.3`)

    When Refresh tokens that are configured with RefreshTokenUsage.OneTime are used, this option controls if they will be deleted immediately or retained and marked as consumed. The default is on - immediately delete.

## Dynamic Providers
Settings for [dynamic providers](/identityserver/ui/login/dynamicproviders). Available on the `DynamicProviders` property of the `IdentityServerOptions` object.

* **`PathPrefix`**
    
    Prefix in the pipeline for callbacks from external providers. Defaults to "/federation".

* **`SignInScheme`**
    
    Scheme used for signin. Defaults to the constant `IdentityServerConstants.ExternalCookieAuthenticationScheme`, which has the value "idsrv.external".

* **`SignOutScheme`**
    
    Scheme for signout. Defaults to the constant `IdentityServerConstants.DefaultCookieAuthenticationScheme`, which has the value "idsrv".

## CIBA
[CIBA](/identityserver/ui/ciba) settings.  Available on the `Ciba` property of the `IdentityServerOptions` object.

* **`DefaultLifetime`**
    
    The default lifetime of the pending authentication requests in seconds. Defaults to 300.

* **`DefaultPollingInterval`**
    
    The maximum frequency in seconds that a client may poll the token endpoint in the CIBA flow. Defaults to 5.

## Server-side Sessions 
Settings for [server-side sessions](/identityserver/ui/server-side-sessions/). Added in `v6.1`.  Available on the `ServerSideSessions` property of the `IdentityServerOptions` object.

* **`UserDisplayNameClaimType`**
    
    Claim type used for the user's display name. Unset by default due to possible PII concerns. If used, this would commonly be `JwtClaimTypes.Name`, `JwtClaimType.Email` or a custom claim.

* **`RemoveExpiredSessions`**
    
   Enables periodic cleanup of expired sessions. Defaults to true.

* **`RemoveExpiredSessionsFrequency`**
    
    Frequency that expired sessions will be removed. Defaults to 10 minutes.

* **`RemoveExpiredSessionsBatchSize`**
    
    Number of expired session records to be removed at a time. Defaults to 100.

* **`ExpiredSessionsTriggerBackchannelLogout`**
    
    If enabled, when server-side sessions are removed due to expiration, back-channel logout notifications will be sent.
    This will, in effect, tie a user's session lifetime at a client to their session lifetime at IdentityServer. Defaults to true.

* **`FuzzExpiredSessionRemovalStart`**

    The background session cleanup job runs at a configured interval. If multiple nodes run the cleanup
    job at the same time update conflicts might occur in the store. To reduce the propability of that happening, the startup time can be fuzzed. The first run is scheduled at a random time between the host startup and the configured RemoveExpiredSessionsFrequency. Subsequent runs are run on the configured RemoveExpiredSessionsFrequency.
    Defaults to `true`.

## Validation

* **`InvalidRedirectUriPrefixes`**

    Collection of URI scheme prefixes that should never be used as custom URI
    schemes in the `redirect_uri` passed to tha authorize endpoint or the
    `post_logout_redirect_uri` passed to the end_session endpoint. Defaults to
    *["javascript:", "file:", "data:", "mailto:", "ftp:", "blob:", "about:",
    "ssh:", "tel:", "view-source:", "ws:", "wss:"]*.

## DPoP
Added in 6.3.0.

Demonstration of Proof-of-Possession settings. Available on the `DPoP` property of the `IdentityServerOptions` object.

* **`ProofTokenValidityDuration`**
    
    Duration that DPoP proof tokens are considered valid. Defaults to *1 minute*.

* **`ServerClockSkew`**
    
    Clock skew used in validating DPoP proof token expiration using a server-generated nonce value. Defaults to `0`.

## Pushed Authorization Requests

[Pushed Authorization Requests (PAR)](/identityserver/tokens/par) settings. Added in `v7.0`. Available on the `PushedAuthorization` property of the `IdentityServerOptions` object.

* **`Required`** 
 
    Causes PAR to be required globally. Defaults to `false`. 

* **`Lifetime`**

    Controls the lifetime of pushed authorization requests. The pushed authorization request's lifetime begins when the request to the PAR endpoint is received, and is validated until the authorize endpoint returns a response to the client application. Note that user interaction, such as entering credentials or granting consent, may need to occur before the authorize endpoint can do so. Setting the lifetime too low will likely cause login failures for interactive users, if pushed authorization requests expire before those users complete authentication. Some security profiles, such as the FAPI 2.0 Security Profile recommend an expiration within 10 minutes to prevent attackers from pre-generating requests. To balance these constraints, this lifetime defaults to 10 minutes. 

## Preview Features
Preview Features settings. Available on the `Preview` property of the `IdentityServerOptions` object.

:::note
Duende IdentityServer may ship preview features, which can be configured using preview options.
Note that preview features can be removed and may break in future releases.
:::

#### Discovery Document Cache

In large deployments of Duende IdentityServer, where a lot of concurrent users attempt to
consume the [discovery endpoint](/identityserver/reference/endpoints/discovery) to retrieve
metadata about your IdentityServer, you can increase throughput by enabling the
discovery document cache preview using the *`EnableDiscoveryDocumentCache`* flag.
This will cache discovery document information for the duration specified in the
*`DiscoveryDocumentCacheDuration`* option.

It's best to keep the cache time low if you use the *`CustomEntries`* element on the
discovery document or implement a custom *`IDiscoveryResponseGenerator`*.

#### Strict Audience Validation

When using [*private key JWT*](/identityserver/tokens/client-authentication/#private-key-jwts),
there is a theoretical vulnerability where a Relying Party trusting multiple OpenID Providers
could be attacked if one of the OpenID Providers is malicious or compromised.

The OpenID Foundation proposed a two-part fix: strictly validate the audience and set an
explicit `typ` header in the authentication JWT.

You can [enable strict audience validation in Duende IdentityServer](/identityserver/tokens/client-authentication/#strict-audience-validation)
using the *`StrictClientAssertionAudienceValidation`* flag, which strictly validates that
the audience is equal to the issuer and validates the token's `typ` header.
