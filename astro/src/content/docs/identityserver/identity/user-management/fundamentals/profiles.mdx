---
title: User Profiles and Attributes
description: "Store, retrieve, and manage user profile attributes in Duende User Management using IUserProfileSelfServic, IUserProfileAdmin, and the BuiltInSchemas.UserProfile and profile administration APIs."
date: 2026-05-19
sidebar:
  label: User Profiles and Attributes
  order: 1
redirect_from:
  - /identityserver/usermanagement/fundamentals/profiles/
---

User Management provides a flexible, schema-driven profile system that lets you attach typed attributes to every user. The design follows an **Entity-Attribute-Value (EAV)** model: instead of extending a base class or adding columns to a table, you define attributes in a schema at runtime and store values against individual user profiles.

`UserProfile` is a **sealed record** that cannot be subclassed. There is exactly one `UserProfile` type in the system:

```csharp
public sealed record UserProfile
{
    public UserSubjectId SubjectId { get; }
    public IReadOnlyDictionary<AttributeCode, AttributeValue> Attributes { get; }
}
```

All extensibility happens through the `Attributes` dictionary. You define which attributes exist by registering a schema (a `SchemaConfiguration`); the system then validates values against that schema at write time.

The system exposes two interfaces covering different access levels: self-service operations performed by the authenticated user, and administrative operations performed by back-end code. Schema management — defining which attributes exist — is a separate concern, covered in [Schema management](#schema-management) below.

### Where to use these interfaces

Both interfaces are registered with the service provider by `AddUserManagement(...)` and can be injected anywhere in your application:

* **Razor Pages**: inject into page models to read or update the current user's profile.
* **MVC controllers**: inject into controllers for profile endpoints.
* **Backend services / hosted services**: inject into `IHostedService` implementations for background provisioning or migration tasks.
* **Seed scripts / startup code**: register a schema with `AddInMemoryDataExtensionSchemas()` at startup, or, when using [storage-backed schemas](/identityserver/data/providers/duende-storage/schemas.md), inject `ISchemaAdmin` into an `IHostedService` to create or update the schema before the application starts serving requests.

## Registration

Call `AddUserManagement(...)` on the IdentityServer builder to register the profile services:

```csharp title="Program.cs"
using Duende.IdentityServer;
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(_ => { });
```

This makes `IUserProfileSelfService` and `IUserProfileAdmin` available for injection. You can also access them as properties on `IUserSelfService.Profiles` and `IUserAdmin.Profiles` respectively (see [User Lifecycle](/identityserver/identity/user-management/fundamentals/user-lifecycle.md)). `AddUserManagement(...)` also registers the default profile schema, `BuiltInSchemas.UserProfile`; see [Schema management](#schema-management) below. Schema *administration* at runtime (`ISchemaAdmin`) is separate and requires `AddDynamicSchemas()` — see below.

## Schema management

Before storing attributes you must define them in the schema. The schema is a `SchemaConfiguration` — a `SchemaId`, display metadata, and a collection of `AttributeDefinition`s (and optional `AttributeGroup`s) that describes every attribute the system accepts, its data type, and optional uniqueness constraints. Schema configuration is shared with the rest of the platform; see [Data Extension Schemas](/identityserver/data/providers/duende-storage/schemas.md) for the underlying model, `ISchemaAdmin`, and in-memory vs. storage-backed tradeoffs.

### The built-in profile schema

`AddUserManagement(...)` registers a default profile schema, `BuiltInSchemas.UserProfile` (from `Duende.UserManagement.Profiles`), for `SchemaId.UserProfile`:

```csharp
// Duende.UserManagement.Profiles.BuiltInSchemasExtensions
public static SchemaConfiguration UserProfile => new()
{
    SchemaId = SchemaId.UserProfile,
    DisplayName = "User Profile",
    AttributeDefinitions =
    [
        OidcStandardAttributes.Email with { IsUnique = true, IsRequired = true },
        OidcStandardAttributes.Name,
        OidcStandardAttributes.GivenName,
        OidcStandardAttributes.FamilyName
    ]
};
```

Each access to `BuiltInSchemas.UserProfile` returns a new instance, so you can safely derive from it without mutating a shared default. With no further configuration, users register and log in by `email` and receive `email`, `name`, `given_name`, and `family_name` attributes.

### Extending the built-in profile

To add attributes to the default profile, derive a new schema with `Extend` and register it with `AddInMemoryDataExtensionSchemas`:

```csharp title="Program.cs"
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement.Profiles;

var department = new AttributeDefinition
{
    Code = AttributeCode.Create("department"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    Description = AttributeDescription.Create("The department the user belongs to.")
};

builder.Services
    .AddIdentityServer()
    .AddUserManagement(_ => { })
    .AddInMemoryDataExtensionSchemas([BuiltInSchemas.UserProfile.Extend(department)]);
```

`Extend` also has an overload that adds attribute groups at the same time:

```csharp
var extended = BuiltInSchemas.UserProfile.Extend([department], [personalInfoGroup]);
```

`Extend` returns a new `SchemaConfiguration` with the same `SchemaId`, `DisplayName`, `Description`, and `Version` as the original, plus the additional attributes and groups. It does not modify `BuiltInSchemas.UserProfile`. It throws `InvalidOperationException` if an attribute code (or group code) you pass already exists on the schema or is repeated in the arguments — register a full replacement schema instead to change an existing attribute or group.

The call to `AddInMemoryDataExtensionSchemas` can come before or after `AddUserManagement(...)`; registration order does not matter. A schema with the same `SchemaId` as a built-in always wins over the built-in, regardless of call order. If you register more than one schema for the same `SchemaId`, the one registered last wins.

### Replacing the built-in profile

To replace the default profile entirely — for example, to log in by a custom attribute instead of `email` — register a full `SchemaConfiguration` that uses `SchemaId.UserProfile`:

```csharp title="Program.cs"
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement.Profiles;

var username = new AttributeDefinition
{
    Code = AttributeCode.Create("username"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    IsUnique = true,
    IsRequired = true
};

builder.Services
    .AddIdentityServer()
    .AddUserManagement(_ => { })
    .AddInMemoryDataExtensionSchemas([new SchemaConfiguration
    {
        SchemaId = SchemaId.UserProfile,
        AttributeDefinitions = [username, department]
    }]);
```

None of the built-in attributes (`email`, `name`, `given_name`, `family_name`) are present unless you add them back explicitly. Replacing the schema is also order-independent relative to `AddUserManagement(...)`.

### Editing the schema at runtime

`AddInMemoryDataExtensionSchemas` only registers schema singletons in memory; it does not provide `ISchemaAdmin`. To create, update, or query the profile schema at runtime, opt in to storage-backed schemas with `AddDynamicSchemas()`:

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer()
    .AddStorage(storage => storage.AddSqlite(/* ... */))
    .AddConfigurationStorage()
    .AddOperationalStorage()
    .AddDynamicSchemas()
    .AddUserManagement(_ => { });
```

:::caution[In-memory schemas are not used in this mode]
With `AddDynamicSchemas()`, in-memory schemas — including `BuiltInSchemas.UserProfile` and anything passed to `AddInMemoryDataExtensionSchemas` — are not used, and the built-in profile is **not** seeded into the database. `ISchemaAdmin.GetAsync(SchemaId.UserProfile, ct)` returns "not found" until you create the schema yourself.
:::

`ISchemaAdmin` (from `Duende.Storage.EntityAttributeValue`) is the interface for managing the schema at runtime:

```csharp
public interface ISchemaAdmin
{
    Task<SaveResult<SchemaId>> CreateAsync(SchemaConfiguration schema, CancellationToken ct);
    Task<GetResult<SchemaConfiguration>> GetAsync(SchemaId schemaId, CancellationToken ct);
    Task<SaveResult<SchemaId>> UpdateAsync(SchemaId schemaId, SchemaConfiguration schema, DataVersion expectedVersion, CancellationToken ct);
    Task<SaveResult<SchemaId>> DeleteAsync(SchemaId schemaId, CancellationToken ct);
    Task<QueryResult<SchemaSummary>> QueryAsync(CancellationToken ct);
}
```

The typical pattern is get-modify-save, using `GetResult<T>.Version` as the `expectedVersion` for optimistic concurrency on update:

```csharp
// SchemaSetup.cs
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement.Profiles;

public class SchemaSetup(ISchemaAdmin schemaAdmin)
{
    public async Task RunAsync(CancellationToken ct)
    {
        var getResult = await schemaAdmin.GetAsync(SchemaId.UserProfile, ct);
        var schema = getResult.Found
            ? getResult.Item
            : BuiltInSchemas.UserProfile;

        schema.AttributeDefinitions.Add(new AttributeDefinition
        {
            Code = AttributeCode.Create("department"),
            AttributeType = new ScalarAttributeType(ScalarDataType.String),
            Description = AttributeDescription.Create("The department the user belongs to.")
        });

        var result = getResult.Found
            ? await schemaAdmin.UpdateAsync(SchemaId.UserProfile, schema, getResult.Version!, ct)
            : await schemaAdmin.CreateAsync(schema, ct);

        if (!result.IsSuccess)
        {
            throw new InvalidOperationException(string.Join("; ", result.Errors));
        }
    }
}
```

Starting from `BuiltInSchemas.UserProfile` when no schema exists yet is a choice, not a requirement — build any `SchemaConfiguration` you want for `SchemaId.UserProfile`.

### `AttributeDefinition`

An `AttributeDefinition` describes a single attribute in the schema.

```csharp
public sealed record AttributeDefinition
{
    public required AttributeCode Code { get; init; }
    public required AttributeType AttributeType { get; init; }
    public AttributeDescription? Description { get; init; }
    public AttributeDisplayName? DisplayName { get; init; }
    public ScalarDataType DataType { get; }   // convenience; throws for non-scalar types
    public bool IsUnique { get; init; }
    public bool IsQueryable { get; init; } = true;
    public bool IsRequired { get; init; }
    public IReadOnlyCollection<string> Tags { get; init; }
    public AttributeGroupCode? GroupCode { get; init; }
    public int Order { get; init; }
}
```

* `Code`: The attribute's identifier. Must start with an ASCII letter, must not end with an underscore, and may only contain ASCII letters, digits, or underscores.
* `AttributeType`: The full type descriptor. Use `ScalarAttributeType`, `ComplexAttributeType`, or `ListAttributeType`.
* `Description`: Human-readable description of the attribute.
* `DisplayName`: Optional human-readable display name for the attribute. When set, UIs can show this instead of the raw code.
* `DataType`: Convenience accessor for scalar types. Throws `InvalidOperationException` for complex or list types.
* `IsUnique`: When `true`, the system enforces that no two profiles share the same value for this attribute. Not supported for complex or list types.
* `IsQueryable`: When `true` (the default), the attribute is indexed and can be searched and filtered. Set to `false` for attributes that are stored but never queried, reducing storage overhead.
* `IsRequired`: When `true`, the attribute must be present in the `AttributeValueCollection` before `Validate()` succeeds. Defaults to `false`.
* `Tags`: Optional string tags for grouping or filtering definitions.
* `GroupCode`: The code of the group this attribute belongs to. `null` means the attribute is ungrouped.
* `Order`: Sort weight within the group. Lower values appear first.

To organize attributes into groups and control their display order, see [Attribute groups and ordering](/identityserver/identity/user-management/fundamentals/attribute-groups.md).

### Attribute Types

Three attribute type descriptors are available:

* **`ScalarAttributeType`**: A single primitive value. Wraps a `ScalarDataType` value.
* **`ComplexAttributeType`**: A nested object with named sub-properties, each with its own `AttributeType`. All sub-properties are optional at write time; unknown sub-properties are rejected.
* **`ListAttributeType`**: An ordered list of elements, each sharing the same `AttributeType`. Lists cannot be nested inside other lists.

### `ScalarDataType`

The `ScalarDataType` enum defines the supported primitive types:

```csharp
public enum ScalarDataType
{
    Boolean,
    Date,
    DateTime,
    Decimal,
    Integer,
    String,
}
```

### Defining Custom Attributes

:::tip[Implicit conversions]
Value objects like `AttributeCode` and `AttributeGroupCode` support implicit conversion from `string`, so you can write `AttributeCode code = "department"` instead of `AttributeCode.Create("department")`. The examples in this documentation use the explicit `Create` method for clarity.
:::

The following example defines a custom `department` string attribute and a unique `employee_id` integer attribute. Add them to the schema either at compile time with `Extend` (see [Extending the built-in profile](#extending-the-built-in-profile)), or at runtime through the `ISchemaAdmin` get-modify-save pattern shown above:

```csharp
using Duende.Storage.EntityAttributeValue;

var department = new AttributeDefinition
{
    Code = AttributeCode.Create("department"),
    AttributeType = new ScalarAttributeType(ScalarDataType.String),
    Description = AttributeDescription.Create("The department the user belongs to.")
};

var employeeId = new AttributeDefinition
{
    Code = AttributeCode.Create("employee_id"),
    AttributeType = new ScalarAttributeType(ScalarDataType.Integer),
    Description = AttributeDescription.Create("The unique employee identifier."),
    IsUnique = true
};

// Compile-time: builder.AddInMemoryDataExtensionSchemas([BuiltInSchemas.UserProfile.Extend(department, employeeId)]);
// Runtime: add both to schema.AttributeDefinitions in the get-modify-save pattern, then Update/CreateAsync.
```

### Defining Complex Attributes

Use `ComplexAttributeType` to model structured values such as an address:

```csharp
var addressType = new ComplexAttributeType(
    new Dictionary<AttributeCode, ComplexAttributeProperty>
    {
        [AttributeCode.Create("street")]  = ComplexAttributeProperty.Of(ScalarDataType.String),
        [AttributeCode.Create("city")]    = ComplexAttributeProperty.Of(ScalarDataType.String),
        [AttributeCode.Create("country")] = ComplexAttributeProperty.Of(ScalarDataType.String),
    });

var address = new AttributeDefinition
{
    Code = AttributeCode.Create("address"),
    AttributeType = addressType,
    Description = AttributeDescription.Create("The user's postal address.")
};

// Add to the schema with Extend(address) or via ISchemaAdmin, as shown above.
```

Complex types can be nested. For example, an address with a geo-location sub-object:

```csharp
var addressWithGeo = new ComplexAttributeType(
    new Dictionary<AttributeCode, ComplexAttributeProperty>
    {
        [AttributeCode.Create("city")] = ComplexAttributeProperty.Of(ScalarDataType.String),
        [AttributeCode.Create("geo")]  = ComplexAttributeProperty.Of(
            new ComplexAttributeType(new Dictionary<AttributeCode, ComplexAttributeProperty>
            {
                [AttributeCode.Create("lat")] = ComplexAttributeProperty.Of(ScalarDataType.Decimal),
                [AttributeCode.Create("lng")] = ComplexAttributeProperty.Of(ScalarDataType.Decimal),
            })),
    });
```

### Defining List Attributes

Use `ListAttributeType` to model multi-value attributes. The element type can be a scalar or a complex type.

A list of strings (e.g., tags):

```csharp
var tags = new AttributeDefinition
{
    Code = AttributeCode.Create("tags"),
    AttributeType = new ListAttributeType(new ScalarAttributeType(ScalarDataType.String)),
    Description = AttributeDescription.Create("User tags.")
};

// Add to the schema with Extend(tags) or via ISchemaAdmin, as shown above.
```

A list of complex objects (e.g., phone numbers with type and number):

```csharp
var phoneNumbers = new AttributeDefinition
{
    Code = AttributeCode.Create("phone_numbers"),
    AttributeType = new ListAttributeType(new ComplexAttributeType(
        new Dictionary<AttributeCode, ComplexAttributeProperty>
        {
            [AttributeCode.Create("type")]   = ComplexAttributeProperty.Of(ScalarDataType.String),
            [AttributeCode.Create("number")] = ComplexAttributeProperty.Of(ScalarDataType.String),
        })),
    Description = AttributeDescription.Create("Phone numbers for the user.")
};

// Add to the schema with Extend(phoneNumbers) or via ISchemaAdmin, as shown above.
```

### Setting Complex and List Values

Once the schema is defined, use the `Set` overloads on `AttributeValueCollection` that accept `IReadOnlyDictionary<string, object>` (for complex) or `IReadOnlyList<object>` (for list) values.

#### Complex attribute

```csharp
var schema = await selfService.GetSchemaAsync(ct);
var attributes = new AttributeValueCollection(schema);

attributes.Set(
    AttributeCode.Create("address"),
    (IReadOnlyDictionary<string, object>)new Dictionary<string, object>
    {
        ["street"] = "123 Main St",
        ["city"] = "Seattle",
        ["country"] = "US"
    });

var profile = await selfService.TryCreateAsync(subjectId, attributes.Validate(), ct);
```

For nested complex types, nest dictionaries:

```csharp
attributes.Set(
    AttributeCode.Create("address"),
    (IReadOnlyDictionary<string, object>)new Dictionary<string, object>
    {
        ["city"] = "Seattle",
        ["geo"] = new Dictionary<string, object> { ["lat"] = 47.6m, ["lng"] = -122.3m }
    });
```

#### List of scalars

```csharp
attributes.Set(
    AttributeCode.Create("tags"),
    (IReadOnlyList<object>)new List<object> { "admin", "power-user" });
```

#### List of complex objects

```csharp
attributes.Set(
    AttributeCode.Create("phone_numbers"),
    (IReadOnlyList<object>)new List<object>
    {
        new Dictionary<string, object> { ["type"] = "mobile", ["number"] = "555-0001" },
        new Dictionary<string, object> { ["type"] = "home", ["number"] = "555-0002" },
    });
```

### Reading Complex and List Values

When you read a profile back, complex attributes are returned as `IReadOnlyDictionary<string, object>` and list attributes as `IReadOnlyList<object>`. Cast the value from the `Attributes` dictionary:

```csharp
var profile = await selfService.TryGetAsync(subjectId, ct);

// Complex attribute
var address = (IReadOnlyDictionary<string, object>)profile!.Attributes[AttributeCode.Create("address")].UntypedValue;
Console.WriteLine(address["city"]); // "Seattle"

// List attribute
var phones = (IReadOnlyList<object>)profile.Attributes[AttributeCode.Create("phone_numbers")].UntypedValue;
foreach (var item in phones)
{
    var phone = (IReadOnlyDictionary<string, object>)item;
    Console.WriteLine($"{phone["type"]}: {phone["number"]}");
}
```

### Updating an Attribute

To update an existing attribute value, you must read the profile back first. You can then create a new `AttributeValueCollection` from the `profile.Attributes.Values` collection, and make updates atributes.
Make sure to store the updated attribute values using `IProfileSelfService.TryUpdateAsync()`.

```csharp
if (await profileSelfService.TryGetAsync(subjectId, HttpContext.RequestAborted) is { } profile)
{
    // Pass in profile.Attributes.Values to build an updated AttributeValueCollection
    var updatedAttributes = new AttributeValueCollection(profile.Schema, profile.Attributes.Values);
    updatedAttributes.Set(AttributeCode.Create("given_name"), givenName);
    updatedAttributes.Set(AttributeCode.Create("department"), department);

    // Validate AttributeValueCollection
    if (!updatedAttributes.TryValidate(out var validatedUpdatedAttributes, out var errors))
    {
        // handle validation errors
    }

    // Store AttributeValueCollection
    if (await profileSelfService.TryUpdateAsync(profile.SubjectId, validatedUpdatedAttributes!, HttpContext.RequestAborted) is null)
    {
        // handle errors updating profile
    }
}
```

### Removing an Attribute

Removing an attribute means registering a schema without it. With in-memory schemas, build the replacement `SchemaConfiguration` yourself (see [Replacing the built-in profile](#replacing-the-built-in-profile)) and omit the attribute. With storage-backed schemas, use the get-modify-save pattern and remove the definition from the `ICollection<AttributeDefinition>` before calling `UpdateAsync`:

```csharp
var getResult = await schemaAdmin.GetAsync(SchemaId.UserProfile, ct);
if (getResult.Found)
{
    var schema = getResult.Item;
    var toRemove = schema.AttributeDefinitions.Single(a => a.Code == AttributeCode.Create("department"));
    schema.AttributeDefinitions.Remove(toRemove);

    await schemaAdmin.UpdateAsync(SchemaId.UserProfile, schema, getResult.Version!, ct);
}
```

Removing a definition does **not** purge existing attribute values from stored profiles — values are not validated against the schema on read, only on write.

### Inspecting the Schema

```csharp
var getResult = await schemaAdmin.GetAsync(SchemaId.UserProfile, ct);

if (getResult.Found)
{
    foreach (var definition in getResult.Item.AttributeDefinitions)
    {
        Console.WriteLine($"{definition.Code}: {definition.Description}");
    }
}
```

At runtime, `IUserProfileSelfService.GetSchemaAsync` and `IUserProfileAdmin.GetSchemaAsync` return the effective `IReadOnlyAttributeSchema` (see [Data Types](#data-types) below) rather than the raw `SchemaConfiguration`.

## OIDC Standard Attributes

`OidcStandardAttributes` is a static class that provides pre-built `AttributeDefinition` instances for the standard OpenID Connect profile claims. Use these to add well-known claims to the schema without constructing definitions by hand.

```csharp
public static class OidcStandardAttributes
{
    public static readonly AttributeDefinition Name;
    public static readonly AttributeDefinition GivenName;
    public static readonly AttributeDefinition FamilyName;
    public static readonly AttributeDefinition MiddleName;
    public static readonly AttributeDefinition Nickname;
    public static readonly AttributeDefinition PreferredUserName;
    public static readonly AttributeDefinition Profile;
    public static readonly AttributeDefinition Picture;
    public static readonly AttributeDefinition Website;
    public static readonly AttributeDefinition Email;
    public static readonly AttributeDefinition EmailVerified;
    public static readonly AttributeDefinition Gender;
    public static readonly AttributeDefinition Birthdate;
    public static readonly AttributeDefinition Zoneinfo;
    public static readonly AttributeDefinition Locale;
    public static readonly AttributeDefinition PhoneNumber;
    public static readonly AttributeDefinition PhoneNumberVerified;
    public static readonly AttributeDefinition Address;
}
```

Each member maps to the corresponding OpenID Connect (OIDC) claim name (for example `given_name`, `family_name`, `email_verified`) and carries the description from the OpenID Connect Core specification.

### Adding OIDC Standard Attributes to the Schema

Use `OidcStandardAttributes` members anywhere an `AttributeDefinition` is expected — for example, with `Extend`:

```csharp
builder.AddInMemoryDataExtensionSchemas([BuiltInSchemas.UserProfile.Extend(
    OidcStandardAttributes.MiddleName,
    OidcStandardAttributes.Nickname)]);
```

Or add them to a `SchemaConfiguration` you manage through `ISchemaAdmin`:

```csharp
schema.AttributeDefinitions.Add(OidcStandardAttributes.MiddleName);
schema.AttributeDefinitions.Add(OidcStandardAttributes.Nickname);
```

`BuiltInSchemas.UserProfile` already includes `OidcStandardAttributes.Email` (with `IsUnique` and `IsRequired` overridden to `true`), `Name`, `GivenName`, and `FamilyName` — adding them again with `Extend` throws `InvalidOperationException` because their codes already exist.

## Data Types

### `UserProfile`

`UserProfile` is the primary read model returned by all profile lookup and mutation operations.

```csharp
public sealed record UserProfile
{
    public UserSubjectId SubjectId { get; }
    public IReadOnlyAttributeSchema Schema { get; }
    public IReadOnlyDictionary<AttributeCode, AttributeValue> Attributes { get; }
    public AttributeValueCollection ToUpdate();
}
```

* `SubjectId`: The unique subject identifier for the user.
* `Schema`: The current `IReadOnlyAttributeSchema`, read when the profile was loaded. Stored values are not revalidated on read, so after a schema change some values may no longer match it. Use it to build further updates without a separate call to `GetSchemaAsync`.
* `Attributes`: All stored attribute values keyed by `AttributeCode`.
* `ToUpdate()`: Returns a new, mutable `AttributeValueCollection` initialized from `Schema` and the profile's current `Attributes` — a convenient starting point for a read-modify-write update:

```csharp
var profile = await profileSelfService.TryGetAsync(subjectId, ct);
if (profile is not null)
{
    var update = profile.ToUpdate();
    update.Set(AttributeCode.Create("department"), "Engineering");
    await profileSelfService.TryUpdateAsync(subjectId, update.Validate(), ct);
}
```

### `UserProfileListItem`

`UserProfileListItem` is a lightweight projection used in list query results. It carries the subject identifier and all schema attribute values as a plain string-keyed dictionary.

```csharp
public sealed record UserProfileListItem
{
    public UserSubjectId SubjectId { get; }
    public IReadOnlyDictionary<string, object> Attributes { get; }
}
```

### `UserProfileAttributeProjection`

`UserProfileAttributeProjection` is the result type returned by the `QueryAsync` overload that accepts a `HashSet<AttributeCode>`. It contains only the attributes you requested, making it more efficient than fetching full `UserProfile` records when you need a subset of data.

```csharp
public sealed record UserProfileAttributeProjection
{
    public UserSubjectId SubjectId { get; }
    public IReadOnlyDictionary<AttributeCode, AttributeValue> Attributes { get; }

    public AttributeValue this[AttributeCode code] { get; }
    public bool Contains(AttributeCode code);
    public bool TryGet(AttributeCode code, out AttributeValue? value);
}
```

* `SubjectId`: The user's subject identifier.
* `Attributes`: The projected attributes as a dictionary keyed by `AttributeCode`. Only the attributes requested in the query are present.
* `this[AttributeCode]`: Gets an attribute value by code. Throws when the attribute is not present in the projection.
* `Contains(AttributeCode)`: Returns `true` when the named attribute is present in the projection.
* `TryGet(AttributeCode, out AttributeValue?)`: Tries to retrieve an attribute value by code. Returns `false` when the attribute is not present.

### `AttributeValueCollection`

`AttributeValueCollection` is a mutable, schema-aware collection of `AttributeValue` instances used when building profile data. It validates attribute values against the schema on every mutation.

```csharp
public sealed class AttributeValueCollection : IEnumerable<AttributeValue>
{
    public AttributeValueCollection(IReadOnlyAttributeSchema schema);

    public int Count { get; }

    // Typed setters - validate code exists in schema and value matches declared type
    public void Set(AttributeCode code, string value);
    public void Set(AttributeCode code, bool value);
    public void Set(AttributeCode code, int value);
    public void Set(AttributeCode code, decimal value);
    public void Set(AttributeCode code, DateOnly value);
    public void Set(AttributeCode code, DateTimeOffset value);
    public void Set(AttributeCode code, IReadOnlyDictionary<string, object> value);
    public void Set(AttributeCode code, IReadOnlyList<object> value);

    // Try variants - return false with error list instead of throwing
    public bool TrySet(AttributeCode code, string value, out IReadOnlyList<string>? errors);
    // ... (overloads for bool, int, decimal, DateOnly, DateTimeOffset, complex, list)

    // Low-level setter (validates against schema if present)
    public void Set(AttributeValue attribute);

    public bool Remove(AttributeCode code);
    public bool Contains(AttributeCode code);
    public bool TryGet(AttributeCode code, out AttributeValue attribute);
    public AttributeValue this[AttributeCode code] { get; }

    // Validation - produces the immutable type required by persist methods
    public ValidatedAttributeValueCollection Validate();
    public bool TryValidate(out ValidatedAttributeValueCollection? validated, out IReadOnlyList<string>? errors);
}
```

### `ValidatedAttributeValueCollection`

`ValidatedAttributeValueCollection` is an immutable collection that guarantees all required attributes are present and all values conform to the schema. Persist methods (`TryAddAsync`, `TryUpdateAsync`, `TryCreateAsync`) accept only this type, enforcing correctness at compile time.

Obtain an instance by calling `Validate()` or `TryValidate()` on an `AttributeValueCollection`. Use `ValidatedAttributeValueCollection.Empty` when no attributes are needed.

Build an `AttributeValueCollection` from the schema so that attribute values are validated against their declared types:

```csharp
var schema = await selfService.GetSchemaAsync(ct);
var attributes = new AttributeValueCollection(schema);

attributes.Set(AttributeCode.Create("given_name"), "Jane");
attributes.Set(AttributeCode.Create("family_name"), "Smith");
attributes.Set(AttributeCode.Create("email_verified"), true);
```

## Self-Service Profile Operations

`IUserProfileSelfService` exposes the operations that an authenticated user performs on their own profile. You can inject it directly or access it via `IUserSelfService.Profiles`.

### `IUserProfileSelfService`

```csharp
public interface IUserProfileSelfService
{
    Task<IReadOnlyAttributeSchema> GetSchemaAsync(Ct ct);

    Task<UserProfile?> TryCreateAsync(UserSubjectId subjectId, ValidatedAttributeValueCollection attributes, Ct ct);

    Task<UserProfile?> TryGetAsync(UserSubjectId subjectId, Ct ct);

    Task<UserProfile?> TryUpdateAsync(UserSubjectId subjectId, ValidatedAttributeValueCollection attributes, Ct ct);
}
```

* `GetSchemaAsync`: Returns the current attribute schema. Pass the returned `IReadOnlyAttributeSchema` to the `AttributeValueCollection` constructor so attribute values are validated against their declared types.
* `TryCreateAsync`: Creates a new profile for the given subject with the supplied attributes. Returns the created `UserProfile` on success, or `null` if a profile already exists for that subject.
* `TryGetAsync`: Retrieves the profile for the given subject. Returns `null` when no profile exists.
* `TryUpdateAsync`: Replaces the attributes of an existing profile. Returns the updated `UserProfile` on success, or `null` when the profile does not exist or a concurrent update conflict occurs.

### Registering a Profile

```csharp
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement;
using Duende.UserManagement.Profiles;

public class RegistrationService(IUserProfileSelfService profileService)
{
    public async Task<UserProfile?> RegisterAsync(
        string subjectId,
        string givenName,
        string familyName,
        string email,
        CancellationToken ct)
    {
        var schema = await profileService.GetSchemaAsync(ct);
        var attributes = new AttributeValueCollection(schema);

        attributes.Set(AttributeCode.Create("given_name"), givenName);
        attributes.Set(AttributeCode.Create("family_name"), familyName);
        attributes.Set(AttributeCode.Create("email"), email);

        return await profileService.TryCreateAsync(
            UserSubjectId.Create(subjectId), attributes.Validate(), ct);
    }
}
```

### Retrieving a Profile

```csharp
var profile = await profileService.TryGetAsync(UserSubjectId.Create(subjectId), ct);

if (profile is null)
{
    // No profile exists for this subject.
    return;
}

if (profile.Attributes.TryGetValue(AttributeCode.Create("given_name"), out var givenName))
{
    Console.WriteLine($"Hello, {givenName}");
}
```

### Updating a Profile

Build a new `AttributeValueCollection` with the updated values and call `TryUpdateAsync`:

```csharp
var profile = await profileService.TryGetAsync(UserSubjectId.Create(subjectId), ct);

if (profile is null)
{
    return;
}

var schema = await profileService.GetSchemaAsync(ct);
var attributes = new AttributeValueCollection(schema);

attributes.Set(AttributeCode.Create("given_name"), "Janet");

var updated = await profileService.TryUpdateAsync(
    UserSubjectId.Create(subjectId), attributes.Validate(), ct);
```

## Administrative Profile Operations

`IUserProfileAdmin` provides the same read and create operations as the self-service interface, intended for back-end administrative code that manages profiles on behalf of users. You can inject it directly or access it via `IUserAdmin.Profiles`.

### `IUserProfileAdmin`

```csharp
public interface IUserProfileAdmin
{
    Task<IReadOnlyAttributeSchema> GetSchemaAsync(Ct ct);

    Task<UserProfile?> TryAddAsync(UserSubjectId subjectId, ValidatedAttributeValueCollection attributes, Ct ct);

    Task<UserProfile?> TryGetAsync(UserSubjectId subjectId, Ct ct);

    Task<UserProfile?> TryGetAsync(AttributeCode uniqueAttributeCode, object value, Ct ct);
}
```

* `GetSchemaAsync`: Returns the current attribute schema, identical to the self-service variant.
* `TryAddAsync`: Creates a new profile for the given subject. Returns the created `UserProfile` on success, or `null` if a profile already exists.
* `TryGetAsync(UserSubjectId, Ct)`: Retrieves a profile by subject identifier.
* `TryGetAsync(AttributeCode, object, Ct)`: Retrieves a profile by matching a unique attribute value. The attribute must have `IsUnique` set to `true` in its `AttributeDefinition`, because the lookup relies on the unique index for efficient matching. Returns `null` when no matching profile is found.

### Creating a Profile (Admin)

```csharp
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement;
using Duende.UserManagement.Profiles;

public class AdminProvisioningService(IUserProfileAdmin profileAdmin)
{
    public async Task<UserProfile?> ProvisionAsync(
        string subjectId,
        string email,
        int employeeId,
        CancellationToken ct)
    {
        var schema = await profileAdmin.GetSchemaAsync(ct);
        var attributes = new AttributeValueCollection(schema);

        attributes.Set(AttributeCode.Create("email"), email);
        attributes.Set(AttributeCode.Create("employee_id"), employeeId);

        return await profileAdmin.TryAddAsync(
            UserSubjectId.Create(subjectId), attributes.Validate(), ct);
    }
}
```

### Looking Up a Profile by Attribute Value

```csharp
var profile = await profileAdmin.TryGetAsync(
    AttributeCode.Create("employee_id"),
    42,
    ct);

if (profile is not null)
{
    Console.WriteLine($"Found profile for subject {profile.SubjectId}");
}
```

## Querying Profiles

`IUserProfileAdmin` provides query methods for searching and filtering user profiles. This is useful for admin operations such as finding all profiles with a specific attribute value, exporting profile data, or generating reports.

### QueryAsync Methods

```csharp
public interface IUserProfileAdmin
{
    // ... other methods ...
    
    Task<QueryResult<UserProfile>> QueryAsync(
        QueryRequest request,
        CancellationToken ct);
    
    Task<QueryResult<UserProfileAttributeProjection>> QueryAsync(
        QueryRequest request,
        HashSet<AttributeCode> attributes,
        CancellationToken ct);
}
```

Filtering and sorting are not supported for profile queries; only pagination via `Range` is available. Passing a filter or sort field will throw `NotSupportedException`. Use `QueryRequest.Create(new DataRange(...))` to construct the request.

* **`QueryAsync(QueryRequest, CancellationToken)`**: Returns a paged list of `UserProfile` records. Use `QueryRequest.Create(new DataRange(offset, limit))` to control pagination.

* **`QueryAsync(QueryRequest, HashSet<AttributeCode>, CancellationToken)`**: Returns a paged list of `UserProfileAttributeProjection` records with only the specified attributes. This overload is useful for performance optimization when you only need a subset of attributes. The projection includes `SubjectId` and the requested attributes.

### Querying All Profiles

```csharp
using Duende.Storage.Querying;
using Duende.UserManagement.Profiles;

var request = QueryRequest.Create(new DataRange(0, 50));
var result = await userProfileAdmin.QueryAsync(request, ct);

foreach (var profile in result.Items)
{
    Console.WriteLine($"Subject: {profile.SubjectId}");
}
```

### Querying Profiles with Attribute Projection

```csharp
using Duende.Storage.EntityAttributeValue;
using Duende.Storage.Querying;
using Duende.UserManagement.Profiles;

// Only retrieve email and department attributes for performance
var attributes = new HashSet<AttributeCode>
{
    AttributeCode.Create("email"),
    AttributeCode.Create("department")
};

var request = QueryRequest.Create(new DataRange(0, 50));
var projections = await userProfileAdmin.QueryAsync(request, attributes, ct);

foreach (var projection in projections.Items)
{
    Console.WriteLine($"Subject: {projection.SubjectId}");
    foreach (var (name, value) in projection.Attributes)
    {
        Console.WriteLine($"  {name} = {value}");
    }
}
```



`IReadOnlyAttributeSchema` is returned by `GetSchemaAsync` on both `IUserProfileSelfService` and `IUserProfileAdmin`. It exposes the full set of attribute definitions and their groupings. Pass the schema to the `AttributeValueCollection` constructor so the collection validates attribute values against their declared types.

```csharp
public interface IReadOnlyAttributeSchema
{
    IReadOnlyDictionary<AttributeCode, AttributeDefinition> AttributeDefinitions { get; }
    IReadOnlyDictionary<AttributeGroupCode, AttributeGroup> Groups { get; }
}
```

* `AttributeDefinitions`: The full schema as a read-only dictionary. Each `AttributeDefinition` includes an `IsRequired` property (defaults to `false`).
* `Groups`: The attribute groups defined in the schema.

## End-To-End Example

The following example shows a complete flow: initialising the schema on startup, registering a user profile, and then reading it back.

```csharp
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement;
using Duende.UserManagement.Profiles;

// 1. Extend the built-in profile with OIDC standard attributes and a custom attribute.
//    Register this with AddInMemoryDataExtensionSchemas before or after AddUserManagement(...).
public static class ProfileSchema
{
    public static readonly AttributeDefinition Department = new()
    {
        Code = AttributeCode.Create("department"),
        AttributeType = new ScalarAttributeType(ScalarDataType.String),
        Description = AttributeDescription.Create("The department the user belongs to.")
    };

    public static readonly SchemaConfiguration Schema = BuiltInSchemas.UserProfile.Extend(
        OidcStandardAttributes.EmailVerified,
        Department);
}

// 2. Register a new user profile (self-service, called after authentication).
public class OnboardingHandler(IUserProfileSelfService profileService)
{
    public async Task<UserProfile?> OnboardAsync(
        string subjectId,
        string givenName,
        string familyName,
        string email,
        CancellationToken ct)
    {
        var schema = await profileService.GetSchemaAsync(ct);
        var attributes = new AttributeValueCollection(schema);

        attributes.Set(AttributeCode.Create("given_name"), givenName);
        attributes.Set(AttributeCode.Create("family_name"), familyName);
        attributes.Set(AttributeCode.Create("email"), email);
        attributes.Set(AttributeCode.Create("email_verified"), false);

        return await profileService.TryCreateAsync(
            UserSubjectId.Create(subjectId), attributes.Validate(), ct);
    }
}

// 3. Read the profile back and surface claims.
public class ProfileReader(IUserProfileSelfService profileService)
{
    public async Task PrintAsync(string subjectId, CancellationToken ct)
    {
        var profile = await profileService.TryGetAsync(UserSubjectId.Create(subjectId), ct);

        if (profile is null)
        {
            Console.WriteLine("No profile found.");
            return;
        }

        foreach (var (name, value) in profile.Attributes)
        {
            Console.WriteLine($"{name} = {value}");
        }
    }
}
```

```csharp title="Program.cs"
builder.Services
    .AddIdentityServer()
    .AddUserManagement(_ => { })
    .AddInMemoryDataExtensionSchemas([ProfileSchema.Schema]);
```
