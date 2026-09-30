---
title: "What Gets Cleaned Up At Logout: Sessions, Cookies And Tokens"
description: "An overview of everything that logout, session management, and token revocation can affect at sign-out: the IdentityServer cookie, server-side sessions, external provider sessions, client application sessions, refresh tokens, reference tokens, and back-channel logout."
sidebar:
  label: "Cleanup Overview"
  order: 15
---

Signing out of IdentityServer removes its authentication cookie. Depending on your setup, other parts of the
user's session may remain afterward, such as a session at an external identity provider or tokens issued to client
applications. The table below lists what remains after logout by default, with links to the pages that describe how to
remove it.

## Artifacts Overview

| Artifact                             | Where It Lives                           | Default At Logout                                                                        | How To Clean Up                                                                                                                                                                                |
|--------------------------------------|------------------------------------------|------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| IdentityServer authentication cookie | Browser, IdentityServer's cookie handler | Removed when you call `SignOutAsync`                                                     | [Removing the authentication cookie](/identityserver/ui/logout/session-cleanup.md#removing-the-authentication-cookie)                                                                          |
| Server-side session record           | IdentityServer's session store           | Removed automatically when `SignOutAsync` is called and server-side sessions are enabled | [Server-side sessions](/identityserver/ui/server-side-sessions/index.md)                                                                                                                       |
| External identity provider session   | The external IdP                         | Not signed out automatically                                                             | [External logins](/identityserver/ui/logout/external.md)                                                                                                                                       |
| Client application sessions/cookies  | Each client application                  | Not cleaned up unless the client is notified                                             | [Client notifications](/identityserver/ui/logout/notification.md)                                                                                                                              |
| Refresh tokens                       | IdentityServer's persisted grant store   | Kept unless coordination is enabled                                                      | [Revoking client tokens at logout](/identityserver/ui/logout/session-cleanup.md#revoking-client-tokens-at-logout)                                                                              |
| Reference access tokens              | IdentityServer's persisted grant store   | Kept unless coordination is enabled                                                      | [Revoking client tokens at logout](/identityserver/ui/logout/session-cleanup.md#revoking-client-tokens-at-logout)                                                                              |
| JWT access tokens                    | The client, self-contained               | Never revoked, they expire on their own                                                  | [Revocation endpoint](/identityserver/reference/v8/endpoints/revocation.md)                                                                                                                    |
| Consents and other persisted grants  | IdentityServer's persisted grant store   | Kept                                                                                     | [Session management service](/identityserver/reference/v8/services/session-management-service.md), [Persisted grant service](/identityserver/reference/v8/services/persisted-grant-service.md) |
| BFF session and refresh token        | The BFF host                             | Refresh token revoked by default when the BFF logout endpoint is used                    | [BFF logout](/bff/fundamentals/session/management/logout.md#revocation-of-refresh-tokens)                                                                                                      |

## Coordinating Token Lifetime With The User Session

Refresh tokens and reference access tokens are not tied to the user's session at IdentityServer, and stay valid
after logout until they expire. To revoke a client's tokens when the user's session ends, set
`CoordinateLifetimeWithUserSession` on the [client configuration](/identityserver/reference/v8/models/client.md#authentication--session-management),
or enable `CoordinateClientLifetimesWithUserSession` in
the [IdentityServer authentication options](/identityserver/reference/v8/options.md#authentication). See
[Revoking client tokens at logout](/identityserver/ui/logout/session-cleanup.md#revoking-client-tokens-at-logout) for
details.

## Sessions That End Without An Explicit Logout

With [server-side sessions](/identityserver/ui/server-side-sessions/index.md) enabled, a session can also end
without the user logging out, for example when it expires or an
[inactivity timeout](/identityserver/ui/server-side-sessions/inactivity-timeout.md) is reached.

When a server-side session expires, IdentityServer revokes the refresh tokens and reference access tokens of clients
with a coordinated token lifetime, and sends those clients a back-channel logout notification. Other clients in the
session are only notified when `ServerSideSessions.ExpiredSessionsTriggerBackchannelLogout` is set to `true`. This
option defaults to `false`. See [Back-channel logout](/identityserver/ui/server-side-sessions/session-expiration.mdx#back-channel-logout)
for details.

## Admin-Initiated Session Termination

To end a user's session from your own code, for example from an admin tool, use
`ISessionManagementService.RemoveSessionsAsync`. Use the `SubjectId`, `SessionId` and `ClientIds` properties of `RemoveSessionsContext` to select the sessions.
By default, it performs the following steps:

- Removes the server-side session
- Sends back-channel logout notifications
- Revokes refresh tokens and reference access tokens
- Revokes consents

You can turn off each step individually. See
[Terminating sessions](/identityserver/ui/server-side-sessions/session-management.md#terminating-sessions) and the
[Session management service reference](/identityserver/reference/v8/services/session-management-service.md).

## Client-Side Revocation

A client application can revoke its own refresh tokens and reference access tokens by calling the
[revocation endpoint](/identityserver/reference/v8/endpoints/revocation.md), for example when the user logs out of the
client. JWT access tokens cannot be revoked and remain valid until they expire, so keep their lifetime short.
