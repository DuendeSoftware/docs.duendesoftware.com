---
title: User Profiles and Attributes
description: How to store, retrieve, and manage user profile attributes in Duende User Management using IUserProfileSelfService, IUserProfileAdmin, and IUserProfileSchemaAdmin.
date: 2026-05-19
sidebar:
  label: User Profiles and Attributes
  order: 1
---

User Management provides a flexible, schema-driven profile system that lets you attach typed attributes to every user. The design follows an **Entity-Attribute-Value (EAV)** model: instead of extending a base class or adding columns to a table, you define attributes in a schema at runtime and store values against individual user profiles.

`UserProfile` is a **sealed record** that cannot be subclassed. There is exactly one `UserProfile` type in the system:

```csharp
public sealed record UserProfile
{
    public UserSubjectId SubjectId { get; }
    public UserName? UserName { get; }
    public IReadOnlyDictionary<AttributeCode, AttributeValue> Attributes { get; }
}
```

All extensibility happens through the `Attributes` dictionary. You define which attributes exist by registering `AttributeDefinition` entries in the schema; the system then validates values against those definitions at write time.

The system exposes three interfaces covering different access levels: self-service operations performed by the authenticated user, administrative operations performed by back-end code, and schema management for defining which attributes exist.

### Where to use these interfaces

All three interfaces are registered with the service provider by `EnableProfiles()` and can be injected anywhere in your application:

* **Razor Pages**: inject into page models to read or update the current user's profile.
* **MVC controllers**: inject into controllers for profile endpoints.
* **Backend services / hosted services**: inject into `IHostedService` implementations for background provisioning or migration tasks.
* **Seed scripts / startup code**: inject `IUserProfileSchemaAdmin` into an `IHostedService` or a startup filter to initialize the schema before the application starts serving requests.

## Registration

Call `AddUserManagement()` on the IdentityServer builder and chain `EnableProfiles()` to register all profile services:

```csharp title="Program.cs"
using Duende.UserManagement;

builder.Services
    .AddIdentityServer()
    .AddUserManagement(um => um
        .EnableProfiles()
    );
```

This makes `IUserProfileSelfService`, `IUserProfileAdmin`, and `IUserProfileSchemaAdmin` available for injection.

:::note[Automatic profile provisioning]
When a user signs in via OTP for the first time, User Management automatically creates a profile for them
and sets the email attribute from their OTP address. You do not need to call `IUserProfileSelfService.TryRegisterAsync`
manually for OTP-authenticated users.

If you want to skip automatic profile provisioning, you can provide a custom `IOtpAuthenticator` implementation.
See [OTP Authentication](/identityserver/usermanagement/authentication/otp.mdx) for details.
:::

## Schema Management

Before storing attributes you must define them in the schema. The schema is a dictionary of `AttributeCode` to `AttributeDefinition` pairs that describes every attribute the system accepts, its data type, and optional uniqueness constraints.

### `IUserProfileSchemaAdmin`

`IUserProfileSchemaAdmin` is the interface for managing attribute definitions at runtime.

```csharp
public interface IUserProfileSchemaAdmin
{
    Task<IReadOnlyDictionary<AttributeCode, AttributeDefinition>> GetAllAttributeDefinitionsAsync(Ct ct);

    Task<bool> TryAddAttributeDefinitionAsync(AttributeDefinition definition, Ct ct);

    Task<bool> TryRemoveAttributeDefinitionAsync(AttributeCode code, Ct ct);
}
```

* `GetAllAttributeDefinitionsAsync`: Returns all currently registered attribute definitions keyed by code. Returns an empty dictionary when no schema has been configured yet.
* `TryAddAttributeDefinitionAsync`: Adds a new attribute definition to the schema. Returns `true` on success and `false` if the definition could not be added (for example, a definition with the same code already exists).
* `TryRemoveAttributeDefinitionAsync`: Removes an attribute definition by code. Returns `true` whether or not the definition existed.

To organize attributes into groups and control their display order, see [Attribute groups and ordering](/identityserver/usermanagement/fundamentals/attribute-groups.md).

### `AttributeDefinition`

An `AttributeDefinition` describes a single attribute in the schema.

```csharp
public sealed record AttributeDefinition
{
    public AttributeCode Code { get; }
    public AttributeDisplayName? DisplayName { get; }
    public AttributeType AttributeType { get; }
    public ScalarDataType DataType { get; }   // convenience; throws for non-scalar types
    public AttributeDescription Description { get; }
    public bool IsUnique { get; }
    public IReadOnlyCollection<string> Tags { get; }
    public AttributeGroupCode? GroupCode { get; }
    public int Order { get; }
}
```

* `Code`: The attribute's identifier. Must start with an ASCII letter, must not end with an underscore, and may only contain ASCII letters, digits, or underscores.
* `DisplayName`: Optional human-readable display name for the attribute. When set, UIs can show this instead of the raw code.
* `AttributeType`: The full type descriptor. Use `ScalarAttributeType`, `ComplexAttributeType`, or `ListAttributeType`.
* `DataType`: Convenience accessor for scalar types. Throws `InvalidOperationException` for complex or list types.
* `Description`: Human-readable description of the attribute.
* `IsUnique`: When `true`, the system enforces that no two profiles share the same value for this attribute. Not supported for complex or list types.
* `Tags`: Optional string tags for grouping or filtering definitions.
* `GroupCode`: The code of the group this attribute belongs to. `null` means the attribute is ungrouped.
* `Order`: Sort weight within the group. Lower values appear first.

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

The following example adds a custom `department` string attribute and a unique `employee_id` integer attribute to the schema:

```csharp
using Duende.Storage.EntityAttributeValue;
using Duende.UserManagement.Profiles;

public class ProfileSchemaInitializer(IUserProfileSchemaAdmin schemaAdmin)
{
    public async Task InitializeAsync(CancellationToken ct)
    {
        var department = new AttributeDefinition(
            AttributeCode.Create("department"),
            ScalarDataType.String,
            AttributeDescription.Create("The department the user belongs to."));

        var employeeId = new AttributeDefinition(
            AttributeCode.Create("employee_id"),
            ScalarDataType.Integer,
            AttributeDescription.Create("The unique employee identifier."),
            isUnique: true);

        await schemaAdmin.TryAddAttributeDefinitionAsync(department, ct);
        await schemaAdmin.TryAddAttributeDefinitionAsync(employeeId, ct);
    }
}
```

### Defining Complex Attributes

Use `ComplexAttributeType` to model structured values such as an address:

```csharp
var addressType = new ComplexAttributeType(
    new Dictionary<string, AttributeType>
    {
        ["street"]  = new ScalarAttributeType(ScalarDataType.String),
        ["city"]    = new ScalarAttributeType(ScalarDataType.String),
        ["country"] = new ScalarAttributeType(ScalarDataType.String),
    });

var address = new AttributeDefinition(
    AttributeCode.Create("address"),
    addressType,
    AttributeDescription.Create("The user's postal address."));

await schemaAdmin.TryAddAttributeDefinitionAsync(address, ct);
```

### Defining List Attributes

Use `ListAttributeType` to model multi-value attributes such as a list of phone numbers:

```csharp
var phoneNumbers = new AttributeDefinition(
    AttributeCode.Create("phone_numbers"),
    new ListAttributeType(new ScalarAttributeType(ScalarDataType.String)),
    AttributeDescription.Create("Additional phone numbers for the user."));

await schemaAdmin.TryAddAttributeDefinitionAsync(phoneNumbers, ct);
```

### Removing an Attribute Definition

```csharp
await schemaAdmin.TryRemoveAttributeDefinitionAsync(
    AttributeCode.Create("department"), ct);
```

### Inspecting the Schema

```csharp
var definitions = await schemaAdmin.GetAllAttributeDefinitionsAsync(ct);

foreach (var (name, definition) in definitions)
{
    Console.WriteLine($"{name}: {definition.Description}");
}
```

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

```csharp
await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.GivenName, ct);
await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.FamilyName, ct);
await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.Email, ct);
await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.EmailVerified, ct);
```

## Data Types

### `UserProfile`

`UserProfile` is the primary read model returned by all profile lookup and mutation operations.

```csharp
public sealed record UserProfile
{
    public UserSubjectId SubjectId { get; }
    public UserName? UserName { get; }
    public IReadOnlyDictionary<AttributeCode, AttributeValue> Attributes { get; }
}
```

* `SubjectId`: The unique subject identifier for the user.
* `UserName`: The user's login name, if one has been set.
* `Attributes`: All stored attribute values keyed by `AttributeCode`.

### `UserProfileListItem`

`UserProfileListItem` is a lightweight projection used in list query results. It carries the subject identifier, optional user name, and all schema attribute values as a plain string-keyed dictionary.

```csharp
public sealed record UserProfileListItem
{
    public UserSubjectId SubjectId { get; }
    public UserName? UserName { get; }
    public IReadOnlyDictionary<string, object> Attributes { get; }
}
```

### `UserProfileAttributeProjection`

`UserProfileAttributeProjection` is the result type returned by the `QueryAsync` overload that accepts a `HashSet<AttributeCode>`. It contains only the attributes you requested, making it more efficient than fetching full `UserProfile` records when you need a subset of data.

```csharp
public sealed record UserProfileAttributeProjection
{
    public UserSubjectId SubjectId { get; }
    public UserName? UserName { get; }
    public IReadOnlyDictionary<AttributeCode, AttributeValue> Attributes { get; }

    public AttributeValue this[AttributeCode code] { get; }
    public bool Contains(AttributeCode code);
    public bool TryGet(AttributeCode code, out AttributeValue? value);
}
```

* `SubjectId`: The user's subject identifier.
* `UserName`: The user's username, if available.
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

    // Typed setters — validate code exists in schema and value matches declared type
    public void Set(AttributeCode code, string value);
    public void Set(AttributeCode code, bool value);
    public void Set(AttributeCode code, int value);
    public void Set(AttributeCode code, decimal value);
    public void Set(AttributeCode code, DateOnly value);
    public void Set(AttributeCode code, DateTimeOffset value);
    public void Set(AttributeCode code, IReadOnlyDictionary<string, object> value);
    public void Set(AttributeCode code, IReadOnlyList<object> value);

    // Try variants — return false with error list instead of throwing
    public bool TrySet(AttributeCode code, string value, out IReadOnlyList<string>? errors);
    // ... (overloads for bool, int, decimal, DateOnly, DateTimeOffset, complex, list)

    // Low-level setter (validates against schema if present)
    public void Set(AttributeValue attribute);

    public bool Remove(AttributeCode code);
    public bool Contains(AttributeCode code);
    public bool TryGet(AttributeCode code, out AttributeValue attribute);
    public AttributeValue this[AttributeCode code] { get; }

    // Validation — produces the immutable type required by persist methods
    public ValidatedAttributeValueCollection Validate();
    public bool TryValidate(out ValidatedAttributeValueCollection? validated, out IReadOnlyList<string>? errors);
}
```

### `ValidatedAttributeValueCollection`

`ValidatedAttributeValueCollection` is an immutable collection that guarantees all required attributes are present and all values conform to the schema. Persist methods (`TryAddAsync`, `TryUpdateAsync`, `TryRegisterAsync`) accept only this type, enforcing correctness at compile time.

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

`IUserProfileSelfService` exposes the operations that an authenticated user performs on their own profile.

### `IUserProfileSelfService`

```csharp
public interface IUserProfileSelfService
{
    Task<IReadOnlyAttributeSchema> GetSchemaAsync(Ct ct);

    Task<UserProfile?> TryRegisterAsync(UserSubjectId subjectId, ValidatedAttributeValueCollection attributes, Ct ct);

    Task<UserProfile?> TryGetAsync(UserSubjectId subjectId, Ct ct);

    Task<UserProfile?> TryUpdateAsync(UserSubjectId subjectId, ValidatedAttributeValueCollection attributes, Ct ct);
}
```

* `GetSchemaAsync`: Returns the current attribute schema. Pass the returned `IReadOnlyAttributeSchema` to the `AttributeValueCollection` constructor so attribute values are validated against their declared types.
* `TryRegisterAsync`: Creates a new profile for the given subject with the supplied attributes. Returns the created `UserProfile` on success, or `null` if a profile already exists for that subject.
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

        return await profileService.TryRegisterAsync(
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

`IUserProfileAdmin` provides the same read and create operations as the self-service interface, intended for back-end administrative code that manages profiles on behalf of users.

### `IUserProfileAdmin`

```csharp
public interface IUserProfileAdmin
{
    Task<IReadOnlyAttributeSchema> GetSchemaAsync(Ct ct);

    Task<UserProfile?> TryAddAsync(UserSubjectId subjectId, ValidatedAttributeValueCollection attributes, Ct ct);

    Task<UserProfile?> TryGetAsync(UserSubjectId subjectId, Ct ct);

    Task<UserProfile?> TryGetAsync(AttributeCode attributeCode, object value, Ct ct);
}
```

* `GetSchemaAsync`: Returns the current attribute schema, identical to the self-service variant.
* `TryAddAsync`: Creates a new profile for the given subject. Returns the created `UserProfile` on success, or `null` if a profile already exists.
* `TryGetAsync(UserSubjectId, Ct)`: Retrieves a profile by subject identifier.
* `TryGetAsync(AttributeCode, object, Ct)`: Retrieves a profile by matching an attribute value. This overload is useful for looking up a user by a unique attribute such as `employee_id` or `email`. Returns `null` when no matching profile is found.

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

* **`QueryAsync(QueryRequest, HashSet<AttributeCode>, CancellationToken)`**: Returns a paged list of `UserProfileAttributeProjection` records with only the specified attributes. This overload is useful for performance optimization when you only need a subset of attributes. The projection includes `SubjectId`, `UserName`, and the requested attributes.

### Querying All Profiles

```csharp
using Duende.Storage;
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
using Duende.Storage;
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

// 1. Add OIDC standard attributes and a custom attribute to the schema.
public class SchemaSetup(IUserProfileSchemaAdmin schemaAdmin)
{
    public async Task RunAsync(CancellationToken ct)
    {
        await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.GivenName, ct);
        await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.FamilyName, ct);
        await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.Email, ct);
        await schemaAdmin.TryAddAttributeDefinitionAsync(OidcStandardAttributes.EmailVerified, ct);

        var department = new AttributeDefinition(
            AttributeCode.Create("department"),
            ScalarDataType.String,
            AttributeDescription.Create("The department the user belongs to."));

        await schemaAdmin.TryAddAttributeDefinitionAsync(department, ct);
    }
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

        return await profileService.TryRegisterAsync(
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
