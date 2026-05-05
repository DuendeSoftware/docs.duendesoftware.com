---
title: "SAML Service Provider Management"
description: "How to register and manage SAML 2.0 Service Providers using ISamlServiceProviderStore for read-only lookup and ISamlServiceProviderAdmin for runtime CRUD management."
date: 2026-03-02
sidebar:
  label: Service Providers
  order: 20
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

IdentityServer needs to know which SAML 2.0 Service Providers (SPs) are allowed to request
authentication. The SAML plugin provides two complementary interfaces for this:

- **`ISamlServiceProviderStore`**: a read-only lookup interface called on every incoming SAML request to resolve SP configuration by entity ID.
- **`ISamlServiceProviderAdmin`**: a full CRUD management API for registering, updating, and removing SPs at runtime.

For simple deployments, you configure SPs at startup using the in-memory store. For production systems with dynamic SP registration (admin UIs, multi-tenant onboarding, Aspire seeding), you implement a custom store and use the Admin API to manage SPs at runtime.

## ISamlServiceProviderStore

`ISamlServiceProviderStore` is the read-only lookup interface that IdentityServer calls on every incoming SAML request. When a SAML AuthnRequest arrives, IdentityServer extracts the `Issuer` entity ID and calls `FindByEntityIdAsync` to load the SP's configuration. If the method returns `null`, the request is rejected.

This interface is **not** used for creating or updating SPs. That is the role of `ISamlServiceProviderAdmin`. Your store implementation should be optimized for fast, concurrent reads (e.g., backed by a cache or an indexed database query).

`GetAllSamlServiceProvidersAsync` is used for bulk operations such as metadata generation or cache warming. It returns all registered SPs as an async stream.

```csharp
public interface ISamlServiceProviderStore
{
    Task<SamlServiceProvider?> FindByEntityIdAsync(string entityId, CancellationToken ct);
    IAsyncEnumerable<SamlServiceProvider> GetAllSamlServiceProvidersAsync(CancellationToken ct = default);
}
```

`FindByEntityIdAsync` looks up a Service Provider by its SAML entity identifier (the `entityID` attribute from the SP's SAML metadata). Return `null` if the entity ID is not recognized, which will cause IdentityServer to reject the SAML request.

`GetAllSamlServiceProvidersAsync` returns all registered SPs as an `IAsyncEnumerable<SamlServiceProvider>`, allowing callers to stream results without loading all SPs into memory at once.

## ISamlServiceProviderAdmin

`ISamlServiceProviderAdmin` is the runtime management API for SAML Service Providers. While `ISamlServiceProviderStore` is a read-only lookup interface used during request processing, `ISamlServiceProviderAdmin` provides full CRUD operations: create, read, update, delete, and query.

Use it when you need to register SPs dynamically at runtime (for example, from a configuration database, an admin UI, or an Aspire seeding step) rather than at application startup. The Admin API is registered automatically when using a persistent store (such as Entity Framework Core). It is not available with the in-memory store.

```csharp
public interface ISamlServiceProviderAdmin
{
    Task<CreateResult<SamlServiceProviderDto>> CreateAsync(SamlServiceProviderDto dto, CancellationToken ct);
    Task<GetResult<SamlServiceProviderDto>> GetAsync(string id, CancellationToken ct);
    Task<UpdateResult> UpdateAsync(string id, SamlServiceProviderDto dto, string etag, CancellationToken ct);
    Task<DeleteResult> DeleteAsync(string id, CancellationToken ct);
    Task<QueryResult<SamlServiceProviderSummary>> QueryAsync(SamlServiceProviderFilter filter, int? skip, int? take, CancellationToken ct);
}
```

### SamlServiceProviderDto

`SamlServiceProviderDto` is the data transfer object used for create and update operations. It carries the full SP configuration:

| Property | Type | Description |
|---|---|---|
| `EntityId` | `ServiceProviderEntityId` | The SP's SAML entity ID. |
| `DisplayName` | `LocalizedString?` | Human-readable name shown in the UI. |
| `Description` | `LocalizedString?` | Optional description. |
| `Enabled` | `bool` | Enable or disable the SP. Disabled SPs are rejected at runtime. |
| `AllowIdpInitiated` | `bool` | Allow IdP-initiated SSO flows for this SP. |
| `RequireSignedAuthnRequests` | `bool` | Require that AuthnRequests are signed by the SP. |
| `AssertionConsumerServiceUrls` | `List<IndexedEndpoint>` | The ACS endpoints the IdP may post assertions to. |
| `SingleLogoutServiceUrl` | `SamlEndpointType?` | The SLO endpoint for single logout. |
| `SigningBehavior` | `SamlSigningBehavior` | Controls whether the IdP signs the assertion, the response, or both. |
| `RequireConsent` | `bool` | Require user consent before issuing assertions to this SP. |
| `SigningCertificates` | `List<CertificateDto>?` | SP certificates used to validate signed AuthnRequests. |
| `EncryptAssertions` | `bool` | Encrypt assertions sent to this SP. |
| `EncryptionCertificates` | `List<CertificateDto>?` | SP certificates used to encrypt assertions. |
| `ClaimMappings` | `ReadOnlyDictionary<string, string>?` | Per-SP claim type mappings (source claim → SAML attribute name). |

### CertificateDto

`CertificateDto` represents an X.509 certificate in serialized form. It is used for both signing and encryption certificates in `SamlServiceProviderDto`.

| Property | Type | Description |
|---|---|---|
| `Base64Data` | `string` (required) | Base64-encoded DER-encoded X.509 certificate (the raw bytes, not PEM). |
| `FriendlyName` | `string?` | Optional display name for the certificate, shown in admin UIs and logs. |

### SamlServiceProviderFilter

`SamlServiceProviderFilter` is passed to `QueryAsync` to filter the list of SPs returned. All specified fields are combined with AND logic; omit a field to match all values.

| Property | Type | Description |
|---|---|---|
| `EntityId` | `string?` | Filter by entity ID (exact or partial match, depending on implementation). |
| `DisplayName` | `string?` | Filter by display name. |
| `Enabled` | `bool?` | Filter by enabled status. Pass `true` to list only active SPs. |

### Usage Example: Idempotent Seeding

A common pattern is to seed SPs at application startup (for example, in an Aspire host or a `IHostedService`). The following example checks whether an SP already exists before creating it, making the operation safe to run on every startup:

```csharp
// Inject ISamlServiceProviderAdmin via DI
var admin = serviceProvider.GetRequiredService<ISamlServiceProviderAdmin>();

// Check if SP already exists
var filter = new SamlServiceProviderFilter { EntityId = "https://sp.example.com" };
var existing = await admin.QueryAsync(filter, null, null, ct);

if (existing.Items.Count == 0)
{
    var dto = new SamlServiceProviderDto
    {
        EntityId = ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture),
        DisplayName = new LocalizedString("Example SP"),
        Enabled = true,
        AllowIdpInitiated = true,
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
        SigningBehavior = SamlSigningBehavior.SignAssertion,
        SigningCertificates = new List<CertificateDto>
        {
            new CertificateDto
            {
                FriendlyName = "SP Signing Cert",
                Base64Data = Convert.ToBase64String(certificate.Export(X509ContentType.Cert))
            }
        }
    };
    await admin.CreateAsync(dto, ct);
}
```

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
            EntityId = ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture),
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

## Custom Store (Production)

For production deployments, implement `ISamlServiceProviderStore` backed by your own data store (e.g., a database or configuration service). This gives you full control over how SPs are stored, cached, and retrieved. Register your implementation using `AddSamlServiceProviderStore<T>()` on the IdentityServer builder.

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
            EntityId = ServiceProviderEntityId.Parse(record.EntityId, CultureInfo.InvariantCulture),
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
                EntityId = ServiceProviderEntityId.Parse(record.EntityId, CultureInfo.InvariantCulture),
                DisplayName = record.DisplayName,
                // ... map remaining properties
            };
        }
    }
}
```

## Full Configuration Example

The following example shows a fully configured `SamlServiceProvider` with signing, encryption, single logout, and claim mappings. This object can be used directly with the in-memory store or returned from a custom `ISamlServiceProviderStore` implementation.

```csharp
new SamlServiceProvider
{
    EntityId = ServiceProviderEntityId.Parse("https://sp.example.com", CultureInfo.InvariantCulture),
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
    RequireSignedAuthnRequests = true,
    SigningCertificates = new[] { myCertificate },

    // Encryption
    EncryptAssertions = true,
    EncryptionCertificates = new[] { spEncryptionCertificate },

    // NameID
    DefaultNameIdFormat = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",

    // Claims
    ClaimMappings = new ReadOnlyDictionary<string, string>(new Dictionary<string, string>
    {
        ["department"] = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department",
    }),
}
```

See [SAML Configuration](/identityserver/saml/configuration.md) for full property documentation.
