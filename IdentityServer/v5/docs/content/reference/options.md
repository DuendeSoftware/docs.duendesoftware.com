---
title: "IdentityServer Options"
date: 2020-09-10T08:22:12+02:00
weight: 11
---

#### Duende.IdentityServer.Configuration.IdentityServerOptions

The *IdentityServerOptions* is the central place to configure fundamental settings in Duende IdentityServer.

You set the options at startup time in your *ConfigureServices* method:

```cs
var builder = services.AddIdentityServer(options =>
{
    // configure options here..
})
```

## Main
Top-level settings.

* ***IssuerUri***

    Set the issuer name that will appear in the discovery document and the issued JWT tokens.
    It is recommended to not set this property, which infers the issuer name from the host name that is used by the clients.

* ***LowerCaseIssuerUri***

    Set to *false* to preserve the original casing of the IssuerUri. Defaults to *true*.

* ***AccessTokenJwtType***
  
    Specifies the value used for the JWT typ header for access tokens (defaults to *at+jwt*).

* ***EmitScopesAsSpaceDelimitedStringInJwt***
  
    Specifies whether scopes in JWTs are emitted as array or string

* ***EmitStaticAudienceClaim***
  
    Emits a static *aud* claim in all access tokens with the format *issuer/resources*. Defaults to *false*.

* ***EmitScopesAsSpaceDelimitedStringsInJwt***

    Historically scopes values were emitted as an array in JWT access tokens.
    The newer JWT for OAuth profile specifies a space delimited string instead.
    The behavior can be toggled here (defaults to *false* for backwards compatibility).

## Key management
Controls the automatic key management settings.

* ***Enabled***

    Specifies if key management should be enabled. Defaults to true.

* ***SigningAlgorithms***

    The signing algorithms allowed. 
    If none are specified, then "RS256" will be used as the default.
    The first in the collection will be used as the default. 

* ***RotationInterval***

    Age at which keys will no longer be used for signing, but will still be used in discovery for validation.
    Defaults to 90 days.

* ***PropagationTime***

    Time expected to propagate new keys to all servers, and time expected all clients to refresh discovery.
    Defaults to 14 days.

* ***RetentionDuration***

    Duration for keys to remain in discovery after rotation.
    Defaults to 14 days.

* ***DeleteRetiredKeys***

    Automatically delete retired keys.
    Defaults to true.
        
* ***KeyPath***

    Path for storing keys when using the default file system store.
    Defaults to the "keys" directory relative to the hosting application.

* ***DataProtectKeys***

    Automatically protect keys in the storage using data protection.
    Defaults to true.

* ***KeyCacheDuration***

    When in normal operation, duration to cache keys from store.
    Defaults to 24 hours.

* ***InitializationDuration***

    When no keys have been created yet, this is the window of time considered to be an initialization 
    period to allow all servers to synchronize if the keys are being created for the first time.
    Defaults to 5 minutes.

* ***InitializationSynchronizationDelay***

    Delay used when re-loading from the store when the initialization period. It allows
    other servers more time to write new keys so other servers can include them.
    Defaults to 5 seconds.

* ***InitializationKeyCacheDuration***

    Cache duration when within the initialization period.
    Defaults to 1 minute.

## Endpoints
Allows enabling/disabling individual endpoints, e.g. token, authorize, userinfo etc.

```cs
var builder = services.AddIdentityServer(options =>
{
    // see endpoint section in docs for a list of endoints

    options.Endpoints.EnableAuthorizeEndpoint = true;
    options.Endpoints.EnableIntrospectionEndpoint = false;
})
```

By default all endpoints are enabled, but you can lock down your server by disabling endpoint that you don't need.

* ***EnableJwtRequestUri***
  
    Enabling the request_uri parameter has some security implications (see spec).
    Thus support for this parameter is disabled by default.

## Discovery
Allows enabling/disabling various sections of the discovery document, e.g. endpoints, scopes, claims, grant types etc.

```cs
var builder = services.AddIdentityServer(options =>
{
    options.Discovery.ShowApiScopes = false;
    options.Discovery.ShowClaims = false;

    // etc
}
```

The *CustomEntries* dictionary allows adding custom elements to the discovery document.

```cs
var builder = services.AddIdentityServer(options =>
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

When you add a custom value that starts with ~/ it will be expanded to an absolute path below the IdentityServer base address, e.g.:

```cs
options.Discovery.CustomEntries.Add("my_custom_endpoint", "~/custom");
```

If you want to take full control over the rendering of the discovery (and jwks) document, you can implement the *IDiscoveryResponseGenerator* interface (or derive from our default implementation).

## Authentication

Login/logout releated settings.

* ***CookieAuthenticationScheme***
    
    Sets the cookie authentication scheme configured by the host used for interactive users. If not set, the scheme will be inferred from the host's default authentication scheme. This setting is typically used when AddPolicyScheme is used in the host as the default scheme.
    
* ***CookieLifetime***

    The authentication cookie lifetime (only effective if the IdentityServer-provided cookie handler is used).

* ***CookieSlidingExpiration***
    
    Specifies if the cookie should be sliding or not (only effective if the IdentityServer-provided cookie handler is used).

* ***CookieSameSiteMode***
    
    Specifies the SameSite mode for the internal cookies.

* ***RequireAuthenticatedUserForSignOutMessage***
    
    Indicates if user must be authenticated to accept parameters to end session endpoint. Defaults to false.

* ***CheckSessionCookieName***
    
    The name of the cookie used for the check session endpoint.

* ***CheckSessionCookieDomain***
    
    The domain of the cookie used for the check session endpoint.

* ***CheckSessionCookieSameSiteMode***
    
    The SameSite mode of the cookie used for the check session endpoint.

* ***RequireCspFrameSrcForSignout***
    
    If set, will require frame-src CSP headers being emitting on the end session callback endpoint which renders iframes to clients for front-channel signout notification. Defaults to true.

## Events
Allows configuring if and which events should be submitted to a registered event sink. See :ref:`here <refEvents>` TODO for more information on events.

```cs
var builder = services.AddIdentityServer(options =>
{
    options.Events.RaiseSuccessEvents = true;
    options.Events.RaiseFailureEvents = true;
    options.Events.RaiseErrorEvents = true;
    options.Events.RaiseInformationEvents = true;
})
```

## InputLengthRestrictions
Allows setting length restrictions on various protocol parameters like client id, scope, redirect URI etc.

```cs
var builder = services.AddIdentityServer(options =>
{
    // allow scope parameter up to 1000 characters
    options.InputLengthRestrictions.Scope = 1000;
})
```

## UserInteraction

Setting regarding the IdentityServer / user workflow.

* ***LoginUrl***, ***LogoutUrl***, ***ConsentUrl***, ***ErrorUrl***, ***DeviceVerificationUrl***

    Sets the URLs for the login, logout, consent, error and device verification pages.

* ***LoginReturnUrlParameter***

    Sets the name of the return URL parameter passed to the login page. Defaults to *returnUrl*.

* ***LogoutIdParameter***

    Sets the name of the logout message id parameter passed to the logout page. Defaults to *logoutId*.

* ***ConsentReturnUrlParameter***

    Sets the name of the return URL parameter passed to the consent page. Defaults to *returnUrl*.

* ***ErrorIdParameter***
    
    Sets the name of the error message id parameter passed to the error page. Defaults to *errorId*.

* ***CustomRedirectReturnUrlParameter***
    
    Sets the name of the return URL parameter passed to a custom redirect from the authorization endpoint. Defaults to *returnUrl*.

* ***DeviceVerificationUserCodeParameter***
    
    Sets the name of the user code parameter passed to the device verification page. Defaults to *userCode*.

* ***CookieMessageThreshold***
    
    Certain interactions between IdentityServer and some UI pages require a cookie to pass state and context (any of the pages above that have a configurable "message id" parameter).
    Since browsers have limits on the number of cookies and their size, this setting is used to prevent too many cookies being created. 
    The value sets the maximum number of message cookies of any type that will be created.
    The oldest message cookies will be purged once the limit has been reached.
    This effectively indicates how many tabs can be opened by a user when using IdentityServer.

## Caching
These settings only apply if the respective caching has been enabled in the services configuration in startup.

* ***ClientStoreExpiration***

    Cache duration of client configuration loaded from the client store.

* ***ResourceStoreExpiration***

    Cache duration of identity and API resource configuration loaded from the resource store.

## CORS
IdentityServer supports CORS for some of its endpoints.
The underlying CORS implementation is provided from ASP.NET Core, and as such it is automatically registered in the dependency injection system.

* ***CorsPolicyName***

    Name of the CORS policy that will be evaluated for CORS requests into IdentityServer (defaults to *IdentityServer*).
    The policy provider that handles this is implemented in terms of the *ICorsPolicyService* registered in the dependency injection system.
    If you wish to customize the set of CORS origins allowed to connect, then it is recommended that you provide a custom implementation of *ICorsPolicyService*.

* ***CorsPaths***
    
    The endpoints within IdentityServer where CORS is supported. 
    Defaults to the discovery, user info, token, and revocation endpoints.

* ***PreflightCacheDuration***

    Indicates the value to be used in the preflight *Access-Control-Max-Age* response header.
    Defaults to *null* indicating no caching header is set on the response.

## CSP (Content Security Policy)
IdentityServer emits CSP headers for some responses, where appropriate.

* ***Level***
    
    The level of CSP to use. CSP Level 2 is used by default, but if older browsers must be supported then this be changed to *CspLevel.One* to accommodate them.

* ***AddDeprecatedHeader***
    
    Indicates if the older *X-Content-Security-Policy* CSP header should also be emitted (in addition to the standards-based header value). Defaults to *true*.

## Device Flow
OAuth device flow related settings.

* ***DefaultUserCodeType***
    
    The user code type to use, unless set at the client level. Defaults to *Numeric*, a 9-digit code.

* ***Interval***

    Defines the minimum allowed polling interval on the token endpoint. Defaults to *5*.

## Mutual TLS
Mutual TLS enabled settings. See MTLS section for more information. TODO

```cs
var builder = services.AddIdentityServer(options =>
{
    options.MutualTls.Enabled = true;
    
    // use mtls sub-domain
    options.MutualTls.DomainName = "mtls";

    options.MutualTls.AlwaysEmitConfirmationClaim = true;
})
```

* ***Enabled***
    
    Specifies if MTLS support should be enabled. Defaults to *false*.

* ***ClientCertificateAuthenticationScheme***

    Specifies the name of the authentication handler for X.509 client certificates. Defaults to *Certificate*.

* ***DomainName***

    Specifies either the name of the sub-domain or full domain for running the MTLS endpoints (will use path-based endpoints if not set).
    Use a simple string (e.g. "mtls") to set a sub-domain, use a full domain name (e.g. "identityserver-mtls.io") to set a full domain name.
    When a full domain name is used, you also need to set the *IssuerName* to a fixed value.

* ***AlwaysEmitConfirmationClaim***

    Specifies whether a cnf claim gets emitted for access tokens if a client certificate was present.
    Normally the cnf claims only gets emitted if the client used the client certificate for authentication,
    setting this to true, will set the claim regardless of the authentication method. (defaults to false).
