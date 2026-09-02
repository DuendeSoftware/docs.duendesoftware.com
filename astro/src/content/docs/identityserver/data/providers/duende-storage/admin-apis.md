---
title: "Configuration Admin APIs"
description: "Create, read, update and delete IdentityServer clients, resources and identity providers using the Duende Storage admin APIs"
date: 2026-09-01
sidebar:
  label: "Admin APIs"
  order: 30
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

[`AddConfigurationStorage`](/identityserver/data/providers/duende-storage/configuration-storage.md) registers
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

Each service supports create, get, update, query and delete operations. Resolve the service from a dependency injection
scope, such as an authorized endpoint or a scoped application service.

## Create Configuration

The following examples show the minimum shape of each configuration type. Create referenced scopes before resources or
clients that use them.

### API Scope

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.ApiScopes;

static Task<SaveResult<Guid>> CreateApiScope(
    IApiScopeAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new ApiScopeConfiguration
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

static Task<SaveResult<Guid>> CreateApiResource(
    IApiResourceAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new ApiResourceConfiguration
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

static Task<SaveResult<Guid>> CreateIdentityResource(
    IIdentityResourceAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new IdentityResourceConfiguration
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

static Task<SaveResult<Guid>> CreateClient(
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

The API hashes plaintext client and API secret values before storage. Read secrets from a secret manager, never source
control or application configuration committed with your code. Secret values are not returned by read operations.

### Dynamic Identity Provider

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.IdentityProviders;

static Task<SaveResult<Guid>> CreateIdentityProvider(
    IIdentityProviderAdmin admin,
    string clientSecret,
    CancellationToken ct) =>
    admin.CreateAsync(
        new IdentityProviderConfiguration
        {
            Scheme = "corporate-oidc",
            DisplayName = "Corporate sign-in",
            Type = "oidc",
            Properties = new Dictionary<string, string>
            {
                ["Authority"] = "https://login.example.com",
                ["ClientId"] = "identityserver",
                ["ClientSecret"] = clientSecret
            }
        },
        ct);
```

Register the corresponding dynamic provider type and supply all protocol-specific properties it requires. Read
`clientSecret` from a secure source, such as Azure Key Vault. IdentityServer validates the configuration before storing it.

:::caution[Protect Recoverable Identity Provider Secrets]
Client and API resource secrets accepted by their dedicated admin APIs are one-way hashed before storage. Dynamic identity
provider properties are different: IdentityServer needs the original values at runtime, so a property such as
`ClientSecret` is stored in the entity payload without hashing or Duende Storage field-level encryption.

Use encrypted database connections, database encryption at rest, restricted database access and protected backups. Do not
grant direct read access to the configuration store as a substitute for an authorized administration API.
:::

### SAML Service Provider

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin;
using Duende.IdentityServer.Admin.SamlServiceProviders;
using Duende.IdentityServer.Models;

static Task<SaveResult<Guid>> CreateSamlServiceProvider(
    ISamlServiceProviderAdmin admin,
    CancellationToken ct) =>
    admin.CreateAsync(
        new SamlServiceProviderConfiguration
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

## Handle Results And Updates

Create, update and delete operations return `SaveResult<TId>`. Check `IsSuccess` before using `Id` or `Version`; failed
results contain structured `Errors`. Get operations return `GetResult<T>`, whose `Found` property tells you whether `Item`
and `Version` are available.

Updates require the version returned by the preceding create or get operation:

```csharp
// ConfigurationAdmin.cs
// ID returned by a previous CreateAsync or QueryAsync call.
var scopeId = new Guid("0198f3a4-5760-7000-8000-000000000001");
var current = await apiScopes.GetAsync(scopeId, ct);

if (!current.Found)
{
    throw new InvalidOperationException("The API scope does not exist.");
}

current.Item.DisplayName = "Inventory read access";

var updated = await apiScopes.UpdateAsync(
    scopeId,
    current.Item,
    current.Version,
    ct);

if (!updated.IsSuccess)
{
    throw new InvalidOperationException(updated.Errors.ToString());
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

Filters can use contains matching, so compare a returned business identifier exactly when you need one specific entity.
Use the continuation tokens on `QueryResult<T>` to retrieve additional pages.

Delete an entity by its storage ID:

```csharp
// ConfigurationAdmin.cs
var deleted = await apiScopes.DeleteAsync(scopeId, ct);

if (!deleted.IsSuccess)
{
    throw new InvalidOperationException(deleted.Errors.ToString());
}
```

For custom fields on clients and resources, configure
[data extension schemas](/identityserver/data/providers/duende-storage/schemas.md).
