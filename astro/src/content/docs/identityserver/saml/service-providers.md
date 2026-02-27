---
title: "SAML Service Provider Store"
sidebar:
  label: Service Providers
  order: 20
---

IdentityServer needs to know which SAML 2.0 Service Providers (SPs) are allowed to request
authentication. This is managed through the `ISamlServiceProviderStore` interface.

## ISamlServiceProviderStore

```csharp
public interface ISamlServiceProviderStore
{
    Task<SamlServiceProvider?> FindByEntityIdAsync(string entityId, CancellationToken ct);
}
```

`FindByEntityIdAsync` looks up a Service Provider by its SAML entity identifier (the
`entityID` attribute from the SP's SAML metadata). Return `null` if the entity ID is not
recognized, which will cause IdentityServer to reject the SAML request.

## In-Memory Store (Development / Testing)

For development and testing, use the in-memory store with a static list of `SamlServiceProvider`
objects:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddInMemorySamlServiceProviders(new[]
    {
        new SamlServiceProvider
        {
            EntityId = "https://sp.example.com",
            DisplayName = "Example SP",
            AssertionConsumerServiceUrls = new[] { new Uri("https://sp.example.com/acs") },
            AssertionConsumerServiceBinding = SamlBinding.HttpPost,
        }
    });
```

## Custom Store (Production)

For production deployments, implement `ISamlServiceProviderStore` backed by your data store, then
register it using `AddSamlServiceProviderStore<T>()`:

```csharp
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlServiceProviderStore<MySamlServiceProviderStore>();
```

```csharp
public class MySamlServiceProviderStore : ISamlServiceProviderStore
{
    private readonly IServiceProviderRepository _repository;

    public MySamlServiceProviderStore(IServiceProviderRepository repository)
    {
        _repository = repository;
    }

    public async Task<SamlServiceProvider?> FindByEntityIdAsync(
        string entityId,
        CancellationToken ct)
    {
        var record = await _repository.FindByEntityIdAsync(entityId, ct);
        if (record is null)
            return null;

        return new SamlServiceProvider
        {
            EntityId = record.EntityId,
            DisplayName = record.DisplayName,
            AssertionConsumerServiceUrls = record.AcsUrls.Select(u => new Uri(u)).ToList(),
            AssertionConsumerServiceBinding = SamlBinding.HttpPost,
            // ... map remaining properties
        };
    }
}
```

## Full Configuration Example

The following example shows a fully configured `SamlServiceProvider` with signing, encryption,
and single logout:

```csharp
new SamlServiceProvider
{
    EntityId = "https://sp.example.com",
    DisplayName = "Example SP",
    Enabled = true,

    // Assertion Consumer Service
    AssertionConsumerServiceUrls = new[] { new Uri("https://sp.example.com/acs") },
    AssertionConsumerServiceBinding = SamlBinding.HttpPost,

    // Single Logout Service
    SingleLogoutServiceUrl = new SamlEndpointType
    {
        Location = new Uri("https://sp.example.com/saml/slo"),
        Binding = SamlBinding.HttpPost,
    },

    // Signing
    SigningBehavior = SamlSigningBehavior.SignAssertion,
    RequireSignedAuthnRequests = true,
    SigningCertificates = new[] { myCertificate },

    // Encryption
    EncryptAssertions = true,
    EncryptionCertificates = new[] { spEncryptionCertificate },

    // NameID
    DefaultNameIdFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",

    // Claims
    ClaimMappings = new Dictionary<string, string>
    {
        ["department"] = "businessUnit",
    },
}
```

See [SAML Configuration](/identityserver/saml/configuration/) for full property documentation.
