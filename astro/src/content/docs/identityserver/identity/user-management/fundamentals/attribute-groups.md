---
title: Attribute Groups and Ordering
description: How to organize user profile attributes into groups and control their display order in Duende User Management.
date: 2026-05-15
sidebar:
  label: Attribute Groups
  order: 2
redirect_from:
  - /identityserver/usermanagement/fundamentals/attribute-groups/
---

When a schema contains many attributes, displaying them as a flat list quickly becomes hard to navigate.
Attribute groups let you organize attributes into named sections and control the order in which both groups and individual attributes appear. 
This is especially useful when building your own admin UIs or profile editors that need to present attributes in a structured, logical way.

## Types

### `AttributeGroup`

An `AttributeGroup` represents a named section that attributes can be assigned to.

```csharp
// attribute-group-type.cs
public sealed record AttributeGroup(
    AttributeGroupCode Code,
    AttributeDisplayName? DisplayName,
    AttributeDescription? Description,
    int Order);
```

* `Code`: The unique identifier for the group. See [`AttributeGroupCode`](#attributegroupcode) below.
* `DisplayName`: Optional human-readable label you can show in UIs instead of the raw code.
* `Description`: Optional description of what the group contains.
* `Order`: Sort weight controlling the position of this group relative to other groups. Lower values appear first.

### `AttributeGroupCode`

`AttributeGroupCode` is a string-based identifier for a group. Valid characters are alphanumeric, dashes, and underscores. Comparison is case-insensitive.

Create an `AttributeGroupCode` using the static `Create` method:

```csharp
// attribute-group-code.cs
var code = AttributeGroupCode.Create("personal-info");
```

### `AttributeDefinition` group properties

Two properties on `AttributeDefinition` control how an attribute is placed within the group structure:

* `AttributeGroupCode? GroupCode`: The group this attribute belongs to. `null` means the attribute is ungrouped and appears outside any group section.
* `int Order`: Sort weight controlling the display position of this attribute within its group (or among ungrouped attributes). Lower values appear first.

These properties are set when constructing an `AttributeDefinition`. To change them, build a new `SchemaConfiguration` (or modify one read via `ISchemaAdmin`) with the updated definitions — there is no dedicated reorder operation. See [Schema management](/identityserver/identity/user-management/fundamentals/profiles.md#schema-management) for the `Extend` and get-modify-save patterns.

## Managing Groups

Groups are part of the `SchemaConfiguration.Groups` collection, alongside `AttributeDefinitions`. There is no dedicated API for adding, removing or reordering groups and attributes — you build the `ICollection<AttributeGroup>` and set each `AttributeDefinition.GroupCode`/`Order` as part of the schema you register, the same way you manage any other part of the schema:

* For an in-memory schema, include the groups and ordered definitions when you call `BuiltInSchemas.UserProfile.Extend(attributes, groups)` or construct a full `SchemaConfiguration`, and register it with `AddInMemoryDataExtensionSchemas`.
* For a storage-backed schema, use the `ISchemaAdmin` get-modify-save pattern: read the current `SchemaConfiguration`, add to or reorder its `Groups` and `AttributeDefinitions` collections, then call `UpdateAsync` with the version from the read.

## Setting Up Groups

The following example extends the built-in user profile with a `personal-info` group and two attributes assigned to it, in a chosen order.

```csharp
// attribute-groups-setup.cs
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement.Profiles;

var personalInfo = new AttributeGroup(
    Code: AttributeGroupCode.Create("personal-info"),
    DisplayName: AttributeDisplayName.Create("Personal Information"),
    Description: null,
    Order: 0);

var givenName = new AttributeDefinition
{
    Code = AttributeCode.Create("given_name_2"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    GroupCode = personalInfo.Code,
    Order = 1
};

var familyName = new AttributeDefinition
{
    Code = AttributeCode.Create("family_name_2"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    GroupCode = personalInfo.Code,
    Order = 0
};

var extended = BuiltInSchemas.UserProfile.Extend([givenName, familyName], [personalInfo]);
```

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer()
    .AddUserManagement(_ => { })
    .AddInMemoryDataExtensionSchemas([extended]);
```

Because `familyName.Order` (`0`) is lower than `givenName.Order` (`1`), a UI that reads `schema.AttributeDefinitions` ordered by `Order` within the `personal-info` group renders family name before given name.

To change ordering later for a storage-backed schema, read the schema with `ISchemaAdmin.GetAsync`, update the `Order` values on the definitions or groups you want to move, and call `UpdateAsync` with the returned version:

```csharp
var getResult = await schemaAdmin.GetAsync(SchemaId.UserProfile, ct);
if (getResult.Found)
{
    var schema = getResult.Item;
    foreach (var definition in schema.AttributeDefinitions)
    {
        if (definition.Code == AttributeCode.Create("given_name_2"))
        {
            // AttributeDefinition is a record; replace it in the collection with an updated copy.
            schema.AttributeDefinitions.Remove(definition);
            schema.AttributeDefinitions.Add(definition with { Order = 0 });
            break;
        }
    }

    await schemaAdmin.UpdateAsync(SchemaId.UserProfile, schema, getResult.Version!, ct);
}
```

## Notes on Ordering

`Order` values do not need to be unique. When two attributes share the same `Order` value, apply your own stable secondary sort (for example, by code) when rendering a UI.

Removing a group from the schema does not fail if attributes still reference it by `GroupCode` — treat that as an application-level validation concern when you build the replacement schema: either reassign those attributes' `GroupCode` to `null` or to another existing group before removing the group, so you don't end up with attributes pointing at a group that no longer exists.
