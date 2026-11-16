---
title: "SAML Signing Service"
description: "Reference for ISamlSigningService, which provides the certificates used to sign SAML messages and metadata."
date: 2026-11-16
sidebar:
  label: "SAML Signing"
  order: 5
---

#### Duende.IdentityServer.Saml.Services.ISamlSigningService

Service for obtaining signing credentials for SAML operations. It provides the certificates IdentityServer uses to sign SAML responses and to publish in IdP metadata.

```csharp
public interface ISamlSigningService
{
    Task<X509Certificate2> GetSigningCertificateAsync(CancellationToken ct);
    Task<string> GetSigningCertificateBase64Async(CancellationToken ct);
    Task<IReadOnlyList<X509Certificate2>> GetAllSigningCertificatesAsync(CancellationToken ct);
}
```

| Method | Description |
|---|---|
| `GetSigningCertificateAsync` | Gets the X509 certificate used for signing SAML messages. Returns the signing certificate with private key. Throws `InvalidOperationException` if no signing credential is configured, the key isn't an X.509 or RSA key, or the certificate has no private key. |
| `GetSigningCertificateBase64Async` | Gets the X509 certificate as a base64-encoded string for inclusion in SAML metadata. Returns the base64-encoded certificate bytes (DER). |
| `GetAllSigningCertificatesAsync` | Gets all current and recently rotated X509 certificates used for signing SAML messages. Non-X509 keys (e.g., RSA keys from automatic key management) are wrapped in generated certificates. Returns signing certificates suitable for inclusion in SAML metadata, so metadata can publish multiple key descriptors. |

## Default behavior

The default implementation uses IdentityServer's configured signing keys: X.509 keys directly, or raw `RsaSecurityKey` keys when automatic key management manages them (it wraps them in an X.509 container). Other key types throw an exception. When the signing credential is a raw `RsaSecurityKey`, `GetSigningCertificateAsync` returns a cached `X509Certificate2` wrapping the key. The caller must NOT dispose the returned certificate — it is owned by the cache.

## Registration

`AddIdentityServer()` registers the default `ISamlSigningService`. To replace it, register your own:

```csharp
builder.Services.AddScoped<ISamlSigningService, CustomSigningService>();
builder.Services.AddIdentityServer()
    .AddSaml();
```
