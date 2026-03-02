---
title: "SAML Configuration"
description: Configuration options and models for the SAML 2.0 Identity Provider feature, including SamlOptions and SamlServiceProvider settings.
date: 2026-03-02
sidebar:
  label: Configuration
  order: 10
---

This page documents the configuration options and models for the SAML 2.0 Identity Provider feature.

## Setup

Call `AddSaml()` on the IdentityServer builder to enable SAML 2.0 support:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
```

`AddSaml()` registers all SAML services and enables the five standard SAML endpoints. The
IdP-initiated SSO endpoint is **not** enabled by default and requires explicit opt-in (see
[Enabling IdP-Initiated SSO](#enabling-idp-initiated-sso) below).

## SamlOptions

`SamlOptions` controls the global behavior of the SAML 2.0 Identity Provider. Access it via
`IdentityServerOptions.Saml`:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Saml.DefaultSigningBehavior = SamlSigningBehavior.SignAssertion;
    options.Saml.DefaultClockSkew = TimeSpan.FromMinutes(5);
    options.Saml.WantAuthnRequestsSigned = false;
});
```

| Property                                   | Type                                 | Default                                   | Description                                                          |
| ------------------------------------------ | ------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------- |
| `MetadataValidityDuration`                 | `TimeSpan?`                          | 7 days                                    | If set, the metadata document includes a `validUntil` attribute.     |
| `WantAuthnRequestsSigned`                  | `bool`                               | `false`                                   | When `true`, the IdP requires all AuthnRequests to be signed.        |
| `DefaultAttributeNameFormat`               | `string`                             | `uri`                                     | Default SAML attribute name format URI for attributes in assertions. |
| `DefaultPersistentNameIdentifierClaimType` | `string`                             | `ClaimTypes.NameIdentifier`               | Claim type used to resolve a persistent NameID value.                |
| `DefaultClaimMappings`                     | `ReadOnlyDictionary<string, string>` | (see below)                               | Maps OIDC claim types to SAML attribute names.                       |
| `SupportedNameIdFormats`                   | `Collection<string>`                 | Email, Persistent, Transient, Unspecified | NameID formats advertised in metadata.                               |
| `DefaultClockSkew`                         | `TimeSpan`                           | 5 minutes                                 | Clock skew tolerance for validating SAML message timestamps.         |
| `DefaultRequestMaxAge`                     | `TimeSpan`                           | 5 minutes                                 | Maximum age for SAML AuthnRequests.                                  |
| `DefaultSigningBehavior`                   | `SamlSigningBehavior`                | `SignAssertion`                           | Default signing behavior for SAML responses.                         |
| `MaxRelayStateLength`                      | `int`                                | 80                                        | Maximum length (in UTF-8 bytes) of the RelayState parameter.         |
| `UserInteraction`                          | `SamlUserInteractionOptions`         | (see below)                               | Configures SAML endpoint paths.                                      |

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

| Property                   | Default            | Description                                        |
| -------------------------- | ------------------ | -------------------------------------------------- |
| `Route`                    | `/saml`            | Base route prefix for all SAML endpoints.          |
| `Metadata`                 | `/metadata`        | Path suffix for the metadata endpoint.             |
| `SignInPath`               | `/signin`          | Path suffix for the SP-initiated sign-in endpoint. |
| `SignInCallbackPath`       | `/signin_callback` | Path suffix for the sign-in callback endpoint.     |
| `IdpInitiatedPath`         | `/idp-initiated`   | Path suffix for the IdP-initiated SSO endpoint.    |
| `SingleLogoutPath`         | `/logout`          | Path suffix for the single logout endpoint.        |
| `SingleLogoutCallbackPath` | `/logout_callback` | Path suffix for the logout callback endpoint.      |

The full URL for each endpoint is formed by combining the base URL of the IdentityServer host with
the `Route` prefix and the individual path suffix. For example, the metadata endpoint is available
at `https://your-idp.example.com/saml/metadata` by default.

## SamlServiceProvider Model

`SamlServiceProvider` represents a registered SAML 2.0 Service Provider configuration.

| Property                                   | Type                             | Default              | Description                                                                          |
| ------------------------------------------ | -------------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `EntityId`                                 | `string`                         | (required)           | The SP's entity identifier URI, as declared in its SAML metadata.                    |
| `DisplayName`                              | `string`                         | (required)           | Human-readable name shown in logs and consent screens.                               |
| `Description`                              | `string?`                        | `null`               | Optional description.                                                                |
| `Enabled`                                  | `bool`                           | `true`               | When `false`, all SAML requests from this SP are rejected.                           |
| `ClockSkew`                                | `TimeSpan?`                      | `null`               | Per-SP clock skew override. Uses `SamlOptions.DefaultClockSkew` when `null`.         |
| `RequestMaxAge`                            | `TimeSpan?`                      | `null`               | Per-SP request maximum age. Uses `SamlOptions.DefaultRequestMaxAge` when `null`.     |
| `AssertionConsumerServiceUrls`             | `ICollection<Uri>`               | (required)           | ACS URLs where SAML responses will be delivered. At least one is required.           |
| `AssertionConsumerServiceBinding`          | `SamlBinding`                    | —                    | SAML binding for the ACS (`HttpPost` or `HttpRedirect`).                             |
| `SingleLogoutServiceUrl`                   | `SamlEndpointType?`              | `null`               | SP's Single Logout Service endpoint. Required for SLO support.                       |
| `RequireSignedAuthnRequests`               | `bool`                           | `false`              | When `true`, unsigned AuthnRequests from this SP are rejected.                       |
| `SigningCertificates`                      | `ICollection<X509Certificate2>?` | `null`               | Certificates used to verify SP-signed messages.                                      |
| `EncryptionCertificates`                   | `ICollection<X509Certificate2>?` | `null`               | Certificates used to encrypt assertions for this SP.                                 |
| `EncryptAssertions`                        | `bool`                           | `false`              | When `true`, assertions are encrypted using `EncryptionCertificates`.                |
| `RequireConsent`                           | `bool`                           | `false`              | When `true`, the user is always shown a consent screen.                              |
| `AllowIdpInitiated`                        | `bool`                           | `false`              | When `true`, IdP-initiated SSO is allowed for this SP.                               |
| `ClaimMappings`                            | `IDictionary<string, string>`    | `{}`                 | Per-SP claim-to-attribute mappings that override `SamlOptions.DefaultClaimMappings`. |
| `DefaultNameIdFormat`                      | `string?`                        | `urn:...unspecified` | Default NameID format to use when the SP does not specify one.                       |
| `DefaultPersistentNameIdentifierClaimType` | `string?`                        | `null`               | Per-SP override for the claim type used to resolve a persistent NameID.              |
| `SigningBehavior`                          | `SamlSigningBehavior?`           | `null`               | Per-SP signing behavior. Uses `SamlOptions.DefaultSigningBehavior` when `null`.      |

## Enums

### SamlBinding

Defines the SAML protocol binding used for message transport:

| Value          | Description                                                                           |
| -------------- | ------------------------------------------------------------------------------------- |
| `HttpRedirect` | HTTP-Redirect binding. The SAML message is URL-encoded and sent as a query parameter. |
| `HttpPost`     | HTTP-POST binding. The SAML message is Base64-encoded and sent in an HTML form.       |

### SamlSigningBehavior

Controls what elements are signed in SAML responses:

| Value           | Description                                                                           |
| --------------- | ------------------------------------------------------------------------------------- |
| `DoNotSign`     | No signing. For testing only — do not use in production.                              |
| `SignResponse`  | Signs the entire SAML `<Response>` element.                                           |
| `SignAssertion` | Signs the `<Assertion>` element inside the response. **Recommended.**                 |
| `SignBoth`      | Signs both the `<Response>` and the `<Assertion>`. Maximum security, larger messages. |

### SamlEndpointType

`SamlEndpointType` is a class (not an enum) that represents a SAML endpoint with a location and
binding. Used for `SamlServiceProvider.SingleLogoutServiceUrl`:

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
