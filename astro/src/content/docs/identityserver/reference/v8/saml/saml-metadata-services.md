---
title: "SAML Metadata Services"
description: "Reference for ISaml2MetadataResponseGenerator and ISaml2IssuerNameService, which generate the SAML identity provider metadata document and resolve the IdP entity ID."
date: 2026-11-16
sidebar:
  label: "SAML Metadata Services"
  order: 6
---

These services shape the identity provider (IdP) metadata that service providers consume. `ISaml2IssuerNameService` resolves IdentityServer's IdP entity ID, and `ISaml2MetadataResponseGenerator` builds the metadata document that service providers consume.

## ISaml2MetadataResponseGenerator

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2MetadataResponseGenerator

Saml2 metadata response generator. It generates the IdP metadata document served by the metadata endpoint with content type `application/samlmetadata+xml`. The endpoint uses the path from `SamlOptions.EntityId` when that is an HTTP(S) URL with a path other than `/`. Otherwise it uses `SamlOptions.EntityIdPath` (default `/Saml2`).

```csharp
public interface ISaml2MetadataResponseGenerator
{
    Task<Saml2MetadataResult> GenerateMetadataAsync(
        string issuer,
        IEnumerable<X509Certificate2> signingKeys,
        SamlOptions options,
        string baseUrl,
        CancellationToken ct);
}
```

| Parameter | Description |
|---|---|
| `issuer` | Entity Id of IdentityServer |
| `signingKeys` | The certificates to publish as signing keys in the metadata. |
| `options` | Saml options |
| `baseUrl` | Base url of IdentityServer |
| `ct` | The cancellation token. |

`GenerateMetadataAsync` generates the metadata response. It returns a `Saml2MetadataResult` that contains the generated XML.

`Saml2MetadataResult` (namespace `Duende.IdentityServer.Saml.Endpoints.Results`, sealed) is the result of Saml2 Metadata generation. It has one required property, `Xml`: the metadata as an XML document.

### Default behavior

The metadata endpoint passes `Saml2MetadataResponseGenerator` the issuer and the certificates from [`ISamlSigningService`](/identityserver/reference/v8/saml/saml-signing-service.md)`.GetAllSigningCertificatesAsync`, and the generator publishes each certificate as a signing `KeyDescriptor`. The rest of the document comes from `SamlOptions`: the single sign-on and single logout endpoints (one per configured binding, `SingleSignOnServiceBindings` and `SingleLogoutServiceBindings`), `SupportedNameIdFormats`, `WantAuthnRequestsSigned`, and the `Metadata.CacheDuration` and `Metadata.ExpiryDuration` values. The content type is `application/samlmetadata+xml`, or `text/xml` when the request accepts `text/html`.

To change the document, derive from the generator and override `GenerateEntityDescriptorAsync`, which generates the `EntityDescriptor` for IdentityServer acting as a SAML identity provider. It takes the same `issuer`, `signingKeys`, `options`, `baseUrl`, and `ct` arguments as `GenerateMetadataAsync`.

### Registration

```csharp
builder.Services.AddScoped<ISaml2MetadataResponseGenerator, CustomMetadataGenerator>();
```

## ISaml2IssuerNameService

#### Duende.IdentityServer.Saml.Services.ISaml2IssuerNameService

Access to current IdentityServer Entity Id. It resolves the entity ID IdentityServer uses as the SAML IdP issuer.

```csharp
public interface ISaml2IssuerNameService
{
    Task<string> GetCurrentAsync(CancellationToken ct);
}
```

`GetCurrentAsync` gets the current IdentityServer Entity Id and returns the Entity Id string.

### Default behavior

The default implementation derives the entity ID from the issuer and `SamlOptions.EntityIdPath` (default `/Saml2`). When `SamlOptions.EntityId` is set, it overrides the derived value. See [SAML configuration](/identityserver/saml/configuration.md).

### Registration

```csharp
builder.Services.AddScoped<ISaml2IssuerNameService, CustomIssuerNameService>();
```
