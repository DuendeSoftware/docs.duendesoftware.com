---
title: "Session Management"
description: "Server Side Sessions"
weight: 10
---

When using server-side sessions, there is a record of the user's authentication activity at IdentityServer.
This allows administrative and management tooling to be built on top of that data to query those sessions, as well as terminate them.
In addition, since the session data has its own unique id and tracks clients that a user has used, then some types of tokens issued to these clients can be revoked.
Finally, if clients support back-channel logout, then they can be notified that a user's session has been terminated, which allows them to also terminate the user's session within the client application.

These features are all provided via the *ISessionManagementService* service.

## ISessionManagementService

The [session management service]({{<ref "/reference/services/session_management_service">}}) provides administrative operations for querying and revoking the server-side sessions.

### Quickstart UI

The Quickstart UI contains a simple administrative page (under the "ServerSideSessions" folder) that uses the *ISessionManagementService* API.

It looks something like this (but of course you are free to customize or change it as needed):

![](../images/session_query.png)


### Querying sessions

Use the *QuerySessionsAsync* API to access a paged list of user sessions.
You can optionally filter on a user's claims mentioned above (subject identifier, session identifier, and/or display name).

For example:

```
var userSessions = await _sessionManagementService.QuerySessionsAsync(new SessionQuery
    {
        CountRequested = 10,
        SubjectId = "12345",
        DisplayName = "Bob",
    });
```

The results returned contains the matching users' session data, as well as paging information (depending if the store and backing database supports certain features such as total count and current page number).

This paging information contains a *ResultsToken* and allows subsequent requests for next or previous pages (set *RequestPriorResults* to true for the previous page, otherwise the next page is assumed):

```
// this requests the first page
var userSessions = await _sessionManagementService.QuerySessionsAsync(new SessionQuery
    {
        CountRequested = 10,
    });

// this requests the next page relative to the previous results
userSessions = await _sessionManagementService.QuerySessionsAsync(new SessionQuery
    {
        ResultsToken = userSessions.ResultsToken,
        CountRequested = 10,
    });

// this requests the prior page relative to the previous results
userSessions = await _sessionManagementService.QuerySessionsAsync(new SessionQuery
    {
        ResultsToken = userSessions.ResultsToken,
        RequestPriorResults = true,
        CountRequested = 10,
    });
```


### Terminating sessions

To terminate session(s) for a user, use the *RemoveSessionsAsync* API.
This accepts a *RemoveSessionsContext* which can filter on the subject and/or the session identifier to terminate.
It then also has flags for what to terminate or revoke.
This allows deleting a user's session record in the store, any associated tokens or consents in the [operational database]({{<ref "/data/operational/grants">}}), and/or notifying any clients via [back-channel logout]({{<ref "/ui/logout/notification#back-channel-server-side-clients">}}) that the user's session has ended.
There is also a list of client identifiers to control which clients are affected.

An example to revoke everything for current sessions for subject id *12345* might be:

```
await _sessionManagementService.RemoveSessionsAsync(new RemoveSessionsContext { 
    SubjectId = "12345"
});
```

Or to just revoke all refresh tokens for current sessions for subject id *12345* might be:

```
await _sessionManagementService.RemoveSessionsAsync(new RemoveSessionsContext { 
    SubjectId = "12345",
    RevokeTokens = true,
    RemoveServerSideSession = false,
    RevokeConsents = false,
    SendBackchannelLogoutNotification = false,
});
```

Internally this uses the *IServerSideTicketStore*, *IPersistedGrantStore* and *IBackChannelLogoutService* features from IdentityServer.
