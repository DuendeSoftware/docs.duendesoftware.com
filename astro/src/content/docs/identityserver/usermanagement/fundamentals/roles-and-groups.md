---
title: Roles and Groups
description: How to manage roles and groups in Duende User Management, including direct and transitive role assignment, CRUD operations, and membership queries.
date: 2026-04-29
sidebar:
  label: Roles and Groups
  order: 2
---

Roles and groups provide a flexible authorization model. A role represents a named permission or capability. A group is a named collection of users. Roles can be assigned to users directly, or transitively by assigning a role to a group and then adding users to that group.

## End-to-End Example

The following example creates a role, creates a group, assigns the role to the group, adds a user to the group, and then queries the user's effective roles (direct and transitive). It uses three services (`IRoleAdmin`, `IGroupAdmin`, and `IMembershipAdmin`) which are registered by calling `EnableMembership()` (see [Configuration](/identityserver/usermanagement/reference/configuration.md#membership-module)) and can be injected via constructor injection:

```csharp
using Duende.UserManagement.Membership;

public class RoleSetupService(
    IRoleAdmin roleAdmin,
    IGroupAdmin groupAdmin,
    IMembershipAdmin membershipAdmin)
{
    public async Task SetupEditorRoleAsync(UserSubjectId subjectId, CancellationToken ct)
    {
        // 1. Create a role.
        var roleResult = await roleAdmin.CreateAsync(
            new Role { Name = RoleName.Create("content-editor") },
            ct);
        var roleId = roleResult.Value;

        // 2. Create a group.
        var groupResult = await groupAdmin.CreateAsync(
            new Group { Name = GroupName.Create("editors") },
            ct);
        var groupId = groupResult.Value;

        // 3. Assign the role to the group (transitive path).
        await membershipAdmin.AssignRoleToGroupAsync(roleId, groupId, ct);

        // 4. Add the user to the group. Membership is auto-created when assigning roles/groups.
        await membershipAdmin.AssignGroupAsync(subjectId, groupId, ct);

        // 5. Query effective roles (direct + transitive, merged in application code).
        var directRoles = await membershipAdmin.GetDirectRolesAsync(subjectId, range: null, ct);
        var transitiveRoles = await membershipAdmin.GetTransitiveRolesAsync(subjectId, range: null, ct);

        var effectiveRoles = directRoles.Items
            .Concat(transitiveRoles.Items)
            .DistinctBy(r => r.Id)
            .ToList();

        // effectiveRoles now contains "content-editor" via the group.
    }
}
```

### Where this code typically lives

This kind of programmatic role and group management is used in several common scenarios:

* **Admin application**: A back-office UI where administrators create and manage roles and groups, assign users to groups, and review effective permissions. The admin app calls these APIs in response to user actions.
* **Automation or background service**: A service that synchronizes roles or group membership from an external system (for example, an HR directory or an identity provider). The service runs on a schedule or reacts to events, calling these APIs to keep the local state in sync.
* **Seed script**: A startup routine that ensures required roles and groups exist before the application accepts traffic. Typically runs once on first deployment or after a database reset.
* **Integration tests**: Test setup code that creates known roles, groups, and memberships so that tests run against a predictable, isolated state.

## Data Model

The core types in the `Duende.UserManagement.Membership` namespace are:

### Role Types

* **`RoleId`**: A strongly-typed, string-based identifier for a role. Use `RoleId.Create(string)` to create one. Valid characters are alphanumeric, dashes, underscores, forward slashes, and backslashes.
* **`RoleName`**: A validated role name. Maximum 200 characters, leading and trailing whitespace is trimmed. Use `RoleName.Create(string)` to construct.
* **`RoleDescription`**: An optional description for a role. Maximum 500 characters. Use `RoleDescription.Create(string)` to construct.
* **`Role`**: The record used when creating or updating a role. Contains a required `Name` and an optional `Description`.
* **`RoleListItem`**: The summary record returned by list and query operations. Contains `Id`, `Name`, and `Description`.
* **`RoleFilter`**: Filter criteria for role queries. Supports contains-match filtering on `Name` and `Description`.
* **`RoleSortField`**: Enum with values `Name` and `Description` for sorting role query results.

### Group Types

* **`GroupId`**: A strongly-typed, string-based identifier for a group. Use `GroupId.Create(string)` to create one. Valid characters are alphanumeric, dashes, underscores, forward slashes, and backslashes.
* **`GroupName`**: A validated group name. Maximum 200 characters, leading and trailing whitespace is trimmed. Use `GroupName.Create(string)` to construct.
* **`GroupDescription`**: An optional description for a group. Maximum 500 characters. Use `GroupDescription.Create(string)` to construct.
* **`Group`**: The record used when creating or updating a group. Contains a required `Name` and an optional `Description`.
* **`GroupListItem`**: The summary record returned by list and query operations. Contains `Id`, `Name`, and `Description`.
* **`GroupFilter`**: Filter criteria for group queries. Supports contains-match filtering on `Name` and `Description`, plus an optional `SearchExpression` for filter expressions (e.g., `displayName eq "Engineers"`).
* **`GroupSortField`**: Enum with values `Name` and `Description` for sorting group query results.

### Membership Types

* **`MembershipRoleMemberListItem`**: Returned when listing users directly assigned to a role. Contains `SubjectId`.
* **`RoleGroupMemberListItem`**: Returned when listing groups assigned to a role. Contains `Id` and `Name`.
* **`MembershipGroupMemberListItem`**: Returned when listing users in a group. Contains `SubjectId`.

### Direct vs. Transitive Role Assignment

A user can hold a role in two ways:

* **Direct assignment**: The role is assigned directly to the user's profile via `IMembershipAdmin.AssignRoleAsync`. The user holds the role regardless of group membership.
* **Transitive assignment**: The role is assigned to a group via `IMembershipAdmin.AssignRoleToGroupAsync`, and the user is a member of that group. The effective role path is: `Role <- GroupRole <- Group <- UserProfileGroup <- UserProfile`.

Because the storage layer does not support union operations, direct and transitive roles cannot be combined in a single query. Use `GetDirectRolesAsync` and `GetTransitiveRolesAsync` separately and merge the results in application code.

## `IRoleAdmin`

`IRoleAdmin` provides full CRUD operations for roles. It is registered when you call `EnableMembership()` inside `AddUserManagement()` and is typically injected into admin controllers, background services, or seed scripts. Use it whenever you need to create, read, update, delete, or search roles independently of membership, for example to populate a role picker in an admin UI or to ensure a set of well-known roles exists at startup.

```csharp
public interface IRoleAdmin
{
    Task<SaveResult<RoleId>> CreateAsync(Role role, CancellationToken ct);
    Task<GetResult<Role>> GetAsync(RoleId id, CancellationToken ct);
    Task<SaveResult<RoleId>> UpdateAsync(RoleId id, Role role, Version expectedVersion, CancellationToken ct);
    Task<SaveResult<RoleId>> DeleteAsync(RoleId id, CancellationToken ct);
    Task<QueryResult<RoleListItem>> QueryAsync(
        QueryRequest<RoleFilter, RoleSortField> request,
        CancellationToken ct);
}
```

* **`CreateAsync`**: Creates a new role. Returns a `SaveResult<RoleId>` containing the new role's identifier and version on success, or an error if the role name already exists.
* **`GetAsync`**: Retrieves a single role by its `RoleId`. Returns a `GetResult<Role>` that is either found or not found.
* **`UpdateAsync`**: Updates an existing role. Requires the current `Version` for optimistic concurrency. Returns an error on version conflict or if the role is not found.
* **`DeleteAsync`**: Deletes a role by its `RoleId`. Returns an error if deletion fails.
* **`QueryAsync`**: Returns a paged list of `RoleListItem` records. Use `QueryRequest.Create(filter, sort, range)` to construct the request. All parameters are optional: omit `filter` to return all roles, omit `sort` to use the default ordering, and omit `range` to return the first page with the default page size.

### Creating a Role

```csharp
using Duende.UserManagement.Membership;

var role = new Role
{
    Name = RoleName.Create("content-editor"),
    Description = RoleDescription.Create("Can create and edit content.")
};

var result = await roleAdmin.CreateAsync(role, ct);

if (result.IsSuccess)
{
    var roleId = result.Value;
    Console.WriteLine($"Created role: {roleId}");
}
```

### Querying Roles

```csharp
using Duende.Storage;
using Duende.Storage.Querying;
using Duende.UserManagement.Membership;

var filter = new RoleFilter { Name = "editor" };
var sort = SortBy.Ascending(RoleSortField.Name);
var range = new DataRange(Offset: 0, Limit: 20);

var roles = await roleAdmin.QueryAsync(QueryRequest.Create(filter, sort, range), ct);

foreach (var r in roles.Items)
{
    Console.WriteLine($"{r.Id}: {r.Name}");
}
```

### Updating a Role

```csharp
var existing = await roleAdmin.GetAsync(roleId, ct);

if (existing.IsFound)
{
    var updated = new Role
    {
        Name = existing.Value.Name,
        Description = RoleDescription.Create("Updated description.")
    };

    var result = await roleAdmin.UpdateAsync(roleId, updated, existing.Version, ct);
}
```

## `IGroupAdmin`

`IGroupAdmin` provides full CRUD operations for groups. Like `IRoleAdmin`, it is registered by `EnableMembership()` and is injected wherever group lifecycle management is needed, for example in an admin UI that lets administrators create and rename groups, or in a synchronization service that mirrors groups from an external directory. Use it to manage the group catalog independently of membership.

```csharp
public interface IGroupAdmin
{
    Task<SaveResult<GroupId>> CreateAsync(Group group, CancellationToken ct);
    Task<GetResult<Group>> GetAsync(GroupId id, CancellationToken ct);
    Task<SaveResult<GroupId>> UpdateAsync(GroupId id, Group group, Version expectedVersion, CancellationToken ct);
    Task<SaveResult<GroupId>> DeleteAsync(GroupId id, CancellationToken ct);
    Task<QueryResult<GroupListItem>> QueryAsync(
        QueryRequest<GroupFilter, GroupSortField> request,
        CancellationToken ct);
}
```

* **`CreateAsync`**: Creates a new group. Returns a `SaveResult<GroupId>` on success, or an error if the group name already exists.
* **`GetAsync`**: Retrieves a single group by its `GroupId`.
* **`UpdateAsync`**: Updates an existing group with optimistic concurrency via `expectedVersion`.
* **`DeleteAsync`**: Deletes a group by its `GroupId`.
* **`QueryAsync`**: Returns a paged list of `GroupListItem` records. Use `QueryRequest.Create(filter, sort, range)` to construct the request. `GroupFilter` also supports a `SearchExpression` (e.g., `displayName eq "Engineers"`) that is combined with the other filter properties using AND logic.

### Creating a Group

```csharp
using Duende.UserManagement.Membership;

var group = new Group
{
    Name = GroupName.Create("editors"),
    Description = GroupDescription.Create("All content editors.")
};

var result = await groupAdmin.CreateAsync(group, ct);

if (result.IsSuccess)
{
    var groupId = result.Value;
    Console.WriteLine($"Created group: {groupId}");
}
```

### Querying Groups with a Filter Expression

```csharp
using Duende.UserManagement.Membership;
using Duende.Storage.Querying;

var filter = new GroupFilter
{
    SearchExpression = new SearchExpression("displayName eq \"editors\"")
};

var groups = await groupAdmin.QueryAsync(QueryRequest.Create(filter, sort: null, range: null), ct);
```

## `IMembershipAdmin`

`IMembershipAdmin` is the single interface for all membership operations. It replaces the former `IRoleMembershipAdmin` and `IGroupMembershipAdmin` interfaces, which no longer exist. It is registered by `EnableMembership()` alongside `IRoleAdmin` and `IGroupAdmin` and is injected wherever you need to assign roles or groups to users, or query a user's effective roles.

A user's membership record is automatically created when a role or group is first assigned to them. There is no need to explicitly create or manage the membership lifecycle.

```csharp
public interface IMembershipAdmin
{
    // Direct role assignment
    Task<SaveResult<RoleId>> AssignRoleAsync(UserSubjectId subjectId, RoleId roleId, CancellationToken ct);
    Task<SaveResult<RoleId>> RemoveRoleAsync(UserSubjectId subjectId, RoleId roleId, CancellationToken ct);

    // Group role assignment
    Task<SaveResult<RoleId>> AssignRoleToGroupAsync(RoleId roleId, GroupId groupId, CancellationToken ct);
    Task<SaveResult<RoleId>> RemoveRoleFromGroupAsync(RoleId roleId, GroupId groupId, CancellationToken ct);

    // Group membership
    Task<SaveResult<GroupId>> AssignGroupAsync(UserSubjectId subjectId, GroupId groupId, CancellationToken ct);
    Task<SaveResult<GroupId>> RemoveGroupAsync(UserSubjectId subjectId, GroupId groupId, CancellationToken ct);

    // Query operations
    Task<QueryResult<RoleListItem>> GetDirectRolesAsync(UserSubjectId subjectId, DataRange? range, CancellationToken ct);
    Task<QueryResult<RoleListItem>> GetTransitiveRolesAsync(UserSubjectId subjectId, DataRange? range, CancellationToken ct);
    Task<QueryResult<RoleListItem>> GetRolesForGroupAsync(GroupId groupId, DataRange? range, CancellationToken ct);
    Task<QueryResult<GroupListItem>> GetGroupsAsync(UserSubjectId subjectId, DataRange? range, CancellationToken ct);
    Task<QueryResult<MembershipRoleMemberListItem>> GetMembersInRoleAsync(RoleId roleId, DataRange? range, CancellationToken ct);
    Task<QueryResult<RoleGroupMemberListItem>> GetGroupsInRoleAsync(RoleId roleId, DataRange? range, CancellationToken ct);
    Task<QueryResult<MembershipGroupMemberListItem>> GetMembersInGroupAsync(GroupId groupId, DataRange? range, CancellationToken ct);
}
```

### Direct role assignment

* **`AssignRoleAsync(UserSubjectId, RoleId, CancellationToken)`**: Directly assigns a role to a user. Automatically creates the user's membership record if it does not exist. Idempotent; succeeds if the assignment already exists.
* **`RemoveRoleAsync(UserSubjectId, RoleId, CancellationToken)`**: Removes a direct role assignment from a user. Idempotent; succeeds if the assignment does not exist.

### Group role assignment

* **`AssignRoleToGroupAsync(RoleId, GroupId, CancellationToken)`**: Assigns a role to a group. All members of the group transitively hold the role. Idempotent.
* **`RemoveRoleFromGroupAsync(RoleId, GroupId, CancellationToken)`**: Removes a role assignment from a group. Idempotent.

### Group membership

* **`AssignGroupAsync(UserSubjectId, GroupId, CancellationToken)`**: Adds a user to a group. Idempotent; succeeds if the user is already a member.
* **`RemoveGroupAsync(UserSubjectId, GroupId, CancellationToken)`**: Removes a user from a group. Idempotent; succeeds if the user is not a member.

### Query operations

* **`GetDirectRolesAsync(UserSubjectId, DataRange?, CancellationToken)`**: Returns roles directly assigned to a user (single-hop query).
* **`GetTransitiveRolesAsync(UserSubjectId, DataRange?, CancellationToken)`**: Returns roles a user holds via group membership (multi-hop query: `Role <- GroupRole <- Group <- UserProfileGroup <- UserProfile`).
* **`GetRolesForGroupAsync(GroupId, DataRange?, CancellationToken)`**: Returns roles assigned to a group.
* **`GetGroupsAsync(UserSubjectId, DataRange?, CancellationToken)`**: Returns the groups a user belongs to.
* **`GetMembersInRoleAsync(RoleId, DataRange?, CancellationToken)`**: Returns the users directly assigned to a role.
* **`GetGroupsInRoleAsync(RoleId, DataRange?, CancellationToken)`**: Returns the groups assigned to a role.
* **`GetMembersInGroupAsync(GroupId, DataRange?, CancellationToken)`**: Returns the users who are members of a group.

### Assigning a Role Directly to a User

```csharp
using Duende.UserManagement.Membership;

var result = await membershipAdmin.AssignRoleAsync(subjectId, roleId, ct);

if (result.IsSuccess)
{
    Console.WriteLine("Role assigned to user.");
}
```

### Assigning a Role to a Group

```csharp
var result = await membershipAdmin.AssignRoleToGroupAsync(roleId, groupId, ct);
```

### Adding a User to a Group

```csharp
using Duende.UserManagement.Membership;

var result = await membershipAdmin.AssignGroupAsync(subjectId, groupId, ct);

if (result.IsSuccess)
{
    Console.WriteLine("User added to group.");
}
```

### Removing a User from a Group

```csharp
var result = await membershipAdmin.RemoveGroupAsync(subjectId, groupId, ct);
```

### Querying a User's Effective Roles

Because direct and transitive roles cannot be combined in a single query, retrieve both sets separately and merge them:

```csharp
using Duende.UserManagement.Membership;

var directRoles = await membershipAdmin.GetDirectRolesAsync(subjectId, range: null, ct);
var transitiveRoles = await membershipAdmin.GetTransitiveRolesAsync(subjectId, range: null, ct);

var effectiveRoles = directRoles.Items
    .Concat(transitiveRoles.Items)
    .DistinctBy(r => r.Id)
    .ToList();

foreach (var role in effectiveRoles)
{
    Console.WriteLine(role.Name);
}
```

### Querying Groups for a User

```csharp
var groups = await membershipAdmin.GetGroupsAsync(subjectId, range: null, ct);

foreach (var group in groups.Items)
{
    Console.WriteLine($"{group.Id}: {group.Name}");
}
```

### Listing Members of a Group

```csharp
using Duende.UserManagement.Membership;

var range = new DataRange(Offset: 0, Limit: 50);
var members = await membershipAdmin.GetMembersInGroupAsync(groupId, range, ct);

foreach (var member in members.Items)
{
    Console.WriteLine(member.SubjectId);
}
```

### Listing Members of a Role

```csharp
var members = await membershipAdmin.GetMembersInRoleAsync(roleId, range: null, ct);

foreach (var member in members.Items)
{
    Console.WriteLine(member.SubjectId);
}
```

### Deprovisioning a User

When a user is removed from the system, use `IUserAdmin.TryRemoveAsync()` to delete the user and clean up all role and group assignments:

```csharp
using Duende.UserManagement;

var removed = await userAdmin.TryRemoveAsync(subjectId, ct);

if (removed)
{
    Console.WriteLine("User and all role/group assignments removed.");
}
```
