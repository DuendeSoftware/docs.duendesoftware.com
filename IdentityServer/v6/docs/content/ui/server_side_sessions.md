---
title: "Server-Side Sessions"
weight: 140
---

(added in v6.1)

## Overview

When a user logs in interactively, their authentication session is managed by the ASP.NET Core authentication system, and more specifically the cookie authentication handler.
IdentityServer uses the [state in the cookie]({{<ref "/ui/login/session#well-known-claims-issued-from-the-login-page">}}) to track the user's subject and session identifiers (i.e. the *sub* and *sid* claims), and the list of clients the user has logged into (which is used at logout time for [OIDC logout notification]({{<ref "/ui/logout/notification">}})).

By default, this cookie is self-contained which means it contains all the state needed to track a user's session.
While this does allow for a stateless server for session management, cookie size could be a problem, and it makes it difficult to know how many active user sessions there are in your system or revoke those sessions from an administrative standpoint.

IdentityServer provides a server-side session feature, which extends the ASP.NET Core cookie authentication handler to maintain this state in a server-side store, rather than putting it all into the cookie itself.
This implementation is specifically designed for IdentityServer to allow for more protocol related features, such as querying for active sessions based on subject id or session id, and revoking artifacts from protocol workflows as part of that session.

### Enabling server-side sessions

To enable server-side sessions, use the *AddServerSideSessions* extension method after adding IdentityServer to the DI system:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
        .AddServerSideSessions();
}
```

By default, the store for the server-side sessions will just be kept in-memory.
For production scenarios you will want to configure a durable store either by using our [EntityFramework Core implementation]({{<ref "/data/ef#operational-store">}}), or you can [implement the store yourself]({{<ref "/reference/stores/server_side_sessions">}}).

### Data stored server-side

The data stored for the user session is the data contained in the ASP.NET Core *AuthenticationTicket* class.
This data will be serialized and protected using ASP.NET Core's [data protection]({{<ref "/deployment/data_protection">}}) feature so as to protect any user PII.
Some of the values from the user's session are extracted and used as indices in the store so that specific sessions can be queried.
These values are the user's:

* subject identifier (the *sub* claim value)
* session identifier (the *sid* claim value)
* display name (an optional and configurable claim value)

If you would like to query this data based on a user's display name, then the claim type used is configurable with the *Authentication.UserDisplayNameClaimType* property on the [IdentityServerOptions]({{<ref "/reference/options#authentication">}}).
This claim must be included in the claims when the user's [authentication session is established]({{<ref "/ui/login/session">}}).

For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options => {
        options.Authentication.UserDisplayNameClaimType = "name"; // or "email" perhaps
    })
        .AddServerSideSessions();
}
```

## ISessionManagementService

The [session management service]({{<ref "/reference/services/session_management_service">}}) provides administrative operations for querying and revoking the server-side sessions.

{{% notice note %}}
The Quickstart UI contains a simple administrative page (under the "ServerSideSessions" folder) that uses the ISessionManagementService API.
{{% /notice %}}


### Querying sessions

Use the *QuerySessionsAsync* API to access a paged list of user sessions.
You can optionally filter on a user's claims mentioned above (subject identifier, session identifier, and/or display name).

For example:

```cs
var userSessions = await _sessionManagementService.QuerySessionsAsync(new SessionQuery
    {
        CountRequested = 10,
        SubjectId = "12345",
        DisplayName = "Bob",
    });
```

The results returned contains the matching users' session data, as well as paging information (depending if the store and backing database supports certain features such as total count and current page number).

This paging information contains a *ResultsToken* and allows subsequent requests for next or previous pages (set *RequestPriorResults* to true for the previous page, otherwise the next page is assumed):

```cs
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

```cs
await _sessionManagementService.RemoveSessionsAsync(new RemoveSessionsContext { 
    SubjectId = "12345"
});
```

Or to just revoke all refresh tokens for current sessions for subject id *12345* might be:

```cs
await _sessionManagementService.RemoveSessionsAsync(new RemoveSessionsContext { 
    SubjectId = "12345",
    RevokeTokens = true,
    RemoveServerSideSession = false,
    RevokeConsents = false,
    SendBackchannelLogoutNotification = false,
});
```

Internally this uses the *IServerSideTicketStore*, *IPersistedGrantStore* and *IBackChannelLogoutService* features from IdentityServer.
