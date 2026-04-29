---
title: Roles and Groups
description: How to manage roles and groups in Duende User Management, including direct and transitive role assignment, CRUD operations, and membership queries.
date: 2026-04-29
sidebar:
  label: Roles and Groups
  order: 2
---

Roles and groups provide a flexible authorization model. A role represents a named permission or capability. A group is a named collection of users. Roles can be assigned to users directly, or transitively by assigning a role to a group and then adding users to that group.

## Data Model

The core types in the `Duende.Platform.Users.Profiles.RolesAndGroups` namespace are:

### Role Types

* **`RoleId`**: A strongly-typed, UUIDv7-based identifier for a role. Use `RoleId.New()` to create a new identifier, or `RoleId.Parse(string)` to parse one from its string representation.
* **`RoleName`**: A validated role name. Maximum 200 characters, leading and trailing whitespace is trimmed. Use `RoleName.Parse(string)` to construct.
* **`RoleDescription`**: An optional description for a role. Maximum 500 characters. Use `RoleDescription.Parse(string)` to construct.
* **`RoleDto`**: The data transfer object used when creating or updating a role. Contains a required `Name` and an optional `Description`.
* **`RoleListDto`**: The summary DTO returned by list and query operations. Contains `Id`, `Name`, and `Description`.
* **`RoleFilter`**: Filter criteria for role queries. Supports contains-match filtering on `Name` and `Description`.
* **`RoleSortField`**: Enum with values `Name` and `Description` for sorting role query results.

### Group Types

* **`GroupId`**: A strongly-typed, UUIDv7-based identifier for a group. Use `GroupId.New()` to create a new identifier, or `GroupId.Parse(string)` to parse one.
* **`GroupName`**: A validated group name. Maximum 200 characters, leading and trailing whitespace is trimmed. Use `GroupName.Parse(string)` to construct.
* **`GroupDescription`**: An optional description for a group. Maximum 500 characters. Use `GroupDescription.Parse(string)` to construct.
* **`GroupDto`**: The data transfer object used when creating or updating a group. Contains a required `Name` and an optional `Description`.
* **`GroupListDto`**: The summary DTO returned by list and query operations. Contains `Id`, `Name`, and `Description`.
* **`GroupFilter`**: Filter criteria for group queries. Supports contains-match filtering on `Name` and `Description`, plus an optional System for Cross-domain Identity Management (SCIM)-like `SearchExpression` (RFC 7644 §3.4.2.2).
* **`GroupSortField`**: Enum with values `Name` and `Description` for sorting group query results.

### Membership Types

* **`UserProfileRoleMemberListDto`**: Returned when listing users directly assigned to a role. Contains `SubjectId`.
* **`GroupRoleMemberListDto`**: Returned when listing groups assigned to a role. Contains `Id` and `Name`.
* **`UserProfileGroupMemberListDto`**: Returned when listing users in a group. Contains `SubjectId`.

### Direct vs. Transitive Role Assignment

A user can hold a role in two ways:

* **Direct assignment**: The role is assigned directly to the user's profile via `IRoleMembershipAdmin.AssignRoleToUserProfileAsync`. The user holds the role regardless of group membership.
* **Transitive assignment**: The role is assigned to a group via `IRoleMembershipAdmin.AssignRoleToGroupAsync`, and the user is a member of that group. The effective role path is: `Role <- GroupRole <- Group <- UserProfileGroup <- UserProfile`.

Because the storage layer does not support union operations, direct and transitive roles cannot be combined in a single query. Use `GetDirectRolesForUserProfileAsync` and `GetTransitiveRolesForUserProfileAsync` separately and merge the results in application code.

## `IRoleAdmin`

`IRoleAdmin` provides full CRUD operations for roles, with optional filtering, sorting, and offset-based pagination.

```csharp
public interface IRoleAdmin
{
    Task<SaveResult<RoleId>> CreateAsync(RoleDto role, Ct ct);

    Task<GetResult<RoleDto>> GetAsync(RoleId id, Ct ct);

    Task<SaveResult<RoleId>> UpdateAsync(RoleId id, RoleDto role, Version expectedVersion, Ct ct);

    Task<SaveResult<RoleId>> DeleteAsync(RoleId id, Ct ct);

    Task<ListResult<RoleListDto>> QueryAsync(
        RoleFilter? filter,
        (RoleSortField Field, SortDirection Direction)? sort,
        Page? page,
        Ct ct);
}
```

* **`CreateAsync`**: Creates a new role. Returns a `SaveResult<RoleId>` containing the new role's identifier and version on success, or an error if the role name already exists.
* **`GetAsync`**: Retrieves a single role by its `RoleId`. Returns a `GetResult<RoleDto>` that is either found or not found.
* **`UpdateAsync`**: Updates an existing role. Requires the current `Version` for optimistic concurrency. Returns an error on version conflict or if the role is not found.
* **`DeleteAsync`**: Deletes a role by its `RoleId`. Returns an error if deletion fails.
* **`QueryAsync`**: Returns a paged list of `RoleListDto` records. All parameters are optional: omit `filter` to return all roles, omit `sort` to use the default ordering, and omit `page` to return the first page with the default page size.

### Creating a Role

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

var role = new RoleDto
{
    Name = RoleName.Parse("content-editor"),
    Description = RoleDescription.Parse("Can create and edit content.")
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
using Duende.Platform.Storage;
using Duende.Platform.Users.Profiles.RolesAndGroups;

var filter = new RoleFilter { Name = "editor" };
var sort = (RoleSortField.Name, SortDirection.Ascending);
var page = new Page(Number: 1, Size: 20);

var roles = await roleAdmin.QueryAsync(filter, sort, page, ct);

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
    var updated = new RoleDto
    {
        Name = existing.Value.Name,
        Description = RoleDescription.Parse("Updated description.")
    };

    var result = await roleAdmin.UpdateAsync(roleId, updated, existing.Version, ct);
}
```

## `IGroupAdmin`

`IGroupAdmin` provides full CRUD operations for groups, with optional filtering, sorting, and offset-based pagination.

```csharp
public interface IGroupAdmin
{
    Task<SaveResult<GroupId>> CreateAsync(GroupDto group, Ct ct);

    Task<GetResult<GroupDto>> GetAsync(GroupId id, Ct ct);

    Task<SaveResult<GroupId>> UpdateAsync(GroupId id, GroupDto group, Version expectedVersion, Ct ct);

    Task<SaveResult<GroupId>> DeleteAsync(GroupId id, Ct ct);

    Task<ListResult<GroupListDto>> QueryAsync(
        GroupFilter? filter,
        (GroupSortField Field, SortDirection Direction)? sort,
        Page? page,
        Ct ct);
}
```

* **`CreateAsync`**: Creates a new group. Returns a `SaveResult<GroupId>` on success, or an error if the group name already exists.
* **`GetAsync`**: Retrieves a single group by its `GroupId`.
* **`UpdateAsync`**: Updates an existing group with optimistic concurrency via `expectedVersion`.
* **`DeleteAsync`**: Deletes a group by its `GroupId`.
* **`QueryAsync`**: Returns a paged list of `GroupListDto` records. `GroupFilter` also supports a SCIM-like `SearchExpression` (e.g., `displayName eq "Engineers"`) that is combined with the other filter properties using AND logic.

### Creating a Group

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

var group = new GroupDto
{
    Name = GroupName.Parse("editors"),
    Description = GroupDescription.Parse("All content editors.")
};

var result = await groupAdmin.CreateAsync(group, ct);

if (result.IsSuccess)
{
    var groupId = result.Value;
    Console.WriteLine($"Created group: {groupId}");
}
```

### Querying Groups with a SCIM Expression

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

var filter = new GroupFilter
{
    SearchExpression = new SearchExpression("displayName eq \"editors\"")
};

var groups = await groupAdmin.QueryAsync(filter, sort: null, page: null, ct);
```

## `IRoleMembershipAdmin`

`IRoleMembershipAdmin` manages the assignment of roles to users and groups, and provides queries for both direct and transitive role memberships.

```csharp
public interface IRoleMembershipAdmin
{
    Task<SaveResult<RoleId>> AssignRoleToUserProfileAsync(RoleId roleId, UserSubjectId subjectId, Ct ct);

    Task<SaveResult<RoleId>> RemoveRoleFromUserProfileAsync(RoleId roleId, UserSubjectId subjectId, Ct ct);

    Task<SaveResult<RoleId>> AssignRoleToGroupAsync(RoleId roleId, GroupId groupId, Ct ct);

    Task<SaveResult<RoleId>> RemoveRoleFromGroupAsync(RoleId roleId, GroupId groupId, Ct ct);

    Task<ListResult<UserProfileRoleMemberListDto>> GetUserProfilesInRoleAsync(RoleId roleId, Page? page, Ct ct);

    Task<ListResult<GroupRoleMemberListDto>> GetGroupsInRoleAsync(RoleId roleId, Page? page, Ct ct);

    Task<ListResult<RoleListDto>> GetDirectRolesForUserProfileAsync(UserSubjectId subjectId, Page? page, Ct ct);

    Task<ListResult<RoleListDto>> GetTransitiveRolesForUserProfileAsync(UserSubjectId subjectId, Page? page, Ct ct);

    Task<ListResult<RoleListDto>> GetRolesForGroupAsync(GroupId groupId, Page? page, Ct ct);
}
```

* **`AssignRoleToUserProfileAsync`**: Directly assigns a role to a user. Idempotent; succeeds if the assignment already exists.
* **`RemoveRoleFromUserProfileAsync`**: Removes a direct role assignment from a user. Idempotent; succeeds if the assignment does not exist.
* **`AssignRoleToGroupAsync`**: Assigns a role to a group. All members of the group transitively hold the role. Idempotent.
* **`RemoveRoleFromGroupAsync`**: Removes a role assignment from a group. Idempotent.
* **`GetUserProfilesInRoleAsync`**: Returns the users directly assigned to a role, with optional offset-based pagination.
* **`GetGroupsInRoleAsync`**: Returns the groups assigned to a role, with optional offset-based pagination.
* **`GetDirectRolesForUserProfileAsync`**: Returns roles directly assigned to a user (single-hop query).
* **`GetTransitiveRolesForUserProfileAsync`**: Returns roles a user holds via group membership (multi-hop query: `Role <- GroupRole <- Group <- UserProfileGroup <- UserProfile`).
* **`GetRolesForGroupAsync`**: Returns roles assigned to a group.

### Assigning a Role Directly to a User

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

var result = await roleMembershipAdmin.AssignRoleToUserProfileAsync(roleId, subjectId, ct);

if (result.IsSuccess)
{
    Console.WriteLine("Role assigned to user.");
}
```

### Assigning a Role to a Group

```csharp
var result = await roleMembershipAdmin.AssignRoleToGroupAsync(roleId, groupId, ct);
```

### Querying a User's Effective Roles

Because direct and transitive roles cannot be combined in a single query, retrieve both sets separately and merge them:

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

var directRoles = await roleMembershipAdmin.GetDirectRolesForUserProfileAsync(subjectId, page: null, ct);
var transitiveRoles = await roleMembershipAdmin.GetTransitiveRolesForUserProfileAsync(subjectId, page: null, ct);

var effectiveRoles = directRoles.Items
    .Concat(transitiveRoles.Items)
    .DistinctBy(r => r.Id)
    .ToList();

foreach (var role in effectiveRoles)
{
    Console.WriteLine(role.Name);
}
```

## `IGroupMembershipAdmin`

`IGroupMembershipAdmin` manages the membership of users in groups and provides queries for group membership. It supports both offset-based and cursor-based pagination for listing group members.

```csharp
public interface IGroupMembershipAdmin
{
    Task<SaveResult<GroupId>> AddUserProfileToGroupAsync(GroupId groupId, UserSubjectId subjectId, Ct ct);

    Task<SaveResult<GroupId>> RemoveUserProfileFromGroupAsync(GroupId groupId, UserSubjectId subjectId, Ct ct);

    Task<ListResult<UserProfileGroupMemberListDto>> GetUserProfilesInGroupAsync(GroupId groupId, Page? page, Ct ct);

    Task<CursorListResult<UserProfileGroupMemberListDto>> GetUserProfilesInGroupAsync(
        GroupId groupId, string? continuationToken, int pageSize, Ct ct);

    Task<ListResult<GroupListDto>> GetGroupsForUserProfileAsync(UserSubjectId subjectId, Page? page, Ct ct);
}
```

* **`AddUserProfileToGroupAsync`**: Adds a user to a group. Idempotent; succeeds if the user is already a member.
* **`RemoveUserProfileFromGroupAsync`**: Removes a user from a group. Idempotent; succeeds if the user is not a member.
* **`GetUserProfilesInGroupAsync(GroupId, Page?, Ct)`**: Returns users in a group using offset-based pagination.
* **`GetUserProfilesInGroupAsync(GroupId, string?, int, Ct)`**: Returns users in a group using cursor-based pagination. Pass `null` as the `continuationToken` to start from the beginning, then pass the `ContinuationToken` from each result to fetch the next batch. The `pageSize` must be between 1 and 200.
* **`GetGroupsForUserProfileAsync`**: Returns the groups a user belongs to, with optional offset-based pagination.

### Adding a User to a Group

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

var result = await groupMembershipAdmin.AddUserProfileToGroupAsync(groupId, subjectId, ct);

if (result.IsSuccess)
{
    Console.WriteLine("User added to group.");
}
```

### Listing Group Members with Cursor-Based Pagination

Use cursor-based pagination when iterating over large groups to avoid the overhead of offset counting:

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

string? continuationToken = null;

do
{
    var batch = await groupMembershipAdmin.GetUserProfilesInGroupAsync(
        groupId,
        continuationToken,
        pageSize: 100,
        ct);

    foreach (var member in batch.Items)
    {
        Console.WriteLine(member.SubjectId);
    }

    continuationToken = batch.ContinuationToken;
}
while (continuationToken is not null);
```

### Querying Groups for a User

```csharp
var groups = await groupMembershipAdmin.GetGroupsForUserProfileAsync(subjectId, page: null, ct);

foreach (var group in groups.Items)
{
    Console.WriteLine($"{group.Id}: {group.Name}");
}
```

## End-to-End Example

The following example creates a role, creates a group, assigns the role to the group, adds a user to the group, and then queries the user's effective roles (direct and transitive):

```csharp
using Duende.Platform.Users.Profiles.RolesAndGroups;

// 1. Create a role.
var roleResult = await roleAdmin.CreateAsync(
    new RoleDto { Name = RoleName.Parse("content-editor") },
    ct);
var roleId = roleResult.Value;

// 2. Create a group.
var groupResult = await groupAdmin.CreateAsync(
    new GroupDto { Name = GroupName.Parse("editors") },
    ct);
var groupId = groupResult.Value;

// 3. Assign the role to the group (transitive path).
await roleMembershipAdmin.AssignRoleToGroupAsync(roleId, groupId, ct);

// 4. Add the user to the group.
await groupMembershipAdmin.AddUserProfileToGroupAsync(groupId, subjectId, ct);

// 5. Query effective roles (direct + transitive, merged in application code).
var directRoles = await roleMembershipAdmin.GetDirectRolesForUserProfileAsync(subjectId, page: null, ct);
var transitiveRoles = await roleMembershipAdmin.GetTransitiveRolesForUserProfileAsync(subjectId, page: null, ct);

var effectiveRoles = directRoles.Items
    .Concat(transitiveRoles.Items)
    .DistinctBy(r => r.Id)
    .ToList();

// effectiveRoles now contains "content-editor" via the group.
```
