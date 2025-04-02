---
title: "Session Management Service"
order: 57
---

#### Duende.IdentityServer.Services.ISessionManagementService

When using [server-side sessions](../ui/server_side_sessions), the *ISessionManagementService* provides an administrative feature to query those sessions and terminate those sessions (including associated tokens, consents, and triggering back-channel logout to the clients).

```cs
/// <summary>
/// Session management service
/// </summary>
public interface ISessionManagementService
{
    /// <summary>
    /// Queries all the session related data for a user.
    /// </summary>
    Task<QueryResult<UserSession>> QuerySessionsAsync(SessionQuery filter = null, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Removes all the session related data for a user.
    /// </summary>
    Task RemoveSessionsAsync(RemoveSessionsContext context, CancellationToken cancellationToken = default);
}
```

*QuerySessionsAsync* allows for returning paged results of *UserSession* data based on the optional *SessionQuery* filter.

```cs
/// <summary>
/// Results from querying user sessions from session management service.
/// </summary>
public class UserSession
{
    /// <summary>
    /// The subject ID
    /// </summary>
    public string SubjectId { get; set; } = default!;

    /// <summary>
    /// The session ID
    /// </summary>
    public string SessionId { get; set; } = default!;

    /// <summary>
    /// The display name for the user
    /// </summary>
    public string DisplayName { get; set; }

    /// <summary>
    /// The creation time
    /// </summary>
    public DateTime Created { get; set; }

    /// <summary>
    /// The renewal time
    /// </summary>
    public DateTime Renewed { get; set; }

    /// <summary>
    /// The expiration time
    /// </summary>
    public DateTime? Expires { get; set; }

    /// <summary>
    /// The client ids for the session
    /// </summary>
    public IReadOnlyCollection<string> ClientIds { get; set; } = default!;

    /// <summary>
    /// The underlying AuthenticationTicket
    /// </summary>
    public AuthenticationTicket AuthenticationTicket { get; set; } = default!;
}
```

*RemoveSessionsAsync* will terminate server-side sessions based on *SubjectId* and/or *SessionId*, and allow for fine-grained flags for what to revoke and/or notify.

```cs
/// <summary>
/// Models the information to remove a user's session data.
/// </summary>
public class RemoveSessionsContext
{
    /// <summary>
    /// The subject ID
    /// </summary>
    public string SubjectId { get; init; }

    /// <summary>
    /// The sesion ID
    /// </summary>
    public string SessionId { get; init; }

    /// <summary>
    /// The client ids for which to trigger logout notification, or revoke tokens or consent.
    /// If not set, then all clients will be removed.
    /// </summary>
    public IEnumerable<string> ClientIds { get; set; } = default!;

    /// <summary>
    /// Removes the server side session for the user's session.
    /// </summary>
    public bool RemoveServerSideSession { get; set; } = true;

    /// <summary>
    /// Sends a back channel logout notification (if clients are registered for one).
    /// </summary>
    public bool SendBackchannelLogoutNotification { get; set; } = true;

    /// <summary>
    /// Revokes all tokens (e.g. refresh and reference) for the clients.
    /// </summary>
    public bool RevokeTokens { get; set; } = true;

    /// <summary>
    /// Revokes all prior consent granted to the clients.
    /// </summary>
    public bool RevokeConsents { get; set; } = true;
}
```
