---
title: Multi-Tenancy
description: An introduction to multi-tenancy support in Duende User Management, enabling a single deployment to serve multiple isolated tenants with separate user stores and configuration.
date: 2026-04-29
sidebar:
  label: Multi-Tenancy
  order: 3
---

Duende User Management includes first-class multi-tenancy support, allowing a single deployment to serve multiple isolated tenants. Each tenant has its own user store, identity configuration, and session data, fully separated from every other tenant within the same running instance.

## What Is Multi-Tenancy in User Management?

In a multi-tenant deployment, each tenant is an independent identity environment. Tenants do not share users, clients, resources, or sessions. From the perspective of end users and client applications, each tenant behaves as if it were a completely separate identity provider.

Key characteristics of multi-tenant deployments:

* **Isolated user stores**: Each tenant maintains its own set of users and credentials. A user registered in one tenant has no presence in another.
* **Separate configuration**: Identity resources, API scopes, clients, and other configuration are scoped per tenant. Changes in one tenant do not affect others.
* **Independent sessions and tokens**: Sessions and issued tokens are tenant-scoped. There is no cross-tenant session sharing.
* **Automatic tenant resolution**: Incoming requests are automatically routed to the correct tenant based on the request origin (hostname) or URL path prefix, with no manual tenant selection required.

By default, User Management operates in single-tenant mode. Multi-tenancy is an opt-in feature that must be explicitly enabled during setup.

## The Space Concept

In Duende User Management, each tenant is represented as a **Space**. A Space is the fundamental unit of tenancy: it defines the identity boundary, the hostnames that route to it, and optionally a URL path prefix for path-based routing.

Every Space has the following properties:

| Property | Type | Description |
|---|---|---|
| `Id` | `SpaceId` | Unique identifier for the space |
| `Name` | `SpaceName` | Human-readable name for the space |
| `Origins` | `HashSet<SpaceOrigin>` | One or more hostnames that route to this space |
| `MatchingPath` | `string?` | Optional URL path prefix for path-based routing |
| `Enabled` | `bool` | Whether the space is active and accepts requests |

Spaces can also carry optional per-tenant storage configuration overrides, allowing individual tenants to use dedicated databases while others share a common store.

## How Tenant Resolution Works

When a request arrives, the `SpaceResolutionMiddleware` resolves the current Space using the `ISpaceResolver` / `DefaultSpaceResolver` implementation. The resolved Space is then stored in `ISpaceContextAccessor` and is available for the lifetime of the request.

Resolution follows this order:

1. **Hostname match**: the request's `Host` header is compared against the `Origins` of all enabled Spaces. The first match wins.
2. **Path prefix match**: if no hostname match is found, the URL path is checked against each Space's `MatchingPath`. This supports path-based multi-tenancy where all tenants share a single hostname (for example, `example.com/tenant-a/...` and `example.com/tenant-b/...`).
3. **Default Space fallback**: if neither match succeeds, the request is routed to the Default Space.

This resolution is fully transparent to application code. All subsequent operations in the request (user lookups, token issuance, session management) are automatically scoped to the resolved Space.

```
Request: https://customer-a.example.com/connect/token
  → SpaceResolutionMiddleware
  → DefaultSpaceResolver: hostname "customer-a.example.com" matches Space "customer-a"
  → ISpaceContextAccessor.CurrentSpace = "customer-a"
  → All repository operations automatically scoped to "customer-a"
```

## Special Spaces

Two reserved Spaces exist in every deployment:

* **`SpaceId.Management`**: used for cross-space administrative operations, such as managing the set of active Spaces. This Space is used internally and is not associated with end-user traffic.
* **`SpaceId.Default`**: the fallback Space for requests that do not match any configured hostname or path prefix. In single-tenant mode, all requests resolve to the Default Space.

Both Spaces are created automatically and cannot be deleted.

## Automatic Storage Isolation

All User Management repository operations are automatically scoped to the current Space. Developers do not need to pass a tenant identifier to any API. The infrastructure handles this transparently via `IStoreFactory.GetStoreAsync(spaceId, category)`, which is called internally by all repositories.

This means that code like the following always operates on the correct tenant's data, regardless of which Space the request resolved to:

```csharp
// This always reads from the current Space's user store.
// No tenant parameter needed. Isolation is automatic.
var user = await _userStore.FindByUsernameAsync(username, cancellationToken);
```

Storage for all Spaces can share a single database (each record is tagged with the Space identifier), or individual Spaces can be configured to use dedicated databases for stricter infrastructure separation.

## Managing Spaces with `ISpaceAdmin`

Spaces are created and managed through the `ISpaceAdmin` service. Inject it into any service or background job that needs to manage tenants:

```csharp
public interface ISpaceAdmin
{
    Task<SaveResult<SpaceId>> CreateAsync(SpaceDto dto, CancellationToken ct);
    Task<GetResult<SpaceDto>> GetAsync(SpaceId id, CancellationToken ct);
    Task<SaveResult<SpaceId>> UpdateAsync(SpaceId id, SpaceDto dto, Version expectedVersion, CancellationToken ct);
    Task<SaveResult<SpaceId>> DeleteAsync(SpaceId id, CancellationToken ct);
    Task<ListResult<SpaceListDto>> QueryAsync(/* filter/paging params */, CancellationToken ct);
}
```

### Creating a Space

Use `ISpaceAdmin.CreateAsync` to provision a new tenant. Provide a name and the hostnames that should route to it:

```csharp
public class TenantProvisioningService
{
    private readonly ISpaceAdmin _spaceAdmin;

    public TenantProvisioningService(ISpaceAdmin spaceAdmin)
    {
        _spaceAdmin = spaceAdmin;
    }

    public async Task ProvisionTenantAsync(string tenantName, string hostname, CancellationToken ct)
    {
        var dto = new SpaceDto
        {
            Name = new SpaceName(tenantName),
            Origins = new HashSet<SpaceOrigin>
            {
                new SpaceOrigin(hostname)
            },
            Enabled = true
        };

        var result = await _spaceAdmin.CreateAsync(dto, ct);

        if (result.IsSuccess)
        {
            var newSpaceId = result.Value;
            // Space is now active. Requests to `hostname` will resolve to this Space.
        }
    }
}
```

### Retrieving a Space

```csharp
var result = await _spaceAdmin.GetAsync(spaceId, ct);

if (result.IsSuccess)
{
    var space = result.Value;
    Console.WriteLine($"Space: {space.Name}, Enabled: {space.Enabled}");
    foreach (var origin in space.Origins)
    {
        Console.WriteLine($"  Origin: {origin}");
    }
}
```

### Updating a Space

Updates use optimistic concurrency via an `expectedVersion` parameter. Retrieve the current version from `GetAsync` before updating:

```csharp
var getResult = await _spaceAdmin.GetAsync(spaceId, ct);
if (!getResult.IsSuccess) return;

var space = getResult.Value;

// Add a new hostname to an existing Space
space.Origins.Add(new SpaceOrigin("customer-a-alias.example.com"));

var updateResult = await _spaceAdmin.UpdateAsync(
    spaceId,
    space,
    expectedVersion: getResult.Version,
    ct);
```

### Disabling a Space

To temporarily suspend a tenant without deleting it, set `Enabled = false`:

```csharp
var getResult = await _spaceAdmin.GetAsync(spaceId, ct);
var space = getResult.Value;
space.Enabled = false;

await _spaceAdmin.UpdateAsync(spaceId, space, getResult.Version, ct);
// Requests to this Space's hostnames will no longer be routed to it.
```

### Deleting a Space

```csharp
var result = await _spaceAdmin.DeleteAsync(spaceId, ct);
```

:::caution
Deleting a Space is permanent. All data associated with the Space (users, sessions, configuration) is removed. Ensure you have taken appropriate backups or confirmed the deletion with the tenant before proceeding.
:::

### Listing Spaces

```csharp
var result = await _spaceAdmin.QueryAsync(/* filter/paging */, ct);

foreach (var space in result.Items)
{
    Console.WriteLine($"{space.Id}: {space.Name}");
}
```

## When to Use Multi-Tenancy

Multi-tenancy is the right choice when you need to serve multiple distinct customer environments from a single deployment. Common scenarios include:

* **SaaS platforms**: A software-as-a-service product where each customer organization requires its own isolated identity environment, including separate user accounts and configuration.
* **Multiple isolated environments**: Situations where different business units, brands, or product lines need independent identity stores but share underlying infrastructure.
* **Subdomain-per-customer architectures**: Deployments where each customer is accessed via a dedicated hostname (for example, `customer-a.example.com` and `customer-b.example.com`), and each hostname should resolve to a distinct identity environment.
* **Path-based tenancy**: Deployments where a single hostname serves multiple tenants distinguished by URL path prefix (for example, `example.com/tenant-a/` and `example.com/tenant-b/`).

If you only serve a single customer or a single unified user population, single-tenant mode is simpler and sufficient.

## High-Level Setup

Enabling multi-tenancy is a single step during application configuration. Once enabled, the infrastructure for tenant resolution, scoped storage, and tenant management becomes available.

Tenants are then created and managed through the `ISpaceAdmin` API, which lets you define tenant names and associate them with one or more origin hostnames. After a Space is created, its identity resources, API scopes, and other configuration are set up independently within that tenant's context.

Storage for all Spaces can share a single database. Each record is automatically tagged with the Space identifier, ensuring complete data isolation without requiring separate database instances per tenant. Dedicated per-tenant databases are also supported for scenarios where stricter infrastructure separation is required.
