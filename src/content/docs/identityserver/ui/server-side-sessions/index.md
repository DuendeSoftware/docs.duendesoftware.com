---
title: "Overview"
description: "An introduction to IdentityServer's server-side sessions feature, which stores authentication state on the server rather than in cookies for improved manageability and security."
sidebar:
  order: 1
redirect_from:
  - /identityserver/v5/ui/server_side_sessions/
  - /identityserver/v6/ui/server_side_sessions/
  - /identityserver/v7/ui/server_side_sessions/
---

:::tip
Added in Duende IdentityServer 6.1
:::

When a user logs in interactively, their authentication session is managed by the ASP.NET Core authentication system,
and more specifically the cookie authentication handler.
IdentityServer uses
the [state in the cookie](/identityserver/ui/login/session#well-known-claims-issued-from-the-login-page) to track the
user's subject and session identifiers (i.e. the `sub` and `sid` claims), and the list of clients the user has logged
into (which is used at logout time for [OIDC logout notification](/identityserver/ui/logout/notification)).

By default, this cookie is self-contained which means it contains all the state needed to track a user's session.
While this does allow for a stateless server for session management, cookie size could be a problem, and it makes it
difficult to know how many active user sessions there are in your system or revoke those sessions from an administrative
standpoint.

IdentityServer provides a server-side session feature, which extends the ASP.NET Core cookie authentication handler to
maintain this state in a server-side store, rather than putting it all into the cookie itself.
This implementation is specifically designed for IdentityServer to allow for more protocol related features, such as
querying for active sessions based on subject id or session id, and revoking artifacts from protocol workflows as part
of that session.

Support for Server Side Sessions is included in [IdentityServer](https://duendesoftware.com/products/identityserver)
Business Edition or higher.

## Session Management

With the addition and use of server-side sessions, more interesting architectural features are possible:

* the ability to query and [manage sessions](/identityserver/ui/server-side-sessions/session-management/) from outside the browser that a user is logged into.
* the ability to detect [session expiration](/identityserver/ui/server-side-sessions/session-expiration/) and perform cleanup both in IdentityServer and
  in the client.
* the ability to centralize and monitor session activity in order to achieve a
  system-wide [inactivity timeout](/identityserver/ui/server-side-sessions/inactivity-timeout/).

### Enabling Server-side Sessions

To enable server-side sessions, use the `AddServerSideSessions` extension method after adding IdentityServer to the DI
system:

```cs
// Program.cs
builder.Services.AddIdentityServer()
    .AddServerSideSessions();
```

By default, the store for the server-side sessions will just be kept in-memory.
For production scenarios you will want to configure a durable store either by using
our [EntityFramework Core implementation](/identityserver/data/ef#operational-store), or you
can [implement the store yourself](/identityserver/reference/stores/server-side-sessions/).

:::note
Order is important in the DI system.
When using `AddServerSideSessions`, this call needs to come after any custom `IRefreshTokenService` implementation that
has been registered.
:::

### Data Stored Server-side

The data stored for the user session is the data contained in the ASP.NET Core `AuthenticationTicket` class. This
includes
all claims and the `AuthenticationProperties.Items` collection. The `Items` can be used to store any custom (string)
data. The `AuthenticationProperties` is included in the call to `SignInAsync` that establishes the user session in the
UI code.

This data will be serialized and protected using ASP.NET
Core's [data protection](/identityserver/deployment#data-protection-keys) feature to protect any user PII from being
directly readable in the data store.
To allow querying some of the values from the user's session are extracted and used as indices in the store. These
values are the user's:

* subject identifier (the `sub` claim value)
* session identifier (the `sid` claim value)
* display name (an optional and configurable claim value)

If you would like to query this data based on a user's display name, then the claim type used is configurable with the
`ServerSideSessions.UserDisplayNameClaimType` property on
the [IdentityServerOptions](/identityserver/reference/options#authentication).
This claim must be included in the claims when the
user's [authentication session is established](/identityserver/ui/login/session).

For example:

```cs
// Program.cs
builder.Services.AddIdentityServer(options => {
    options.ServerSideSessions.UserDisplayNameClaimType = "name"; // or "email" perhaps
}).AddServerSideSessions();
```

### IServerSideSessionStore

The [`IServerSideSessionStore`](/identityserver/reference/stores/server-side-sessions) is the abstraction for storing
the server-side session.

A EntityFramework Core implementation is already provided as part of
our [operational store](/identityserver/data/ef#operational-store), but you can implement
the [interface](/identityserver/reference/stores/server-side-sessions/) yourself for other backing implementations.
