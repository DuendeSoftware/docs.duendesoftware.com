---
title: "SAML Configuration"
description: Configuration options and models for the SAML 2.0 Identity Provider feature, including SamlOptions and SamlServiceProvider settings.
date: 2026-05-15
sidebar:
  label: Configuration
  order: 10
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

This page documents the configuration options and models for the SAML 2.0 Identity Provider feature.

## Setup

Call `AddSaml()` on the IdentityServer builder to enable SAML 2.0 support:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
```

`AddSaml()` registers all SAML services and endpoints, enabling most of them by default. The IdP-initiated SSO endpoint requires explicit opt-in (see [Enabling IdP-Initiated SSO](#enabling-idp-initiated-sso) below). It can be called with no arguments when all Service Provider configuration is managed via the admin API, or with an options callback to configure protocol-level settings:

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

Access `SamlOptions` via `IdentityServerOptions.Saml` when calling `AddIdentityServer()`:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Saml.DefaultSigningBehavior = SamlSigningBehavior.SignAssertion;
    options.Saml.DefaultClockSkew = TimeSpan.FromMinutes(5);
    options.Saml.WantAuthnRequestsSigned = false;
});
```

Use `SamlOptions` when you need to set defaults that apply across all Service Providers (for example, a shared assertion lifetime, a common set of AuthnContext mappings, or a global signing policy). Individual SPs can override most of these defaults via their own `SamlServiceProvider` configuration.

Available options:

* **`MetadataValidityDuration`**
  IdentityServer-layer setting that, if set, causes the metadata document to include a `validUntil` attribute. Defaults to 7 days.

* **`WantAuthnRequestsSigned`**
  When `true`, the IdP requires all AuthnRequests to be signed. Defaults to `false`.

* **`DefaultAttributeNameFormat`**
  Default SAML attribute name format URI for attributes in assertions. Defaults to `uri`.

* **`DefaultClaimMappings`**
  Maps OIDC claim types to SAML attribute names. See [Default Claim Mappings](#default-claim-mappings) below.

* **`SupportedNameIdFormats`**
  Supported NameID formats advertised by the IdP. Defaults to `[ EmailAddress, Unspecified ]`.

  The NameID format determines how the user is identified to the SP. **emailAddress** is human-readable but exposes PII and is coupled to a value that can change. **Unspecified** leaves the format to the IdP's discretion. Persistent and transient formats are planned for a future release. Mismatched format expectations are a common source of SSO failures. See [Name Identifiers](/identityserver/saml/concepts.md#name-identifiers) for a full explanation.

* **`DefaultClockSkew`**
  Clock skew tolerance for validating SAML message timestamps. Defaults to 5 minutes.

* **`DefaultRequestMaxAge`**
  Maximum age for SAML AuthnRequests. Defaults to 5 minutes.

* **`DefaultSigningBehavior`**
  Default signing behavior for SAML responses. Defaults to `SignAssertion`.

* **`MaxRelayStateLength`**
  Maximum length (in UTF-8 bytes) of the RelayState parameter. Defaults to 80.

  RelayState is an opaque string that an SP includes in its `AuthnRequest` to preserve application state (typically the URL the user originally requested) across the SSO round-trip. IdentityServer echoes it back unchanged so the SP can redirect the user to the right page after authentication. The SAML specification recommends keeping RelayState short; this limit enforces that guidance. See [RelayState](/identityserver/saml/concepts.md#relaystate) for more context.

* **`DefaultAuthnContextMappings`**
  Maps OIDC `acr`/`amr` values to SAML `AuthnContextClassRef` URIs. Used when an SP requests a specific AuthnContext and IdentityServer needs to translate the user's authentication method into the corresponding SAML URI. Type: `Dictionary<string, string>`. Defaults to empty. Per-SP overrides are set via `SamlServiceProvider.AuthnContextMappings`.

* **`DefaultAssertionLifetime`**
  How long issued assertions are considered valid. Type: `TimeSpan`. Defaults to 5 minutes. Per-SP overrides are set via `SamlServiceProvider.AssertionLifetime`.

* **`EmailNameIdClaimType`**
  The claim type used to resolve an email-format NameID. Defaults to `ClaimTypes.Email`. Per-SP overrides are set via `SamlServiceProvider.EmailNameIdClaimType`.

* **`UserInteraction`**
  Configures SAML endpoint paths. See [SamlUserInteractionOptions](#samluserinteractionoptions) below.

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
| ---------- | -------------------------------------------------------------------- |
| `name`     | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`         |
| `email`    | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` |
| `role`     | `http://schemas.xmlsoap.org/ws/2005/05/identity/role`                |

Claims not present in this mapping are excluded from the SAML assertion. Override mappings globally
via `SamlOptions.DefaultClaimMappings` or per Service Provider via
`SamlServiceProvider.ClaimMappings`.

## SamlUserInteractionOptions

`SamlUserInteractionOptions` configures the URL paths for all SAML endpoints. All paths are
relative to the application root.

* **`Route`**
  Base route prefix for all SAML endpoints. Defaults to `/saml`.

* **`Metadata`**
  Path suffix for the metadata endpoint. Defaults to `/metadata`.

* **`SignInPath`**
  Path suffix for the SP-initiated sign-in endpoint. Defaults to `/signin`.

* **`SignInCallbackPath`**
  Path suffix for the sign-in callback endpoint. Defaults to `/signin_callback`.

* **`IdpInitiatedPath`**
  Path suffix for the IdP-initiated SSO endpoint. Defaults to `/idp-initiated`.

* **`SingleLogoutPath`**
  Path suffix for the single logout endpoint. Defaults to `/logout`.

* **`SingleLogoutCallbackPath`**
  Path suffix for the logout callback endpoint. Defaults to `/logout_callback`.

The full URL for each endpoint is formed by combining the base URL of the IdentityServer host with
the `Route` prefix and the individual path suffix. For example, the metadata endpoint is available
at `https://your-idp.example.com/saml/metadata` by default.

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
  ACS endpoints where SAML responses will be delivered. At least one is required. Each entry is an `IndexedEndpoint` that specifies the URL, binding, ordering index, and whether it is the default endpoint. See [IndexedEndpoint](#indexedendpoint) below.

  ```csharp
  AssertionConsumerServiceUrls = new List<IndexedEndpoint>
  {
      new IndexedEndpoint
      {
          Location = new Uri("https://sp.example.com/saml/acs"),
          Binding = SamlBinding.HttpPost,
          Index = 0,
          IsDefault = true
      }
  }
  ```

* **`SingleLogoutServiceUrl`** (`SamlEndpointType?`)
  SP's Single Logout Service endpoint, expressed as a `SamlEndpointType` with a `Location` (Uri) and `Binding` (SamlBinding). Required for SLO support. Defaults to `null`. See [SamlEndpointType](#samlendpointtype) below.

* **`RequireSignedAuthnRequests`** (`bool?`)
  When `true`, unsigned AuthnRequests from this SP are rejected. When `null`, falls back to the global `SamlOptions.WantAuthnRequestsSigned` default. Defaults to `null`.

* **`Certificates`** (`ICollection<ServiceProviderCertificate>?`)
  Certificates associated with this SP, with use annotations indicating whether each certificate is used for signature verification, encryption, or both. Replaces the old `SigningCertificates` property. See [ServiceProviderCertificate](#serviceprovidercertificate) below. Defaults to `null`.

* **`AllowIdpInitiated`** (`bool`)
  When `true`, IdP-initiated SSO is allowed for this SP. Defaults to `false`.

* **`ClaimMappings`** (`ReadOnlyDictionary<string, string>`)
  Per-SP claim-to-attribute mappings (internal claim name → SAML attribute URI) that override `SamlOptions.DefaultClaimMappings`. Defaults to `{}`.

* **`DefaultNameIdFormat`** (`string`)
  Default NameID format to use when the SP does not specify one. Defaults to `urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`.

* **`SigningBehavior`** (`SamlSigningBehavior?`)
  Per-SP signing behavior. Uses `SamlOptions.DefaultSigningBehavior` when `null`. Defaults to `null`.

* **`AssertionLifetime`** (`TimeSpan?`)
  Per-SP override for how long issued assertions are valid. Uses `SamlOptions.DefaultAssertionLifetime` when `null`. Defaults to `null`.

* **`AllowedScopes`** (`ICollection<string>`)
  Scopes associated with this SP. Used to determine which identity resources (and their claim types) are available for inclusion in assertions. When empty, all mapped claims are included. Defaults to empty.

* **`AuthnContextMappings`** (`Dictionary<string, string>`)
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
| -------------- | ------------------------------------------------------------------------------------- |
| `HttpRedirect` | HTTP-Redirect binding. The SAML message is URL-encoded and sent as a query parameter. |
| `HttpPost`     | HTTP-POST binding. The SAML message is Base64-encoded and sent in an HTML form.       |

### SamlSigningBehavior

SAML assertions and responses are typically signed with the IdP's private key to prove their authenticity and prevent tampering. The signing behavior controls which XML elements carry a digital signature. `SignAssertion` is the recommended choice for most deployments: it signs the assertion element independently of the response envelope, which lets the SP verify the assertion regardless of how it was transported. See [Assertions](/identityserver/saml/concepts.md#assertions) for background on why signing matters.

Controls what elements are signed in SAML responses:

| Value           | Description                                                                           |
| --------------- | ------------------------------------------------------------------------------------- |
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
        Location = new Uri("https://sp.example.com/saml/slo"),
        Binding = SamlBinding.HttpPost,
    }
}
```

Properties:

* **`Location`** (`Uri`): The URL of the endpoint.
* **`Binding`** (`SamlBinding`): The HTTP binding the endpoint accepts.

### IndexedEndpoint

`IndexedEndpoint` represents a single Assertion Consumer Service (ACS) endpoint on a Service Provider. It extends the basic location-and-binding pair with an index (for ordering when multiple ACS endpoints are registered) and an optional default flag.

`IndexedEndpoint` is used as the element type of `SamlServiceProvider.AssertionConsumerServiceUrls`.

Properties:

* **`Location`** (`Uri`): The ACS URL where SAML responses are delivered.
* **`Binding`** (`SamlBinding`): The HTTP binding the ACS endpoint accepts (`HttpPost` or `HttpRedirect`).
* **`Index`** (`int`): Integer index used to order multiple ACS endpoints. Lower values take precedence.
* **`IsDefault`** (`bool?`): When `true`, this endpoint is the default ACS. When multiple endpoints are registered, exactly one should be marked as default.

Example with multiple ACS endpoints:

```csharp
AssertionConsumerServiceUrls = new List<IndexedEndpoint>
{
    new IndexedEndpoint
    {
        Location = new Uri("https://sp.example.com/saml/acs"),
        Binding = SamlBinding.HttpPost,
        Index = 0,
        IsDefault = true
    },
    new IndexedEndpoint
    {
        Location = new Uri("https://sp.example.com/saml/acs/redirect"),
        Binding = SamlBinding.HttpRedirect,
        Index = 1,
        IsDefault = false
    }
}
```

### ServiceProviderCertificate

`ServiceProviderCertificate` pairs an X.509 certificate with a use annotation that tells IdentityServer how to apply it for a given SP. Use it to configure signature verification certificates, encryption certificates, or certificates that serve both purposes.

Properties:

* **`Certificate`** (`X509Certificate2`): The X.509 certificate. Required.
* **`Use`** (`KeyUse`): How the certificate is used. Defaults to `KeyUse.Signing`. See [KeyUse](#keyuse) below.

### KeyUse

`KeyUse` is a flags enum that controls how a `ServiceProviderCertificate` is applied.

| Value | Description |
|---|---|
| `Signing` | Used to verify signatures on messages from this SP. |
| `Encryption` | Used to encrypt assertions sent to this SP. |
| `Both` | Used for both signature verification and encryption. Equivalent to `Signing \| Encryption`. |

## Enabling IdP-Initiated SSO

IdP-initiated SSO is disabled by default. To enable it, set the endpoint option and configure
`AllowIdpInitiated = true` on each SP that should permit IdP-initiated flows:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Endpoints.EnableSamlIdpInitiatedEndpoint = true;
});
```

```csharp
new SamlServiceProvider
{
    EntityId = "https://sp.example.com",
    AllowIdpInitiated = true,
    // ...
}
```

:::caution
IdP-initiated SSO is disabled by default because it is not protected by the usual SAML request
binding (there is no AuthnRequest to validate). Only enable it for SPs that you explicitly trust
and that require IdP-initiated flows.
:::

## Endpoint Enable/Disable Options

Individual SAML endpoints can be enabled or disabled via `IdentityServerOptions.Endpoints`:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Endpoints.EnableSamlMetadataEndpoint = true;
    options.Endpoints.EnableSamlSigninEndpoint = true;
    options.Endpoints.EnableSamlSigninCallbackEndpoint = true;
    options.Endpoints.EnableSamlIdpInitiatedEndpoint = false; // must opt in
    options.Endpoints.EnableSamlLogoutEndpoint = true;
    options.Endpoints.EnableSamlLogoutCallbackEndpoint = true;
});
```

`AddSaml()` sets all of the above to `true` except `EnableSamlIdpInitiatedEndpoint`.
