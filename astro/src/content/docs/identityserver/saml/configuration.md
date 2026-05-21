---
title: "SAML Configuration"
description: Configuration options and models for the SAML 2.0 Identity Provider feature, including SamlOptions and SamlServiceProvider settings.
date: 2026-05-21
sidebar:
  label: Configuration
  order: 10
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>

This page documents the configuration options and models for the SAML 2.0 Identity Provider feature.

## Setup

Call `AddSaml()` on the IdentityServer builder to enable SAML 2.0 support:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
```

`AddSaml()` registers all SAML services and endpoints. It can be called with no arguments when all Service Provider configuration is managed via a store, or with an options callback to configure protocol-level settings:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml(saml =>
    {
        saml.EntityId = "https://idp.example.com/saml";
        saml.Metadata.CacheDuration = TimeSpan.FromHours(1);
    });
```

## SamlOptions

`SamlOptions` controls the global behavior and policy of the SAML 2.0 Identity Provider: how claims are mapped to SAML attributes, how assertions are signed, how NameIDs are resolved, and what tolerances apply to timestamps and request lifetimes.

Access `SamlOptions` when calling `AddSaml()`:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml(saml =>
    {
        saml.DefaultSigningBehavior = SamlSigningBehavior.SignAssertion;
        saml.DefaultClockSkew = TimeSpan.FromMinutes(5);
        saml.WantAuthnRequestsSigned = true;
    });
});
```

Use `SamlOptions` when you need to set defaults that apply across all Service Providers (for example, a shared assertion
lifetime, a common set of AuthnContext mappings, or a global signing policy). Individual SPs can override most of these
defaults via their own `SamlServiceProvider` configuration.

Available options:

* **`EntityId`**
  The SAML entity identifier for IdentityServer when acting as an IdP. Most deployments do not need to set this; the default value is derived from the host URL combined with `EntityIdPath`. Defaults to `{host}/Saml2`.

* **`EntityIdPath`**
  The path segment appended to the host URL to form the default `EntityId`. Defaults to `/Saml2`.

* **`SigninStateLifetime`**
  How long sign-in request state is retained while the user authenticates. This controls the TTL for records in the `ISamlSigninStateStore`. Defaults to 15 minutes.

* **`LogoutSessionLifetime`**
  Controls how long logout session tracking state is retained while front-channel logout completes. This controls the TTL for records in the [`ISamlLogoutSessionStore`](/identityserver/saml/extensibility.md#isamllogoutsessionstore). Defaults to 5 minutes.

* **`MaxMessageSize`**
  Maximum size (in characters) of inbound SAML messages that IdentityServer will accept. Messages exceeding this limit are rejected. Defaults to 1,048,576 (1 MB).

* **`Endpoints`**
  Configures the URL paths and supported bindings for SAML endpoints. See [`SamlEndpointOptions`](#samlendpointoptions) below.

* **`Metadata`**
  Configures metadata document generation. See [SamlMetadataOptions](#samlmetadataoptions) below.

* **`WantAuthnRequestsSigned`**
  When `true`, the IdP requires all AuthnRequests to be signed. Defaults to `true`.

* **`DefaultClaimMappings`**
  Maps OIDC claim types to SAML attribute names. See [Default Claim Mappings](#default-claim-mappings) below.

* **`SupportedNameIdFormats`**
  Supported NameID formats advertised by the IdP. Defaults to `[ EmailAddress, Unspecified ]`.

  The NameID format determines how the user is identified to the SP. **emailAddress** is human-readable but exposes PII and is coupled to a value that can change. **Unspecified** leaves the format to the IdP's discretion. Inbound AuthnRequests are validated against the formats configured here; requests specifying an unsupported format are rejected. If you implement a custom NameID format via [`ISamlNameIdGenerator`](/identityserver/saml/extensibility.md#isamlnameidgenerator), add it to this list so that validation passes. See [Name Identifiers](/identityserver/saml/concepts.md#name-identifiers) for a full explanation.

* **`DefaultClockSkew`**
  Clock skew tolerance for validating SAML message timestamps. Defaults to 5 minutes.

* **`DefaultRequestMaxAge`**
  Maximum age for SAML AuthnRequests. Defaults to 5 minutes.

* **`DefaultSigningBehavior`**
  Default signing behavior for SAML responses. Defaults to `SignAssertion`.

  :::note
  When you configure an RSA signing key without an X509 certificate (for example, using `AddDeveloperSigningCredential()` or a raw RSA key), IdentityServer automatically generates an X509 container for SAML signing operations. You do not need to create or provide a certificate manually - the generated container wraps your existing RSA key material and is cached for the lifetime of the application.
  :::

* **`MaxRelayStateLength`**
  Maximum length (in UTF-8 bytes) of the RelayState parameter. Defaults to 80.

  RelayState is an opaque string that an SP includes in its `AuthnRequest` to preserve application state (typically the URL the user originally requested) across the SSO round-trip. IdentityServer echoes it back unchanged so the SP can redirect the user to the right page after authentication. The SAML specification recommends keeping RelayState short; this limit enforces that guidance. See [`RelayState`](/identityserver/saml/concepts.md#relaystate) for more context.

* **`DefaultAuthnContextMappings`**
  Maps OIDC `acr`/`amr` values to SAML `AuthnContextClassRef` URIs. Used when an SP requests a specific AuthnContext and IdentityServer needs to translate the user's authentication method into the corresponding SAML URI.
  
  Default mappings include `pwd` → `urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport` and `external` → `urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified`. 
  
  Per-SP overrides are set via `SamlServiceProvider.AuthnContextMappings`.

* **`DefaultAssertionLifetime`**
  How long issued assertions are considered valid. Defaults to 5 minutes. Per-SP overrides are set via `SamlServiceProvider.AssertionLifetime`.

* **`EmailNameIdClaimType`**
  The claim type used to resolve an email-format NameID. Defaults to `"email"`. Per-SP overrides are set via `SamlServiceProvider.EmailNameIdClaimType`.

### Error Inspector Callbacks

These three optional callbacks let you observe and react to errors that occur while IdentityServer parses or validates incoming SAML messages. They are particularly useful when you are debugging interoperability issues with a specific SP, because they give you access to the raw XML and the error details before IdentityServer returns a failure response.

None of these callbacks are required. When they are not set, IdentityServer handles errors using its default behavior.

* **`AuthnRequestErrorInspector`**
  A callback invoked when an error occurs while parsing or validating an incoming `AuthnRequest`. It receives the raw XML and the error details, so you can log the message, inspect the failure reason, or take corrective action on a per-SP basis. This is useful for diagnosing SP configuration problems such as malformed request signatures or unexpected XML structure.

* **`LogoutRequestErrorInspector`**
  A callback invoked when an error occurs while parsing or validating an incoming `LogoutRequest`. It works the same way as `AuthnRequestErrorInspector` but applies to SLO flows. Use it to investigate cases where an SP's logout request is rejected unexpectedly.

* **`LogoutResponseErrorInspector`**
  A callback invoked when an error occurs while processing an incoming `LogoutResponse` from an SP during Single Logout (SLO). It lets you handle cases where an SP returns a malformed or unexpected response, for example to log the raw XML for later analysis or to suppress the error for a known non-compliant SP.

### Default Claim Mappings

The default `DefaultClaimMappings` dictionary maps common OIDC claim types to SAML 2.0 attribute
names:

| Claim type | SAML attribute name                                                  |
|------------|----------------------------------------------------------------------|
| `name`     | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`         |
| `email`    | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` |
| `role`     | `http://schemas.xmlsoap.org/ws/2005/05/identity/role`                |

Claims not present in this mapping are still included in the assertion but use their original claim type as the attribute name.
Override mappings globally via `SamlOptions.DefaultClaimMappings` or per Service Provider via `SamlServiceProvider.ClaimMappings`.

## SamlMetadataOptions

`SamlMetadataOptions` controls how the IdP metadata document is generated. Access it via `SamlOptions.Metadata`.

* **`CacheDuration`** (`TimeSpan`)
  How long consumers (Service Providers and federation tools) should cache the metadata document before re-fetching it. This value is included as the `cacheDuration` attribute in the metadata XML. Defaults to 12 hours.

* **`ExpiryDuration`** (`TimeSpan`)
  How long the metadata document is considered valid. This value is used to compute the `validUntil` attribute in the metadata XML. After this time, consumers should treat the metadata as stale and re-fetch it. Defaults to 5 days.

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml(saml =>
    {
        saml.Metadata.CacheDuration = TimeSpan.FromHours(6);
        saml.Metadata.ExpiryDuration = TimeSpan.FromDays(7);
    });
```

## SamlEndpointOptions

`SamlEndpointOptions` configures the URL paths and supported bindings for all SAML protocol endpoints. Access it via `SamlOptions.Endpoints`.

| Property                      | Type                  | Default                    | Description                                                                                                                     |
|-------------------------------|-----------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| `SingleSignOnServicePath`     | `string`              | `"/Saml2/SSO"`             | Path for the SSO endpoint (receives AuthnRequests).                                                                             |
| `SingleSignOnServiceBindings` | `ICollection<string>` | `[HttpRedirect, HttpPost]` | Bindings accepted by the SSO endpoint. Set to an empty collection to disable the SSO endpoint entirely.                         |
| `SingleSignOnCallbackPath`    | `string`              | `"/Saml2/SSO/Callback"`    | Path for the SSO callback endpoint (after user authenticates).                                                                  |
| `SingleLogoutServicePath`     | `string`              | `"/Saml2/SLO"`             | Path for the SLO endpoint (receives LogoutRequests and LogoutResponses).                                                        |
| `SingleLogoutServiceBindings` | `ICollection<string>` | `[HttpRedirect, HttpPost]` | Bindings accepted by the SLO endpoint. Set to an empty collection to disable the SLO endpoint entirely.                         |
| `SingleLogoutCallbackPath`    | `string`              | `"/Saml2/SLO/Callback"`    | Path for the SLO callback endpoint (completes the logout flow).                                                                 |
| `StateIdParameterName`        | `string`              | `"samlStateId"`            | Query string parameter name used to pass the SAML sign-in state identifier through the return URL. |


```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml(saml =>
    {
        saml.Endpoints.SingleSignOnServicePath = "/Saml2/SSO";
        saml.Endpoints.SingleLogoutServicePath = "/Saml2/SLO";
    });
```

## SamlServiceProvider Model

`SamlServiceProvider` represents a registered SAML 2.0 Service Provider. Each SP has its own entity ID, ACS endpoints, signing certificates, and claim configuration. SPs can be registered statically in code or managed dynamically via a custom store.

Most properties on `SamlServiceProvider` are optional overrides of the global defaults set in `SamlOptions`. When a property is `null`, the corresponding `SamlOptions` default applies. This lets you configure sensible defaults once and only specify per-SP values where behavior needs to differ.

Available options:

* **`EntityId`** (`string`)
  The SP's entity identifier, as declared in its SAML metadata. Required.

* **`DisplayName`** (`string`)
  Human-readable name shown in logs and consent screens. Required.

* **`Description`** (`string?`)
  Optional description. Defaults to `null`.

* **`Enabled`** (`bool`)
  When `false`, all SAML requests from this SP are rejected. Defaults to `true`.

* **`ClockSkew`** (`TimeSpan?`)
  Per-SP clock skew override. Uses `SamlOptions.DefaultClockSkew` when `null`. Defaults to `null`.

* **`RequestMaxAge`** (`TimeSpan?`)
  Per-SP request maximum age. Uses `SamlOptions.DefaultRequestMaxAge` when `null`. Defaults to `null`.

* **`AssertionConsumerServiceUrls`** (`ICollection<IndexedEndpoint>`)
  ACS endpoints where SAML responses will be delivered. At least one is required. Each entry is an `IndexedEndpoint` that specifies the URL, binding, ordering index, and whether it is the default endpoint. See [`IndexedEndpoint`](#indexedendpoint) below.

  ```csharp
  AssertionConsumerServiceUrls = new List<IndexedEndpoint>
  {
      new IndexedEndpoint
      {
          Location = "https://sp.example.com/saml/acs",
          Binding = SamlBinding.HttpPost,
          Index = 0,
          IsDefault = true
      }
  }
  ```

* **`SingleLogoutServiceUrl`** (`SamlEndpointType?`)
  SP's Single Logout Service endpoint, expressed as a `SamlEndpointType` with a `Location` (Uri) and `Binding` (SamlBinding). Required for SLO support. Defaults to `null`. See [`SamlEndpointType`](#samlendpointtype) below.

* **`RequireSignedAuthnRequests`** (`bool?`)
  When `true`, unsigned AuthnRequests from this SP are rejected. When `null`, falls back to the global `SamlOptions.WantAuthnRequestsSigned` default. Defaults to `null`.

* **`Certificates`** (`ICollection<ServiceProviderCertificate>?`)
  Certificates associated with this SP, with use annotations indicating whether each certificate is used for signature verification, encryption, or both. See [`ServiceProviderCertificate`](#serviceprovidercertificate) below. Defaults to `null`.

* **`AllowIdpInitiated`** (`bool`)
  When `true`, IdP-initiated SSO is allowed for this SP. Defaults to `false`.

* **`ClaimMappings`** (`IDictionary<string, string>`)
  Per-SP claim-to-attribute mappings (internal claim name → SAML attribute URI) that override `SamlOptions.DefaultClaimMappings`. Defaults to `{}`.

* **`DefaultNameIdFormat`** (`string`)
  Default NameID format to use when the SP does not specify one. Defaults to `urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`.

* **`SigningBehavior`** (`SamlSigningBehavior?`)
  Per-SP signing behavior. Uses `SamlOptions.DefaultSigningBehavior` when `null`. Defaults to `null`.

* **`AssertionLifetime`** (`TimeSpan?`)
  Per-SP override for how long issued assertions are valid. Uses `SamlOptions.DefaultAssertionLifetime` when `null`. Defaults to `null`.

* **`AllowedScopes`** (`ICollection<string>`)
  Identity resource names associated with this SP. Used to determine which identity resources (and their claim types) are available for inclusion in assertions. Only identity resource names are valid here - including API scope names causes resource validation to fail. Should not be empty.

* **`AuthnContextMappings`** (`IDictionary<string, string>`)
  Per-SP override for `acr`/`amr` → `AuthnContextClassRef` URI mappings. Overrides `SamlOptions.DefaultAuthnContextMappings` when set. Defaults to empty.

* **`RequestedClaimTypes`** (`List<string>`)
  Claim types this SP expects in assertions. Used to drive claim population for the SP.

* **`EmailNameIdClaimType`** (`string?`)
  Per-SP override for the claim used to resolve an email-format NameID. Uses `SamlOptions.EmailNameIdClaimType` when `null`. Defaults to `null`.

* **`AllowedSignatureAlgorithms`** (`List<string>?`)
  Signature algorithms this SP accepts. When `null`, the IdP's default algorithm is used. Defaults to `null`.

## Enums and Value Types

### SamlBinding

SAML bindings define how messages travel over HTTP. HTTP-Redirect encodes the message into the URL query string, which works well for small messages such as `AuthnRequest` but is limited by URL length constraints. HTTP-POST encodes the message in a hidden HTML form field and submits it automatically, making it the right choice for larger payloads (such as assertions with many attributes) and for keeping message content out of server access logs. See [Bindings](/identityserver/saml/concepts.md#bindings) for a deeper explanation.

`SamlBinding` is used in two places: on `IndexedEndpoint` (for each ACS endpoint in `AssertionConsumerServiceUrls`) and on `SamlEndpointType` (for `SingleLogoutServiceUrl`).

| Value          | Description                                                                           |
|----------------|---------------------------------------------------------------------------------------|
| `HttpRedirect` | HTTP-Redirect binding. The SAML message is URL-encoded and sent as a query parameter. |
| `HttpPost`     | HTTP-POST binding. The SAML message is Base64-encoded and sent in an HTML form.       |

### SamlSigningBehavior

SAML assertions and responses are typically signed with the IdP's private key to prove their authenticity and prevent tampering. The signing behavior controls which XML elements carry a digital signature. `SignAssertion` is the recommended choice for most deployments: it signs the assertion element independently of the response envelope, which lets the SP verify the assertion regardless of how it was transported. See [Assertions](/identityserver/saml/concepts.md#assertions) for background on why signing matters.

Controls what elements are signed in SAML responses:

| Value           | Description                                                                           |
|-----------------|---------------------------------------------------------------------------------------|
| `DoNotSign`     | No signing. For testing only. Do not use in production.                               |
| `SignResponse`  | Signs the entire SAML `<Response>` element.                                           |
| `SignAssertion` | Signs the `<Assertion>` element inside the response. **Recommended.**                 |
| `SignBoth`      | Signs both the `<Response>` and the `<Assertion>`. Maximum security, larger messages. |

### SamlEndpointType

`SamlEndpointType` is a class that pairs a URL location with a SAML binding. It is used specifically for `SamlServiceProvider.SingleLogoutServiceUrl` to describe where the SP's SLO service lives and which HTTP binding it accepts.

```csharp
new SamlServiceProvider
{
    // ...
    SingleLogoutServiceUrl = new SamlEndpointType
    {
        Location = "https://sp.example.com/saml/slo",
        Binding = SamlBinding.HttpPost,
    }
}
```

Properties:

* **`Location`** (`string`): The URL of the endpoint.
* **`Binding`** (`SamlBinding`): The HTTP binding the endpoint accepts.

### IndexedEndpoint

`IndexedEndpoint` represents a single Assertion Consumer Service (ACS) endpoint on a Service Provider. It extends the basic location-and-binding pair with an index (for ordering when multiple ACS endpoints are registered) and an optional default flag.

`IndexedEndpoint` is used as the element type of `SamlServiceProvider.AssertionConsumerServiceUrls`.

Properties:

* **`Location`** (`string`): The ACS URL where SAML responses are delivered.
* **`Binding`** (`SamlBinding`): The HTTP binding the ACS endpoint uses. Must be `SamlBinding.HttpPost`. HTTP-Redirect is not supported for SAML Response delivery.
* **`Index`** (`int`): Integer index used to order multiple ACS endpoints. Lower values take precedence.
* **`IsDefault`** (`bool?`): When `true`, this endpoint is the default ACS. When multiple endpoints are registered, exactly one should be marked as default.

Example:

```csharp
AssertionConsumerServiceUrls = new List<IndexedEndpoint>
{
    new IndexedEndpoint
    {
        Location = "https://sp.example.com/saml/acs",
        Binding = SamlBinding.HttpPost,
        Index = 0,
        IsDefault = true
    }
}
```

### ServiceProviderCertificate

`ServiceProviderCertificate` pairs an X.509 certificate with a use annotation that tells IdentityServer how to apply it for a given SP. Use it to configure signature verification certificates, encryption certificates, or certificates that serve both purposes.

Properties:

* **`Certificate`** (`X509Certificate2`): The X.509 certificate. Required.
* **`Use`** (`KeyUse`): How the certificate is used. Defaults to `KeyUse.Signing`. See [`KeyUse`](#keyuse) below.

### KeyUse

`KeyUse` is a flags enum that controls how a `ServiceProviderCertificate` is applied.

| Value        | Description                                                                                 |
|--------------|---------------------------------------------------------------------------------------------|
| `Signing`    | Used to verify signatures on messages from this SP.                                         |
| `Encryption` | Used to encrypt assertions sent to this SP.                                                 |
| `Both`       | Used for both signature verification and encryption. Equivalent to `Signing \| Encryption`. |

## Caching Options

The SAML add-on integrates with IdentityServer's built-in caching infrastructure.
When you register a custom SP store with `AddSamlServiceProviderStoreCache<T>()`, IdentityServer wraps your store with
an in-memory cache to reduce repeated lookups.

The cache duration is controlled by `SamlServiceProviderStoreExpiration` on `IdentityServerOptions.Caching`:

* **`SamlServiceProviderStoreExpiration`** (`TimeSpan`)
  How long SP lookups are cached when you use `AddSamlServiceProviderStoreCache<T>()`. Defaults to 15 minutes. This setting has no effect unless you call `AddSamlServiceProviderStoreCache<T>()`.

```csharp
// Program.cs
builder.Services
    .AddIdentityServer(options =>
    {
        options.Caching.SamlServiceProviderStoreExpiration = TimeSpan.FromMinutes(30);
    })
    .AddSaml()
    .AddSamlServiceProviderStoreCache<MySamlServiceProviderStore>();
```

## IdP-Initiated SSO

IdP-initiated SSO is a flow where the Identity Provider sends a SAML assertion to a Service Provider without first receiving an `AuthnRequest`. This is commonly used in application portal pages (for example, a "My Apps" dashboard) where the user is already authenticated and clicks a tile to launch an SP application.

There is no built-in endpoint for IdP-initiated SSO. Instead, inject `IIdpInitiatedSsoService` into your own Razor Pages or controllers to generate and send the SAML response programmatically. See [`IIdpInitiatedSsoService`](/identityserver/saml/extensibility.md#iidpinitiatedssoservice) for usage details.

To allow IdP-initiated SSO for a given SP, set `AllowIdpInitiated = true` on its `SamlServiceProvider` configuration:

```csharp
new SamlServiceProvider
{
    EntityId = "https://sp.example.com",
    AllowIdpInitiated = true,
    // ...
}
```

:::caution
IdP-initiated SSO requires the Service Provider to accept unsolicited SAML responses from the IdP. Only enable it for SPs that explicitly support and require this flow.
:::


