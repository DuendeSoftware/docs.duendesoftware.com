---
title: "SAML Metadata Services"
description: "Reference for ISaml2MetadataResponseGenerator and ISaml2IssuerNameService, which generate the SAML identity provider metadata document and resolve the IdP entity ID."
date: 2026-11-16
sidebar:
  label: "SAML Metadata Services"
  order: 6
---

Two services shape the identity provider (IdP) metadata that service providers consume. `ISaml2IssuerNameService` resolves the entity ID that identifies IdentityServer as the IdP. `ISaml2MetadataResponseGenerator` generates the metadata document that is served by the metadata endpoint.

## ISaml2MetadataResponseGenerator

#### Duende.IdentityServer.Saml.ResponseHandling.ISaml2MetadataResponseGenerator

Generates the IdP metadata document served by the metadata endpoint (`/Saml2` by default, content type `application/samlmetadata+xml`).

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

`Saml2MetadataResult` (namespace `Duende.IdentityServer.Saml.Endpoints.Results`, sealed) has one required property, `Xml`, the metadata as an `XmlDocument`.

### Default behavior

The default implementation, `Saml2MetadataResponseGenerator`, is a public class. It doesn't call [`ISamlSigningService`](/identityserver/reference/v8/saml/saml-signing-service.md) itself. The metadata endpoint passes in the issuer and the certificates from `ISamlSigningService.GetAllSigningCertificatesAsync`, and the generator publishes each as a signing `KeyDescriptor`. The rest of the document comes from `SamlOptions`: the single sign-on and single logout endpoints (one per configured binding, `SingleSignOnServiceBindings` and `SingleLogoutServiceBindings`), `SupportedNameIdFormats`, `WantAuthnRequestsSigned`, and the `Metadata.CacheDuration` and `Metadata.ExpiryDuration` values. The content type is `application/samlmetadata+xml`, or `text/xml` when the request accepts `text/html`.

The class has a `protected virtual GenerateEntityDescriptorAsync` method you can override to change the document.

### Registration

```csharp
builder.Services.AddScoped<ISaml2MetadataResponseGenerator, CustomMetadataGenerator>();
```

## ISaml2IssuerNameService

#### Duende.IdentityServer.Saml.Services.ISaml2IssuerNameService

Resolves the entity ID IdentityServer uses as the SAML IdP issuer.

```csharp
public interface ISaml2IssuerNameService
{
    Task<string> GetCurrentAsync(CancellationToken ct);
}
```

### Default behavior

The default implementation derives the entity ID from the issuer and `SamlOptions.EntityIdPath` (default `/Saml2`). When `SamlOptions.EntityId` is set, it overrides the derived value. See [SAML configuration](/identityserver/saml/configuration.md).

### Registration

```csharp
builder.Services.AddScoped<ISaml2IssuerNameService, CustomIssuerNameService>();
```
