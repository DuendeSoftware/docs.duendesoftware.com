---
title: "Session Management"
description: Configure and implement custom server-side session storage and lifecycle management through IUserSessionStore interface

date: 2020-09-10T08:22:12+02:00
sidebar:
  label: "Session Management"
  order: 20
redirect_from:
  - /bff/v2/extensibility/sessions/
  - /bff/v3/extensibility/sessions/
  - /identityserver/v5/bff/extensibility/sessions/
  - /identityserver/v6/bff/extensibility/sessions/
  - /identityserver/v7/bff/extensibility/sessions/
---

Server-side sessions enable secure and efficient storage of session data, allowing flexibility through custom
implementations of the `IUserSessionStore` interface. This ensures adaptability to various storage solutions tailored to
your application's needs.

## User Session Store

If using the server-side sessions feature, you will need to have a store for the session data.
An Entity Framework Core based implementation of this store is provided. 
If you wish to use some other type of store, then you can implement the *IUserSessionStore* interface:

```csharp
/// <summary>
/// User session store
/// </summary>
public interface IUserSessionStore
{
    /// <summary>
    /// Retrieves a user session
    /// </summary>
    /// <param name="key"></param>
    /// <param name="cancellationToken">A token that can be used to request cancellation of the asynchronous operation.</param>
    /// <returns></returns>
    Task<UserSession?> GetUserSessionAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a user session
    /// </summary>
    /// <param name="session"></param>
    /// <param name="cancellationToken">A token that can be used to request cancellation of the asynchronous operation.</param>
    /// <returns></returns>
    Task CreateUserSessionAsync(UserSession session, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates a user session
    /// </summary>
    /// <param name="key"></param>
    /// <param name="session"></param>
    /// <param name="cancellationToken">A token that can be used to request cancellation of the asynchronous operation.</param>
    /// <returns></returns>
    Task UpdateUserSessionAsync(string key, UserSessionUpdate session, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a user session
    /// </summary>
    /// <param name="key"></param>
    /// <param name="cancellationToken">A token that can be used to request cancellation of the asynchronous operation.</param>
    /// <returns></returns>
    Task DeleteUserSessionAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Queries user sessions based on the filter.
    /// </summary>
    /// <param name="filter"></param>
    /// <param name="cancellationToken">A token that can be used to request cancellation of the asynchronous operation.</param>
    /// <returns></returns>
    Task<IReadOnlyCollection<UserSession>> GetUserSessionsAsync(UserSessionsFilter filter, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes user sessions based on the filter.
    /// </summary>
    /// <param name="filter"></param>
    /// <param name="cancellationToken">A token that can be used to request cancellation of the asynchronous operation.</param>
    /// <returns></returns>
    Task DeleteUserSessionsAsync(UserSessionsFilter filter, CancellationToken cancellationToken = default);
}
```

Once you have an implementation, you can register it when you enable server-side sessions:

```csharp
// Program.cs
builder.Services.AddBff()
    .AddServerSideSessions<YourStoreClassName>();

```

## User Session Store Cleanup

The *IUserSessionStoreCleanup* interface is used to model cleaning up expired sessions.

```csharp
/// <summary>
/// User session store cleanup
/// </summary>
public interface IUserSessionStoreCleanup
{
    /// <summary>
    /// Deletes expired sessions
    /// </summary>
    Task DeleteExpiredSessionsAsync(CancellationToken cancellationToken = default);
}
```
