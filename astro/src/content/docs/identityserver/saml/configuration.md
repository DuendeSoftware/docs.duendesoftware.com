---
title: "SAML Configuration"
description: Configuration options and models for the SAML 2.0 Identity Provider feature, including SamlOptions, Saml2Options, and SamlServiceProvider settings.
date: 2026-03-02
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

`AddSaml()` registers all SAML services and six SAML endpoints, enabling five of them by default. The IdP-initiated SSO endpoint requires explicit opt-in (see [Enabling IdP-Initiated SSO](#enabling-idp-initiated-sso) below). It can be called with no arguments when all Service Provider configuration is managed via the admin API, or with an options callback to configure protocol-level settings via `Saml2Options`:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml(saml2 =>
    {
        saml2.EntityId = "https://idp.example.com/saml";
        saml2.Metadata.CacheDuration = TimeSpan.FromHours(1);
    });
```

## SamlOptions

`SamlOptions` controls the global behavior and policy of the SAML 2.0 Identity Provider: how claims are mapped to SAML attributes, how assertions are signed, how NameIDs are resolved, and what tolerances apply to timestamps and request ages. It is distinct from `Saml2Options`, which handles protocol plumbing (entity ID, endpoint paths, metadata generation).

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
  IdentityServer-layer setting that, if set, causes the metadata document to include a `validUntil` attribute. Defaults to 7 days. This property predates `Saml2Options.Metadata.ExpiryDuration` and is kept for backwards compatibility. For new deployments, prefer configuring `Saml2Options.Metadata.ExpiryDuration` via the `AddSaml()` callback instead, which operates at the protocol layer and defaults to 5 days.

* **`WantAuthnRequestsSigned`**
  When `true`, the IdP requires all AuthnRequests to be signed. Defaults to `false`.

* **`DefaultAttributeNameFormat`**
  Default SAML attribute name format URI for attributes in assertions. Defaults to `uri`.

* **`DefaultClaimMappings`**
  Maps OIDC claim types to SAML attribute names. See [Default Claim Mappings](#default-claim-mappings) below.

* **`SupportedNameIdFormats`**
  Supported NameID formats advertised by the IdP. Defaults to `[ EmailAddress, Unspecified ]`.

  The NameID format determines how the user is identified to the SP. **Persistent** identifiers are stable and opaque, suitable when the SP needs to correlate the same user across sessions (for example, account linking). **Transient** identifiers are session-scoped and change with each login, best for privacy-sensitive scenarios where the SP does not need a stable identity. **emailAddress** is human-readable but exposes PII and is coupled to a value that can change. Mismatched format expectations are a common source of SSO failures. See [Name Identifiers](/identityserver/saml/concepts.md#name-identifiers) for a full explanation.

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

* **`SigninStateCookieName`**
  Name of the cookie used to store SAML sign-in state between the initial request and the callback. Defaults to `__IdsSvr_SamlSigninState`.

* **`UserInteraction`**
  Configures SAML endpoint paths. See [SamlUserInteractionOptions](#samluserinteractionoptions) below.

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

## Saml2Options

`Saml2Options` is the protocol-level configuration class for the SAML 2.0 IdP. While `SamlOptions` controls behavior and policy (claim mappings, assertion lifetime, signing defaults), `Saml2Options` controls the SAML protocol plumbing: the IdP's entity identity, which endpoint paths and HTTP bindings are active, and how the metadata document is generated and cached.

It lives in the `Duende.IdentityServer.Saml.Configuration` namespace and is configured via the `AddSaml()` options callback:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml(saml2 =>
    {
        saml2.EntityId = "https://idp.example.com/saml";
        saml2.Endpoints.SingleSignOnServicePath = "/saml/sso";
        saml2.Metadata.CacheDuration = TimeSpan.FromHours(1);
    });
```

Use `Saml2Options` when you need to control the IdP's published identity (entity ID), the URL paths it listens on, or the shape of the metadata document it serves to Service Providers. Most deployments only need to set `EntityId`; the remaining defaults are suitable for standard configurations.

Available options:

* **`EntityId`** (`string?`)
  The SAML entity ID of this IdP. If not set, IdentityServer derives it from the OIDC issuer URL combined with `EntityIdPath`. Defaults to `null`.

* **`EntityIdPath`** (`string`)
  Path component appended to the OIDC issuer URL when `EntityId` is not explicitly set. Defaults to `/saml`.

* **`Endpoints.SingleSignOnServicePath`** (`string`)
  URL path for the SSO endpoint. Defaults to `/saml/signin`.

* **`Endpoints.MetadataPath`** (`string`)
  URL path for the metadata endpoint. Defaults to `/saml/metadata`.

* **`Endpoints.SingleSignOnServiceBindings`** (`ICollection<string>`)
  HTTP bindings accepted by the SSO endpoint. Defaults to both HTTP-Redirect and HTTP-POST.

* **`Metadata.Enabled`** (`bool`)
  Whether the metadata endpoint is active. Defaults to `true`.

* **`Metadata.CacheDuration`** (`TimeSpan`)
  How long clients should cache the metadata document. Defaults to 1 hour.

* **`Metadata.ExpiryDuration`** (`TimeSpan`)
  Protocol-layer setting that controls how far in the future the metadata `validUntil` attribute is set. Defaults to **5 days**. This is the preferred way to configure metadata expiry in new deployments. Set it via the `AddSaml()` callback on `Saml2Options`. It is distinct from `SamlOptions.MetadataValidityDuration` (the older IdentityServer-layer property accessed via `IdentityServerOptions.Saml`), which defaults to 7 days and is kept for backwards compatibility. When both are configured, `Saml2Options.Metadata.ExpiryDuration` takes effect at the protocol level.

## SamlServiceProvider Model

`SamlServiceProvider` represents a registered SAML 2.0 Service Provider. Each SP has its own entity ID, ACS endpoints, signing and encryption certificates, and claim configuration. SPs can be registered statically in code or managed dynamically via the admin API.

Most properties on `SamlServiceProvider` are optional overrides of the global defaults set in `SamlOptions`. When a property is `null`, the corresponding `SamlOptions` default applies. This lets you configure sensible defaults once and only specify per-SP values where behavior needs to differ.

Available options:

* **`EntityId`** (`ServiceProviderEntityId`)
  The SP's entity identifier, as declared in its SAML metadata. Required. Parsed via `ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture)`. See [ServiceProviderEntityId](#serviceproviderentityid) below.

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

* **`AssertionConsumerServiceBinding`** (`SamlBinding`) *(obsolete)*
  Replaced by the per-endpoint `Binding` property on `IndexedEndpoint`. Kept for backwards compatibility.

* **`SingleLogoutServiceUrl`** (`SamlEndpointType?`)
  SP's Single Logout Service endpoint, expressed as a `SamlEndpointType` with a `Location` (Uri) and `Binding` (SamlBinding). Required for SLO support. Defaults to `null`. See [SamlEndpointType](#samlendpointtype) below.

* **`RequireSignedAuthnRequests`** (`bool`)
  When `true`, unsigned AuthnRequests from this SP are rejected. Defaults to `false`.

* **`SigningCertificates`** (`ICollection<X509Certificate2>?`)
  Certificates used to verify SP-signed messages. Defaults to `null`.

* **`EncryptionCertificates`** (`ICollection<X509Certificate2>?`)
  Certificates used to encrypt assertions for this SP. Defaults to `null`.

* **`EncryptAssertions`** (`bool`)
  When `true`, assertions are encrypted using `EncryptionCertificates`. Defaults to `false`.

* **`RequireConsent`** (`bool`)
  When `true`, the user is always shown a consent screen. Defaults to `false`.

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
  Controls which claim types are included in the assertion. When empty, all mapped claims are included. Defaults to empty.

* **`AuthnContextMappings`** (`Dictionary<string, string>`)
  Per-SP override for `acr`/`amr` → `AuthnContextClassRef` URI mappings. Overrides `SamlOptions.DefaultAuthnContextMappings` when set. Defaults to empty.

* **`RequestedClaimTypes`** (`List<string>`)
  Claim types this SP expects in assertions. Used to drive claim population for the SP.

* **`EmailNameIdClaimType`** (`string?`)
  Per-SP override for the claim used to resolve an email-format NameID. Uses `SamlOptions.EmailNameIdClaimType` when `null`. Defaults to `null`.

* **`AllowedSignatureAlgorithms`** (`List<string>?`)
  Signature algorithms this SP accepts. When `null`, the IdP's default algorithm is used. Defaults to `null`.

## Assertion Signing and Encryption

SAML assertions carry sensitive user identity data (claims, NameIDs, and authentication context) across network boundaries to Service Providers. Signing and encryption protect this data in transit.

**Signing** proves the assertion was issued by this IdP and has not been tampered with. It is always applied (controlled by `SamlSigningBehavior`). See [SamlSigningBehavior](#samlsigningbehavior) for the available options.

**Encryption** wraps the assertion in an XML-Enc envelope using the SP's public key, so only the SP can decrypt and read it. Encryption is optional but recommended when assertions contain sensitive attributes (PII, roles, entitlements) or when the SP is accessed over untrusted networks.

### Enabling Assertion Encryption

Set `EncryptAssertions = true` and provide the SP's encryption certificate on the `SamlServiceProvider`:

```csharp
new SamlServiceProvider
{
    EntityId = ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture),
    // ...
    EncryptAssertions = true,
    EncryptionCertificates = new[]
    {
        X509CertificateLoader.LoadCertificate(
            Convert.FromBase64String(spCertificateBase64))
    }
}
```

IdentityServer uses the SP's public key (from `EncryptionCertificates`) to encrypt the assertion. The SP uses its corresponding private key to decrypt it. You only need the SP's **public** certificate here, never the private key.

### Certificate Properties

* **`SigningCertificates`** (`ICollection<X509Certificate2>?`)
  Certificates used to **verify** SP-signed messages (AuthnRequests). Provide the SP's public signing certificate when `RequireSignedAuthnRequests = true`. Defaults to `null`.

* **`EncryptionCertificates`** (`ICollection<X509Certificate2>?`)
  Certificates used to **encrypt** assertions for this SP. Provide the SP's public encryption certificate when `EncryptAssertions = true`. Defaults to `null`.

* **`EncryptAssertions`** (`bool`)
  When `true`, assertions are encrypted using `EncryptionCertificates`. Defaults to `false`.

Multiple certificates can be provided to support certificate rotation. IdentityServer will use the first certificate in the list for encryption.

### Certificate Format

Certificates are provided as `X509Certificate2` instances. When loading from Base64-encoded data (e.g., from environment variables or a configuration store):

```csharp
var cert = X509CertificateLoader.LoadCertificate(
    Convert.FromBase64String(base64CertificateData));
```

When using the Admin API (`ISamlServiceProviderAdmin`), certificates are passed as `CertificateDto` objects with a `Base64Data` string and an optional `FriendlyName`. See [Service Providers](/identityserver/saml/service-providers.md) for details.

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

`SamlEndpointType` is a class (not an enum) that pairs a URL location with a SAML binding. It is used specifically for `SamlServiceProvider.SingleLogoutServiceUrl` to describe where the SP's SLO service lives and which HTTP binding it accepts.

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

### ServiceProviderEntityId

`ServiceProviderEntityId` is a value object that represents a SAML SP's entity ID string. It provides type safety and validation for entity ID values, preventing raw strings from being used where a validated entity ID is expected.

Parse an entity ID from a string using the static `Parse` method:

```csharp
var entityId = ServiceProviderEntityId.Parse(
    "https://sp.example.com",
    CultureInfo.InvariantCulture);
```

Use `ServiceProviderEntityId` when setting `SamlServiceProvider.EntityId` in code, or when working with entity IDs returned from the admin API.

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
    EntityId = ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture),
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
