---
title: "Configuration Admin APIs"
description: "Create, read, update and delete IdentityServer clients, resources and identity providers using the Duende Storage admin APIs"
date: 2026-11-10
sidebar:
  label: "Admin APIs"
  order: 30
---

[`AddConfigurationStorage`](/identityserver/data/providers/duende-storage/getting-started.md#configuration-stores) registers
administration services alongside the stores that IdentityServer uses at runtime. These are .NET service APIs, not
preconfigured HTTP endpoints. You decide how to expose them through a protected administration application, command-line
tool or deployment process.

Never expose an administration API without authentication and authorization. Keep it on a trusted network where possible,
require a dedicated administrative policy, validate anti-forgery protections for browser clients and audit changes.

## Available Services

| Service                     | Manages                                                    |
| --------------------------- | ---------------------------------------------------------- |
| `IClientAdmin`              | OpenID Connect and OAuth clients, including client secrets |
| `IApiScopeAdmin`            | API scopes                                                 |
| `IApiResourceAdmin`         | API resources, scope relationships and API secrets         |
| `IIdentityResourceAdmin`    | Identity resources                                         |
| `IIdentityProviderAdmin`    | Dynamic identity providers                                 |
| `ISamlServiceProviderAdmin` | SAML service providers                                     |

Each service supports create, get, update, query and delete operations. You can also get a client by its `client_id`
with `IClientAdmin.GetByClientIdAsync`. The API scope, API resource and identity resource services get an entity by name
with `GetByNameAsync`. `IIdentityProviderAdmin` gets a provider by its scheme with `GetBySchemeAsync`, and
`ISamlServiceProviderAdmin` gets a service provider by its SAML entity ID with `GetByEntityIdAsync`.

IdentityServer serves this configuration at runtime from the storage-backed stores that `AddConfigurationStorage`
registers. It reads clients through `IClientStore` and `ICorsPolicyService`. It reads API scopes, API resources and
identity resources through `IResourceStore`.

:::note[Admin APIs Require Duende Storage]
The admin interfaces `IClientAdmin`, `IApiScopeAdmin`, `IApiResourceAdmin`, `IIdentityResourceAdmin`,
`IIdentityProviderAdmin` and `ISamlServiceProviderAdmin` only work when you store configuration with Duende Storage. If you
use the in-memory stores or the Entity Framework stores, resolving one of these services throws a `NotSupportedException`.
The message names the interface and the store you use, for example `IClientAdmin is not supported when using in-memory
stores.` It ends with `Admin services are only available when configuration is registered via AddStorage().`

`AddStorage(...)` registers the database. The call that registers the admin services is
[`AddConfigurationStorage()`](/identityserver/data/providers/duende-storage/getting-started.md#configuration-stores), so
call both.
:::

## Create Configuration

The following examples show the minimum shape of each configuration type. Create referenced scopes before resources or
clients that use them.

### API Scope

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.ApiScopes;
using Duende.Storage;

static Task<SaveResult<ApiScopeId>> CreateApiScope(
    IApiScopeAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new CreateApiScope
        {
            Name = "inventory.read",
            DisplayName = "Read inventory"
        },
        ct);
```

### API Resource

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.ApiResources;
using Duende.Storage;

static Task<SaveResult<ApiResourceId>> CreateApiResource(
    IApiResourceAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new CreateApiResource
        {
            Name = "inventory",
            DisplayName = "Inventory API",
            Scopes = ["inventory.read"]
        },
        ct);
```

### Identity Resource

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.IdentityResources;
using Duende.Storage;

static Task<SaveResult<IdentityResourceId>> CreateIdentityResource(
    IIdentityResourceAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new CreateIdentityResource
        {
            Name = "employee_profile",
            DisplayName = "Employee profile",
            UserClaims = ["department", "employee_id"]
        },
        ct);
```

### Client

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.Clients;
using Duende.Storage;

static Task<SaveResult<ClientId>> CreateClient(
    IClientAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new CreateClient
        {
            ClientId = "inventory-worker",
            ClientName = "Inventory worker",
            AllowedGrantTypes = ["client_credentials"],
            AllowedScopes = ["inventory.read"],
            ClientSecrets =
            [
                new CreateClientSecret
                {
                    // Replace this with a secret from a secure source,
                    // such as Azure Key Vault.
                    PlaintextValue = "replace-with-a-secret-from-a-secure-source"
                }
            ]
        },
        ct);
```

The API hashes plaintext shared secret values before storage (see the secret types below). Read secrets from a secret
manager, never source control or application configuration committed with your code. Secret values are not returned by
read operations.

### Manage Secrets

Manage secrets separately from the client or API resource definition, because `UpdateAsync` cannot update secret
metadata. To change a secret, delete it and create a new one. Both operations return a `SaveResult` that contains the ID of
the affected secret.

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.Clients;
using Duende.Storage;

static async Task<SaveResult<SecretId>> RotateClientSecret(
    IClientAdmin admin,
    ClientId clientId,
    SecretId oldSecretId,
    string newSecret,
    CancellationToken ct)
{
    var created = await admin.CreateSecretAsync(
        clientId,
        new CreateClientSecret { PlaintextValue = newSecret },
        ct);

    if (!created.IsSuccess)
    {
        return created;
    }

    var deleted = await admin.DeleteSecretAsync(clientId, oldSecretId, ct);
    return deleted.IsSuccess ? created : deleted;
}
```

`IApiResourceAdmin` also has `CreateSecretAsync` and `DeleteSecretAsync`. `CreateSecretAsync` takes the API resource ID
and the plaintext value. It also takes an optional hash algorithm, description, expiration, and secret type. It returns an
`ApiResourceSecretId`.

`SharedSecret` values and custom secret types are hashed with SHA-256, or SHA-512 when you pick it, before storage.
The `X509Thumbprint`, `X509Name`, `X509CertificateBase64`, and `JWK` types are stored verbatim, so you must supply
appropriate material for them.

### Dynamic Identity Provider

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.IdentityProviders;
using Duende.IdentityServer.Stores.Storage.IdentityProviders;
using Duende.Storage;

static Task<SaveResult<IdentityProviderId>> CreateIdentityProvider(
    IIdentityProviderAdmin admin,
    string clientSecret,
    CancellationToken ct)
{
    var provider = new CreateIdentityProvider
    {
        Scheme = "corporate-oidc",
        DisplayName = "Corporate sign-in",
        Type = "oidc"
    };

    provider.ExtendedProperties.Set(DefaultOidcProviderSchema.Authority, "https://login.example.com");
    provider.ExtendedProperties.Set(DefaultOidcProviderSchema.ClientId, "identityserver");
    provider.ExtendedProperties.Set(DefaultOidcProviderSchema.ClientSecret, clientSecret);

    return admin.CreateAsync(provider, ct);
}
```

Dynamic identity provider settings are extended properties, defined by a built-in schema for each provider type.
`AddOidcDynamicProvider()` registers the OIDC schema (`idp:oidc`, `BuiltInSchemas.OidcProvider`), and
`AddSamlDynamicProvider()` registers the SAML schema (`idp:saml`, `BuiltInSchemas.SamlProvider`). Register the dynamic
provider you use so that its schema is available, and set every property the provider type requires.

Use the typed definitions on `DefaultOidcProviderSchema` and `DefaultSamlProviderSchema` (in the
`Duende.IdentityServer.Stores.Storage.IdentityProviders` namespace) to set these properties, instead of spelling out the
attribute codes. The OIDC schema defines `Authority`, `ClientId`, `ClientSecret`, `ResponseType` (`id_token` when not
set), `Scope` (`openid` when not set), and `GetClaimsFromUserInfoEndpoint` and `UsePkce`, which are stored as `"true"` or
`"false"` and are `true` when not set. See [data extension schemas](/identityserver/data/providers/duende-storage/schemas.md#built-in-schemas)
to extend a built-in schema. Read `clientSecret` from a secure source, such as Azure Key Vault. IdentityServer validates
the configuration before storing it.

:::caution[Protect Recoverable Identity Provider Secrets]
Client and API resource secrets accepted by their dedicated admin APIs are one-way hashed before storage. Dynamic identity
provider properties are different: IdentityServer needs the original values at runtime, so a property such as
`ClientSecret` is stored in the entity payload without hashing.

Use encrypted database connections, database encryption at rest, restricted database access and protected backups. Do not
grant direct read access to the configuration store as a substitute for an authorized administration API.
:::

### SAML Service Provider

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.SamlServiceProviders;
using Duende.IdentityServer.Models;
using Duende.Storage;

static Task<SaveResult<SamlServiceProviderId>> CreateSamlServiceProvider(
    ISamlServiceProviderAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new CreateSamlServiceProvider
        {
            EntityId = "https://service-provider.example.com",
            DisplayName = "Example service provider",
            AssertionConsumerServiceUrls =
            [
                new SamlIndexedEndpointConfiguration
                {
                    Location = "https://service-provider.example.com/saml/acs",
                    Binding = SamlBinding.HttpPost,
                    Index = 0,
                    IsDefault = true
                }
            ]
        },
        ct);
```

Service provider certificates are public key material. Set them with `SamlCertificateInput`, which takes the
DER-encoded certificate as a base64 string in `Base64Data` and a `Use` value that defaults to `KeyUse.Signing`.
The admin strips any private key material. On read, each `SamlCertificateConfiguration` returns the full certificate data,
plus `Subject`, `Thumbprint`, and `NotAfter`. Certificates are a full-replace list on update, so submit an existing
certificate with its `Id` to keep it. A certificate with an empty `Id` is added as new.

To validate SAML service provider configuration with your own rules, implement `ISamlServiceProviderConfigurationValidator`
and register it with `AddSamlServiceProviderConfigurationValidator<T>()`. IdentityServer runs the validator when you save a
service provider through `ISamlServiceProviderAdmin`. The registration replaces the default validator. Call `SetError`
on the context to reject a configuration. The message appears in the validation errors of the `SaveResult`.

```csharp
// RequireHttpsEntityIdValidator.cs
using Duende.IdentityServer.Validation;

public class RequireHttpsEntityIdValidator : ISamlServiceProviderConfigurationValidator
{
    public Task ValidateAsync(
        SamlServiceProviderConfigurationValidationContext context,
        CancellationToken ct)
    {
        if (!context.ServiceProvider.EntityId.StartsWith("https://", StringComparison.Ordinal))
        {
            context.SetError("The entity ID must start with https://.");
        }

        return Task.CompletedTask;
    }
}
```

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSamlServiceProviderConfigurationValidator<RequireHttpsEntityIdValidator>();
```

The default validator checks the entity ID, assertion consumer service URLs, allowed scopes, and lifetimes. If you still
need those checks, derive from `DefaultSamlServiceProviderConfigurationValidator` and override its virtual methods.

## Handle Results And Updates

Create, update and delete operations return `SaveResult<TId>`, where `TId` is the typed ID of the entity, such as
`ApiScopeId` or `ClientId`. Check `IsSuccess` before using `Id` or `Version`. Failed
results contain structured `Errors`. Get operations return `GetResult<T>`, whose `Found` property tells you whether `Item`
and `Version` are available.

Updates take an `Update...` model and the version returned by the preceding create or get operation. Call `ToUpdate()` on the
configuration you read to get a mutable copy:

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin.ApiScopes;

// ID returned by a previous CreateAsync or QueryAsync call.
ApiScopeId scopeId = /* ... */;
var current = await apiScopes.GetAsync(scopeId, ct);

if (!current.Found)
{
    throw new InvalidOperationException("The API scope does not exist.");
}

var update = current.Item.ToUpdate();
update.DisplayName = "Inventory read access";

var updated = await apiScopes.UpdateAsync(
    scopeId,
    update,
    current.Version,
    ct);

if (!updated.IsSuccess)
{
    throw new InvalidOperationException(string.Join("; ", updated.Errors.Select(e => e.Message)));
}
```

This optimistic concurrency check prevents one administrator from silently overwriting another administrator's changes.
Handle validation, duplicate-name, not-found and version-conflict errors explicitly in your administration interface.

## Query And Delete Configuration

Use `QueryAsync` to list entities. The result contains the current page and pagination metadata:

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin.ApiScopes;
using Duende.Storage.Querying;

var request = QueryRequest.Create<ApiScopeFilter, ApiScopeSortField>(
    new ApiScopeFilter { Name = "inventory" });

var page = await apiScopes.QueryAsync(request, ct);

foreach (var scope in page.Items)
{
    Console.WriteLine($"{scope.Id}: {scope.Name}");
}
```

The filters for each service support these properties. Properties you leave `null` do not filter.

| Filter                       | Properties                                                      | Sort fields                                          |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| `ApiScopeFilter`             | `Name`, `Enabled`                                               | `ApiScopeSortField`: `Name`, `Enabled`               |
| `ApiResourceFilter`          | `Name`, `Scope`, `Enabled`                                      | `ApiResourceSortField`: `Name`, `Enabled`            |
| `IdentityResourceFilter`     | `Name`, `Enabled`                                               | `IdentityResourceSortField`: `Name`, `Enabled`       |
| `ClientFilter`               | `ClientId`, `ClientName`, `Enabled`, `GrantType`, `AllowedScope` | `ClientSortField`: `ClientId`, `ClientName`, `Enabled` |
| `IdentityProviderFilter`     | `Scheme`, `DisplayName`, `Enabled`, `Type`                      | `IdentityProviderSortField`: `Scheme`, `DisplayName`, `Enabled`, `Type` |
| `SamlServiceProviderFilter`  | `EntityId`, `DisplayName`, `Enabled`                            | `SamlServiceProviderSortField`: `EntityId`, `DisplayName`, `Enabled` |

`ApiResourceFilter.Scope` returns API resources that list exactly that scope name. `ClientFilter.GrantType` returns
clients that list exactly that grant type, and `ClientFilter.AllowedScope` returns clients that list exactly that scope.
These three comparisons ignore case. The other string properties match any value that contains the text you provide,
ignoring case. `Enabled` matches exactly. Multiple properties combine with AND.

Each service returns its own list item type. These carry the typed ID and a few summary values, not the full configuration:

| List item                     | Notable properties                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `ApiScopeListItem`            | `Id`, `Name`, `DisplayName`, `Enabled`, `Description`                                                                  |
| `ApiResourceListItem`         | `Id`, `Name`, `DisplayName`, `Enabled`, `Description`, `ScopeCount`                                                    |
| `IdentityResourceListItem`    | `Id`, `Name`, `DisplayName`, `Enabled`, `Description`                                                                  |
| `ClientListItem`              | `Id`, `ClientId`, `ClientName`, `Enabled`, `Description`, `AllowedGrantTypes`, `AllowedScopeCount`, `RedirectUriCount` |
| `IdentityProviderListItem`    | `Id`, `Scheme`, `DisplayName`, `Enabled`, `Type`                                                                       |
| `SamlServiceProviderListItem` | `Id`, `EntityId`, `DisplayName`, `Enabled`, `Description`, `CertificateCount`, `AllowedScopeCount`                     |

Call `GetAsync`, or the matching get-by-identifier method, when you need the full configuration.

Because text properties match substrings, compare a returned business identifier exactly when you need one specific
entity. Use the continuation tokens on `QueryResult<T>` to retrieve additional pages.

Delete an entity by its storage ID:

```csharp
// ConfigurationAdmin.cs
var deleted = await apiScopes.DeleteAsync(scopeId, ct);

if (!deleted.IsSuccess)
{
    throw new InvalidOperationException(string.Join("; ", deleted.Errors.Select(e => e.Message)));
}
```

For custom fields on clients and resources, configure
[data extension schemas](/identityserver/data/providers/duende-storage/schemas.md).
