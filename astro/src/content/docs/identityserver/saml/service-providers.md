---
title: "SAML Service Provider Management"
description: "How to register and manage SAML 2.0 Service Providers using ISamlServiceProviderStore for read-only lookup."
date: 2026-05-15
sidebar:
  label: Service Providers
  order: 20
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

IdentityServer needs to know which SAML 2.0 Service Providers (SPs) are allowed to request
authentication. The SAML plugin provides the `ISamlServiceProviderStore` interface: a read-only lookup called on every incoming SAML request to resolve SP configuration by entity ID.

For simple deployments, you configure SPs at startup using the in-memory store. For production systems, you implement a custom store backed by a database or configuration service.

## ISamlServiceProviderStore

`ISamlServiceProviderStore` is the read-only lookup interface that IdentityServer calls on every incoming SAML request. When a SAML AuthnRequest arrives, IdentityServer extracts the `Issuer` entity ID and calls `FindByEntityIdAsync` to load the SP's configuration. If the method returns `null`, the request is rejected.

This interface is used for read-only lookup during request processing. Your store implementation should be optimized for fast, concurrent reads (e.g., backed by a cache or an indexed database query).

`GetAllSamlServiceProvidersAsync` is used for bulk operations such as metadata generation or cache warming. It returns all registered SPs as an async stream.

```csharp
// ISamlServiceProviderStore.cs
public interface ISamlServiceProviderStore
{
    Task<SamlServiceProvider?> FindByEntityIdAsync(string entityId, CancellationToken ct);
    IAsyncEnumerable<SamlServiceProvider> GetAllSamlServiceProvidersAsync(CancellationToken ct = default);
}
```

`FindByEntityIdAsync` looks up a Service Provider by its SAML entity identifier (the `entityID` attribute from the SP's SAML metadata). Return `null` if the entity ID is not recognized, which will cause IdentityServer to reject the SAML request.

`GetAllSamlServiceProvidersAsync` returns all registered SPs as an `IAsyncEnumerable<SamlServiceProvider>`, allowing callers to stream results without loading all SPs into memory at once.

## In-Memory Store (Development / Testing)

The in-memory store is the simplest way to register SPs. It is configured at startup with a static list of `SamlServiceProvider` objects and is ideal for development, testing, and demos. Because it holds SPs in memory, it does not support the Admin API. Use a persistent store for runtime management.

Register the in-memory store using the IdentityServer builder:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddInMemorySamlServiceProviders(new[]
    {
        new SamlServiceProvider
        {
            EntityId = "https://sp.example.com",
            DisplayName = "Example SP",
            AssertionConsumerServiceUrls = new List<IndexedEndpoint>
            {
                new IndexedEndpoint
                {
                    Location = new Uri("https://sp.example.com/acs"),
                    Binding = SamlBinding.HttpPost,
                    Index = 0,
                    IsDefault = true
                }
            }
        }
    });
```

## Entity Framework Core Store (Production)

For production deployments, IdentityServer ships an EF Core-backed implementation of `ISamlServiceProviderStore` in the `Duende.IdentityServer.EntityFramework.Stores` package. This stores SP configuration in your database alongside other IdentityServer operational and configuration data.

Register the EF Core store using the IdentityServer builder:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlConfigurationStore(options =>
    {
        options.ConfigureDbContext = b =>
            b.UseSqlServer(connectionString);
    });
```

The EF Core store handles concurrent reads efficiently and integrates with EF Core migrations for schema management.

## Custom Store

For deployments that need a store not covered by the built-in in-memory or EF Core implementations, implement `ISamlServiceProviderStore` backed by your own data store (e.g., a NoSQL database or external configuration service). Register your implementation using `AddSamlServiceProviderStore<T>()` on the IdentityServer builder.

Your implementation must handle concurrent reads efficiently. Consider adding a caching layer (e.g., `IMemoryCache`) in front of your database queries, since `FindByEntityIdAsync` is called on every SAML request.

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlServiceProviderStore<MySamlServiceProviderStore>();
```

```csharp
// MySamlServiceProviderStore.cs
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
            AssertionConsumerServiceUrls = record.AcsEndpoints.Select(e => new IndexedEndpoint
            {
                Location = new Uri(e.Url),
                Binding = SamlBinding.HttpPost,
                Index = e.Index,
                IsDefault = e.IsDefault
            }).ToList(),
            // ... map remaining properties
        };
    }

    public async IAsyncEnumerable<SamlServiceProvider> GetAllSamlServiceProvidersAsync(
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var record in _repository.GetAllAsync(ct))
        {
            yield return new SamlServiceProvider
            {
                EntityId = record.EntityId,
                DisplayName = record.DisplayName,
                // ... map remaining properties
            };
        }
    }
}
```

## Full Configuration Example

The following example shows a fully configured `SamlServiceProvider` with signing, single logout, and claim mappings. This object can be used directly with the in-memory store or returned from a custom `ISamlServiceProviderStore` implementation.

```csharp
new SamlServiceProvider
{
    EntityId = "https://sp.example.com",
    DisplayName = "Example SP",
    Enabled = true,

    // Assertion Consumer Service
    AssertionConsumerServiceUrls = new List<IndexedEndpoint>
    {
        new IndexedEndpoint
        {
            Location = new Uri("https://sp.example.com/acs"),
            Binding = SamlBinding.HttpPost,
            Index = 0,
            IsDefault = true
        }
    },

    // Single Logout Service
    SingleLogoutServiceUrl = new SamlEndpointType
    {
        Location = new Uri("https://sp.example.com/saml/slo"),
        Binding = SamlBinding.HttpPost,
    },

    // Signing
    SigningBehavior = SamlSigningBehavior.SignAssertion,
    RequireSignedAuthnRequests = true, // bool? -- null falls back to global SamlOptions.WantAuthnRequestsSigned
    Certificates = new List<ServiceProviderCertificate>
    {
        new ServiceProviderCertificate
        {
            Certificate = myCertificate,
            Use = KeyUse.Signing
        }
    },

    // NameID
    DefaultNameIdFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",

    // Claims
    ClaimMappings = new ReadOnlyDictionary<string, string>(new Dictionary<string, string>
    {
        ["department"] = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department",
    }),
}
```

Each entry in `Certificates` is a [`ServiceProviderCertificate`](/identityserver/saml/configuration.md#serviceprovidercertificate), which uses the `KeyUse` enum to annotate whether the certificate is used for signing, encryption, or both.

See [SAML Configuration](/identityserver/saml/configuration.md) for full property documentation.
