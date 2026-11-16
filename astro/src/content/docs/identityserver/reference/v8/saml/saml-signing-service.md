---
title: "SAML Signing Service"
description: "Reference for ISamlSigningService, which provides the certificates used to sign SAML messages and metadata."
date: 2026-11-16
sidebar:
  label: "SAML Signing"
  order: 5
---

#### Duende.IdentityServer.Saml.Services.ISamlSigningService

Provides the certificates IdentityServer uses to sign SAML responses and to publish in IdP metadata.

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
| `GetSigningCertificateAsync` | The certificate, with private key, used to sign. Throws `InvalidOperationException` if no signing credential is configured, the key isn't an X.509 or RSA key, or the certificate has no private key. |
| `GetSigningCertificateBase64Async` | The base64-encoded DER certificate, used in metadata key descriptors. |
| `GetAllSigningCertificatesAsync` | All signing certificates, including rolled keys, so metadata can publish multiple key descriptors. |

## Default behavior

The default implementation is internal and scoped. It uses IdentityServer's configured signing keys. An X.509 key is used directly. A raw `RsaSecurityKey` is wrapped only when it's managed by automatic key management; otherwise the service throws.

## Registration

`ISamlSigningService` is registered with `TryAddScoped`:

```csharp
builder.Services.AddScoped<ISamlSigningService, CustomSigningService>();
builder.Services.AddIdentityServer()
    .AddSaml();
```
