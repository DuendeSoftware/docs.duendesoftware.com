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
`AddStorageDataExtensionSchemas()` when you intentionally need that model.

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
`SchemaId.SamlServiceProvider` select the entity type to extend. Dynamic identity providers use a type-specific ID, such
as `SchemaId.IdentityProvider("oidc")`. Only register one schema for each ID.

## Register an In-Memory Schema

Register the schema when configuring IdentityServer:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddConfigurationStorage()
    .AddInMemoryDataExtensionSchemas(
        [ClientDataExtensions.Schema]);
```

## Create a Storage-Backed Schema

First configure a database provider and run `IDatabaseSchema.MigrateAsync` as described in
[Configuration Storage](/identityserver/data/providers/duende-storage/configuration-storage.md#register-duende-storage-for-configuration-data).
Then register the storage-backed schema services:

```csharp
// Program.cs
builder.Services
    .AddIdentityServer()
    .AddConfigurationStorage()
    .AddStorageDataExtensionSchemas();

// ...

await app.Services
    .GetRequiredService<IDatabaseSchema>()
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
