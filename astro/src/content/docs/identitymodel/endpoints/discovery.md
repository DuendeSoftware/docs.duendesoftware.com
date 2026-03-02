---
title: Discovery Endpoint
description: Documentation for using the OpenID Connect discovery endpoint client library, including configuration, validation, and caching features
sidebar:
  order: 2
  label: Discovery
  badge:
    text: v7.1
    variant: tip
redirect_from:
  - /foss/identitymodel/endpoints/discovery/
---

The client library for the [OpenID Connect discovery
endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html) is
provided as an extension method for `HttpClient`. The
`GetDiscoveryDocumentAsync` method returns a `DiscoveryDocumentResponse` object
that has both strong and weak typed accessors for the various elements
of the discovery document.

You should always check the `IsError` and `Error` properties before
accessing the contents of the document:

```csharp
var client = new HttpClient();

var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
if (disco.IsError) throw new Exception(disco.Error);
```

[Standard elements](#discoverydocumentresponse-properties-reference) can be accessed by using properties:

```csharp
var tokenEndpoint = disco.TokenEndpoint;
var keys = disco.KeySet.Keys;
```

Custom elements (or elements not covered by the standard properties) can
be accessed like this:

```csharp
// returns string or null
var stringValue = disco.TryGetString("some_string_element");

// return a nullable boolean
var boolValue = disco.TryGetBoolean("some_boolean_element");

// return array (maybe empty)
var arrayValue = disco.TryGetStringArray("some_array_element");

// returns JToken
var rawJson = disco.TryGetValue("some_element");
```

### Discovery Policy

By default, the discovery response is validated before it is returned to the client, validation includes:

-   enforce that HTTPS is used (except for localhost addresses)
-   enforce that the issuer matches the authority
-   enforce that the protocol endpoints are on the same DNS name as the `authority`
-   enforce the existence of a keyset

Policy violation errors will set the `ErrorType` property on the
`DiscoveryDocumentResponse` to `PolicyViolation`.

All the standard validation rules can be modified using the
`DiscoveryPolicy` class, e.g. disabling the issuer name check:

```csharp
var disco = await client.GetDiscoveryDocumentAsync(new DiscoveryDocumentRequest
{
    Address = "https://demo.duendesoftware.com",
    Policy = 
    {
        ValidateIssuerName = false
    }
});
```

When the URIs in the discovery document are on a different base address than the issuer URI, you may encounter the error *Endpoint is on a different host than authority*.
For such scenario, additional endpoint base addresses can be configured:

```csharp
var disco = await client.GetDiscoveryDocumentAsync(new DiscoveryDocumentRequest
{
    Address = "https://demo.duendesoftware.com",
    Policy = 
    {
        AdditionalEndpointBaseAddresses = [ "https://auth.domain.tld" ]
    }
});
```

You can also customize validation strategy based on the authority with
your own implementation of `IAuthorityValidationStrategy`. By default,
comparison uses ordinal string comparison. To switch to `Uri` comparison:

```csharp
var disco = await client.GetDiscoveryDocumentAsync(new DiscoveryDocumentRequest
{
    Address = "https://demo.duendesoftware.com",
    Policy = 
    {
        AuthorityValidationStrategy = new AuthorityUrlValidationStrategy()
    }
});
```

### Caching The Discovery Document

You should periodically update your local copy of the discovery
document, to be able to react to configuration changes on the server.
This is especially important for playing nice with automatic key
rotation.

The `DiscoveryCache` class can help you with that.

The following code will set up the cache, retrieve the document the
first time it is needed, and then cache it for 24 hours:

```csharp
var cache = new DiscoveryCache("https://demo.duendesoftware.com");
```

You can then access the document like this:

```csharp
var disco = await cache.GetAsync();
if (disco.IsError) throw new Exception(disco.Error);
```

You can specify the cache duration using the `CacheDuration` property and also specify a custom discovery policy by
passing in a `DiscoveryPolicy` to the constructor.

### Caching And HttpClient Instances

By default, the discovery cache will create a new instance of `HttpClient` every time it needs to access the discovery
endpoint. You can modify this behavior in two ways, either by passing in a pre-created instance into the constructor,
or by providing a function that will return an `HttpClient` when needed.

The following code will set up the discovery cache in the ASP.NET Core service provider and will use the
`HttpClientFactory` to create clients:

```csharp
services.AddSingleton<IDiscoveryCache>(r =>
{
    var factory = r.GetRequiredService<IHttpClientFactory>();
    return new DiscoveryCache(Constants.Authority, () => factory.CreateClient());
});
```

### DiscoveryDocumentResponse Properties Reference

The following table lists the standard properties on the `DiscoveryDocumentResponse` class:

| Property                                              | Description                                                                                                                                     |
|-------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| Policy                                                | Gets or sets the discovery policy used to configure how the discovery document is processed                                                     |
| KeySet                                                | Gets or sets the JSON Web Key Set (JWKS) associated with the discovery document                                                                 |
| MtlsEndpointAliases                                   | Gets the mutual TLS (mTLS) endpoint aliases                                                                                                     |
| Issuer                                                | Gets the issuer identifier for the authorization server                                                                                         |
| AuthorizeEndpoint                                     | Gets the authorization endpoint URL                                                                                                             |
| TokenEndpoint                                         | Gets token endpoint URL                                                                                                                         |
| UserInfoEndpoint                                      | Gets user info endpoint URL                                                                                                                     |
| IntrospectionEndpoint                                 | Gets the introspection endpoint URL                                                                                                             |
| RevocationEndpoint                                    | Gets the revocation endpoint URL                                                                                                                |
| DeviceAuthorizationEndpoint                           | Gets the device authorization endpoint URL                                                                                                      |
| BackchannelAuthenticationEndpoint                     | Gets the backchannel authentication endpoint URL                                                                                                |
| JwksUri                                               | Gets the URI of the JSON Web Key Set (JWKS)                                                                                                     |
| EndSessionEndpoint                                    | Gets the end session endpoint URL                                                                                                               |
| CheckSessionIframe                                    | Gets the check session iframe URL                                                                                                               |
| RegistrationEndpoint                                  | Gets the dynamic client registration (DCR) endpoint URL                                                                                         |
| PushedAuthorizationRequestEndpoint                    | Gets the pushed authorization request (PAR) endpoint URL                                                                                        |
| FrontChannelLogoutSupported                           | Gets a flag indicating whether front-channel logout is supported                                                                                |
| FrontChannelLogoutSessionSupported                    | Gets a flag indicating whether a session ID (sid) parameter is supported at the front-channel logout endpoint                                   |
| GrantTypesSupported                                   | Gets the supported grant types                                                                                                                  |
| CodeChallengeMethodsSupported                         | Gets the supported code challenge methods                                                                                                       |
| ScopesSupported                                       | Gets the supported scopes                                                                                                                       |
| SubjectTypesSupported                                 | Gets the supported subject types                                                                                                                |
| ResponseModesSupported                                | Gets the supported response modes                                                                                                               |
| ResponseTypesSupported                                | Gets the supported response types                                                                                                               |
| ClaimsSupported                                       | Gets the supported claims                                                                                                                       |
| TokenEndpointAuthenticationMethodsSupported           | Gets the authentication methods supported by the token endpoint                                                                                 |
| TokenEndpointAuthenticationSigningAlgorithmsSupported | Gets the signing algorithms supported by the token endpoint for client authentication                                                           |
| BackchannelTokenDeliveryModesSupported                | Gets the supported backchannel token delivery modes                                                                                             |
| BackchannelUserCodeParameterSupported                 | Gets a flag indicating whether the backchannel user code parameter is supported                                                                 |
| RequirePushedAuthorizationRequests                    | Gets a flag indicating whether the use of pushed authorization requests (PAR) is required                                                       |
| IntrospectionSigningAlgorithmsSupported               | Gets the signing algorithms supported for introspection responses                                                                               |
| IntrospectionEncryptionAlgorithmsSupported            | Gets the encryption "alg" values supported for encrypted JWT introspection responses                                                            |
| IntrospectionEncryptionEncValuesSupported             | Gets the encryption "enc" values supported for encrypted JWT introspection responses                                                            |
| Scopes                                                | The list of scopes associated to the token or an empty array if no `scope` claim is present                                                     |
| ClientId                                              | The client identifier for the OAuth 2.0 client that requested the token or `null` if the `client_id` claim is missing                           |
| UserName                                              | The human-readable identifier for the resource owner who authorized the token or `null` if the `username` claim is missing                      |
| TokenType                                             | The type of the token as defined in section 5.1 of OAuth 2.0 (RFC6749) or `null` if the `token_type` claim is missing                           |
| Expiration                                            | The expiration time of the token or `null` if the `exp` claim is missing                                                                        |
| IssuedAt                                              | The issuance time of the token or `null` if the `iat` claim is missing                                                                          |
| NotBefore                                             | The validity start time of the token or `null` if the `nbf` claim is missing                                                                    |
| Subject                                               | The subject of the token or `null` if the `sub` claim is missing                                                                                |
| Audiences                                             | The service-specific list of string identifiers representing the intended audience for the token or an empty array if no `aud` claim is present |
| Issuer                                                | The string representing the issuer of the token or `null` if the `iss` claim is missing                                                         |
| JwtId                                                 | The string identifier for the token or `null` if the `jti` claim is missing                                                                     |
