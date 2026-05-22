---
title: Attribute Groups and Ordering
description: How to organize user profile attributes into groups and control their display order using IUserProfileSchemaAdmin in Duende User Management.
date: 2026-05-15
sidebar:
  label: Attribute Groups
  order: 2
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

These properties are set when constructing an `AttributeDefinition` and can be updated by removing and re-adding the definition, or by calling `ReorderAttributesAsync` to adjust ordering without recreating definitions.

## Managing Groups with `IUserProfileSchemaAdmin`

`IUserProfileSchemaAdmin` exposes five methods for working with groups and ordering.

```csharp
// IUserProfileSchemaAdmin.cs
// Get all groups
Task<IReadOnlyDictionary<AttributeGroupCode, AttributeGroup>> GetAllGroupsAsync(Ct ct);

// Add a group
Task<bool> TryAddGroupAsync(AttributeGroup group, Ct ct);

// Remove a group
Task<bool> TryRemoveGroupAsync(AttributeGroupCode name, Ct ct);

// Reorder attributes within a group (pass null for ungrouped attributes)
Task<bool> ReorderAttributesAsync(AttributeGroupCode? group, IReadOnlyList<AttributeCode> orderedCodes, Ct ct);

// Reorder groups
Task<bool> ReorderGroupsAsync(IReadOnlyList<AttributeGroupCode> orderedGroups, Ct ct);
```

* `GetAllGroupsAsync`: Returns all registered groups as a dictionary keyed by `AttributeGroupCode`. Returns an empty dictionary when no groups have been defined.
* `TryAddGroupAsync`: Registers a new group. Returns `true` on success and `false` if a group with the same code already exists.
* `TryRemoveGroupAsync`: Removes a group by code. Attributes that belonged to the removed group become ungrouped. Returns `true` whether or not the group existed.
* `ReorderAttributesAsync`: Reassigns the `Order` values of attributes within the specified group based on the supplied list. Pass `null` as the group to reorder ungrouped attributes. Attributes not included in the list keep their current order and are appended after the listed ones.
* `ReorderGroupsAsync`: Reassigns the `Order` values of groups based on the supplied list. Groups not included in the list keep their current order and are appended after the listed ones.

## Setting Up Groups

The following example creates a group, adds attributes to it, and then reorders those attributes.

```csharp
// attribute-groups-setup.cs
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement.Profiles;

// Create a group
var group = new AttributeGroup(
    Code: AttributeGroupCode.Create("personal-info"),
    DisplayName: AttributeDisplayName.Create("Personal Information"),
    Description: null,
    Order: 0);

await schemaAdmin.TryAddGroupAsync(group, ct);

// Add attributes to the group
var givenName = new AttributeDefinition
{
    Code = AttributeCode.Create("given_name"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    GroupCode = AttributeGroupCode.Create("personal-info"),
    Order = 0
};

var familyName = new AttributeDefinition
{
    Code = AttributeCode.Create("family_name"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    GroupCode = AttributeGroupCode.Create("personal-info"),
    Order = 1
};

await schemaAdmin.TryAddAttributeDefinitionAsync(givenName, ct);
await schemaAdmin.TryAddAttributeDefinitionAsync(familyName, ct);

// Reorder attributes within the group
await schemaAdmin.ReorderAttributesAsync(
    AttributeGroupCode.Create("personal-info"),
    [AttributeCode.Create("family_name"), AttributeCode.Create("given_name")],
    ct);
```

After the `ReorderAttributesAsync` call, `family_name` will have `Order: 0` and `given_name` will have `Order: 1`,
so when you build a UI you can use the field ordering and have family name appear before given name.

## Notes on Ordering

`Order` values do not need to be unique. When two attributes share the same `Order` value, the system applies a stable secondary sort to produce a consistent result.

`ReorderAttributesAsync` reassigns order values starting from `0` based on the position of each code in the supplied list. Attributes not included in the list keep their existing order values and are placed after all listed attributes.

Passing `null` as the group to `ReorderAttributesAsync` targets ungrouped attributes, that is, attributes whose `GroupCode` is `null`.

The same rules apply to `ReorderGroupsAsync`: groups not in the supplied list are appended after the listed ones in their existing relative order.
