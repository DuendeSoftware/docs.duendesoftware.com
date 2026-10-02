---
title: "Data Extension Schemas"
description: "Define and validate custom properties on IdentityServer clients, resources and identity providers using Duende Storage data extension schemas"
date: 2026-09-01
sidebar:
  label: "Schemas"
  order: 40
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

Data extension schemas let you add typed properties to configuration entities without changing the Duende storage
database schema. Values remain part of the entity, while schema metadata defines their type, validation, queryability and
display information.

IdentityServer supports extensions on:

* Clients
* API resources
* API scopes
* Identity resources
* Dynamic identity providers
* SAML service providers

:::note[SAML Service Provider Extensions Are Admin-Only]
SAML service provider extended properties are validated, stored and returned through `ISamlServiceProviderAdmin`, but
they are not projected onto the runtime `SamlServiceProvider` model returned by `ISamlServiceProviderStore`. This is a
deliberate difference from the other configuration types: SAML service providers had no existing runtime `Properties`
dictionary or backward-compatibility contract to preserve. Use these extensions as administration metadata, not as input
to SAML protocol processing.
:::

## In-Memory Or Storage-Backed Schemas

| Schema Store   | Choose It When                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| In-memory      | Schema definitions live with application code, change through deployments and must be identical on every node. |
| Storage-backed | An administration system must create or change schemas at runtime without redeploying IdentityServer.           |

In-memory schemas are often the safer starting point. They keep schema changes in source control and release review, while
configuration values can still be managed dynamically through the
[admin APIs](/identityserver/data/providers/duende-storage/admin-apis.md).

Storage-backed schemas register `ISchemaAdmin` as well as `ISchemaStore`. They are more dynamic, but your administration
system must coordinate schema compatibility with all running application versions. Use
`AddDynamicSchemas()` when you intentionally need that model. Pass a `StorageInstanceId` to
`AddDynamicSchemas(storageInstanceId)` to store schemas in a non-default instance; see
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md).

`AddInMemoryDataExtensionSchemas` only registers the `SchemaConfiguration` instances you pass as singletons; it does not
register `ISchemaStore` or `ISchemaAdmin`, and has no effect when `AddDynamicSchemas()` is used instead.

## Built-in Schemas

Several IdentityServer and User Management features register their own default schema for a well-known `SchemaId`:

| Feature                  | `SchemaId`                       | Default schema                | Registered by               |
| ------------------------- | --------------------------------- | ------------------------------ | ---------------------------- |
| OIDC dynamic providers     | `SchemaId.OidcIdentityProvider` (`"idp:oidc"`) | `BuiltInSchemas.OidcProvider`   | `AddOidcDynamicProvider()`   |
| SAML dynamic providers     | `SchemaId.SamlIdentityProvider` (`"idp:saml"`) | `BuiltInSchemas.SamlProvider`   | `AddSamlDynamicProvider()`   |
| User Management profiles   | `SchemaId.UserProfile`             | `BuiltInSchemas.UserProfile`    | `AddUserManagement(...)`        |

Custom dynamic identity provider types use `SchemaId.BuildIdentityProviderId(type)` instead.

Each of `BuiltInSchemas.OidcProvider`, `BuiltInSchemas.SamlProvider`, and `BuiltInSchemas.UserProfile` returns a new, mutable
`SchemaConfiguration` instance on every access, so you can derive from it without affecting the registered default. For the
user profile schema, including which attributes it defines by default, see
[User Profiles — the built-in profile schema](/identityserver/identity/user-management/fundamentals/profiles.md#the-built-in-profile-schema).

### Extending a Built-in Schema

Use `SchemaConfigurationExtensions.Extend` to add attributes (and optionally groups) to a built-in schema, then register the
result as an in-memory schema:

```csharp
// Program.cs
using Duende.Storage.EntityAttributeValue;
using Duende.IdentityServer.Stores.Storage;
using Duende.IdentityServer.Stores.Storage.IdentityProviders;

var region = new TypedAttributeDefinition<string>(
    AttributeCode.Create("region"),
    new ScalarAttributeType(ScalarDataType.String));

builder.Services
    .AddIdentityServer()
    .AddOidcDynamicProvider()
    .AddInMemoryDataExtensionSchemas([BuiltInSchemas.OidcProvider.Extend(region)]);
```

`Extend` throws `InvalidOperationException` if an attribute or group code you pass already exists on the schema. To change
an existing attribute or group instead of adding a new one, register a full replacement schema (see below).

### Replacing a Built-in Schema

Register a full `SchemaConfiguration` that reuses the same `SchemaId` to replace a built-in schema entirely:

```csharp
using Duende.IdentityServer.Stores.Storage;
using Duende.Storage.EntityAttributeValue;

builder.Services
    .AddIdentityServer()
    .AddOidcDynamicProvider()
    .AddInMemoryDataExtensionSchemas([new SchemaConfiguration
    {
        SchemaId = SchemaId.OidcIdentityProvider,
        AttributeDefinitions = [/* your own set, none of the built-in attributes are kept implicitly */]
    }]);
```

A schema you register for the same `SchemaId` as a built-in always wins over the built-in, and registration order relative
to the feature's `Add...` call (`AddOidcDynamicProvider()`, `AddSamlDynamicProvider()`, `AddUserManagement(...)`) does not
matter. If more than one schema is registered for the same `SchemaId`, the one registered last wins.

:::caution[SAML dynamic providers require AddSamlDynamicProvider() for idp:saml attributes]
Creating a SAML identity provider with `ExtendedProperties` that use the `idp:saml` schema (`SchemaId.SamlIdentityProvider`)
now requires calling `AddSamlDynamicProvider()`. It registers the `BuiltInSchemas.SamlProvider` default with the in-memory
schema store that `AddStorage` sets up, in addition to the SAML SP authentication handler; without it, the schema used to
validate those extended properties is not registered. The same applies to OIDC dynamic provider extended properties and
`AddOidcDynamicProvider()`.

This in-memory registration only takes effect for the default, `AddStorage`-provided schema store. When you call
`AddDynamicSchemas()`, `ISchemaStore` and `ISchemaAdmin` resolve to the storage-backed implementation instead, and the
in-memory `idp:oidc`/`idp:saml` schemas registered by `AddOidcDynamicProvider()`/`AddSamlDynamicProvider()` are not used.
In that mode, create the schema in the database yourself, for example:

```csharp
using Duende.IdentityServer.Stores.Storage.IdentityProviders;
using Duende.Storage.EntityAttributeValue;

var result = await schemaAdmin.CreateAsync(BuiltInSchemas.SamlProvider, CancellationToken.None);

if (!result.IsSuccess)
{
    throw new InvalidOperationException(string.Join("; ", result.Errors));
}
```

See [Dynamic Providers — SAML Providers](/identityserver/ui/login/dynamicproviders.md#saml-providers).
:::

## Define a Schema

Define typed attributes once and reuse those definitions when assigning values:

```csharp
// ClientDataExtensions.cs
using Duende.IdentityServer.Stores.Storage;
using Duende.Storage.EntityAttributeValue;

public static class ClientDataExtensions
{
    public static readonly TypedAttributeDefinition<string> Department =
        new(
            AttributeCode.Create("department"),
            new ScalarAttributeType(ScalarDataType.String));

    public static readonly TypedAttributeDefinition<int> CostCenter =
        new(
            AttributeCode.Create("cost_center"),
            new ScalarAttributeType(ScalarDataType.Integer));

    public static readonly SchemaConfiguration Schema = new()
    {
        SchemaId = SchemaId.Client,
        DisplayName = "Client extensions",
        Description = "Organization data attached to clients.",
        AttributeDefinitions = [Department, CostCenter]
    };
}
```

`SchemaId.Client`, `SchemaId.ApiResource`, `SchemaId.ApiScope`, `SchemaId.IdentityResource` and
`SchemaId.SamlServiceProvider` select the entity type to extend. Dynamic identity providers use `SchemaId.OidcIdentityProvider`
and `SchemaId.SamlIdentityProvider` (or, for a custom provider type, `SchemaId.BuildIdentityProviderId(type)`) — see
[Built-in Schemas](#built-in-schemas) below. Only register one schema for each ID.

## Register an In-Memory Schema

Register the schema when configuring IdentityServer:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddSqlite(/* ... */))
    .AddInMemoryDataExtensionSchemas(
        [ClientDataExtensions.Schema]);
```

## Create a Storage-Backed Schema

First configure a database provider and run `IStorageInstanceSchema.MigrateAsync` as described in
[Getting Started](/identityserver/data/providers/duende-storage/getting-started.md#register-duende-storage).
Then register the storage-backed schema services:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddSqlite(/* ... */))
    .AddDynamicSchemas();

// ...

await app.Services
    .GetRequiredService<IStorageInstanceSchema>()
    .MigrateAsync(CancellationToken.None);
```

After the database migration has completed, provision the schema through `ISchemaAdmin`:

```csharp
// Program.cs
using Duende.Storage.EntityAttributeValue;

var schemaAdmin = app.Services.GetRequiredService<ISchemaAdmin>();
var schemaId = ClientDataExtensions.Schema.SchemaId;

var existing = await schemaAdmin.GetAsync(
    schemaId,
    CancellationToken.None);

if (!existing.Found)
{
    var created = await schemaAdmin.CreateAsync(
        ClientDataExtensions.Schema,
        CancellationToken.None);

    if (!created.IsSuccess)
    {
        throw new InvalidOperationException(
            string.Join("; ", created.Errors));
    }
}
```

This example bootstraps an initial definition from code. After that, an administration system can create or update schemas
at runtime through `ISchemaAdmin` without redeploying IdentityServer.

Data extension schemas are records in Duende Storage, not new relational tables. Creating or updating one does not require
a new SQL migration after the common database schema is initialized. Run provisioning from one deployment process to
avoid concurrent instances racing between the get and create operations.

To change a schema, get its current definition and pass the returned version to `ISchemaAdmin.UpdateAsync`. The version
enforces optimistic concurrency. Expose schema administration only through an authenticated, authorized and audited
management path.

## Set Extended Properties

Use the same typed definitions to add values to an administration model:

```csharp
// ConfigurationAdmin.cs
using Duende.IdentityServer.Admin.Clients;
using Duende.Storage.EntityAttributeValue;

var extensions = new AttributeValueCollection();
extensions.Set(ClientDataExtensions.Department, "Sales");
extensions.Set(ClientDataExtensions.CostCenter, 4100);

var client = new CreateClient
{
    ClientId = "sales-dashboard",
    AllowedGrantTypes = ["client_credentials"],
    ExtendedProperties = extensions
};

var result = await clientAdmin.CreateAsync(client, ct);
```

The admin API rejects unknown properties, values of the wrong type, missing required properties and duplicate values for
attributes marked as unique. Set `IsQueryable` only for values that your administration experience must filter or sort;
queryable fields require additional database indexing and storage.

Treat schema changes like contract changes. Adding an optional property is usually compatible. Renaming or removing a
property, changing its type or making it required can invalidate existing entities and older application versions.
