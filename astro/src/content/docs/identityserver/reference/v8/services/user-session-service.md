---
title: "User Session Service"
description: Documentation for the IUserSession interface which manages user sessions and tracks participating client applications for authentication and logout coordination.
sidebar:
  label: User Session
  order: 55
redirect_from:
  - /identityserver/v5/reference/services/user_sesion_service/
  - /identityserver/v6/reference/services/user_sesion_service/
  - /identityserver/v7/reference/services/user_sesion_service/
  - /identityserver/v5/reference/services/user_session_service/
  - /identityserver/v6/reference/services/user_session_service/
  - /identityserver/v7/reference/services/user_session_service/
  - /identityserver/reference/services/user-session-service/
---

The `IUserSession` interface is the contract for a service that manages the user's session and tracks the clients that
are participating in the session.

User sessions are identified by the session identifier, which is a unique random number assigned when the user initially
logs in. When client applications request tokens for a flow that involves a user, that client application's id is
recorded in the user's session. Using that information, IdentityServer can determine which applications are
participating in the current session. This can be useful for various purposes, but most notably, at signout time,
IdentityServer sends logout notifications to the clients that are participating in the session that is ending.

The `IUserSession` interface also contains methods for manipulating the session cookie. The session cookie contains a
copy of the session id value, and is used by IdentityServer's implementation of OIDC session management. The session id
cookie's name is controlled by the `IdentityServerOptions.Authentication.CheckSessionCookieName` option, which defaults
to "idsrv.session".

The default implementation of the `IUserSession` is the `DefaultUserSession` class. It stores the session identifier and
client list in the authentication properties.

### Duende.IdentityServer.Services.IUserSession

#### Members

| name                                                                                                                    | description                                                                                                                         |
|-------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Task<string> CreateSessionIdAsync(ClaimsPrincipal principal, AuthenticationProperties properties, CancellationToken ct) | Creates a session id and issues the session id cookie.                                                                              |
| Task<ClaimsPrincipal?> GetUserAsync(CancellationToken ct)                                                               | Gets the current authenticated user.                                                                                                |
| Task<string?> GetSessionIdAsync(CancellationToken ct)                                                                   | Gets the current session identifier.                                                                                                |
| Task EnsureSessionIdCookieAsync(CancellationToken ct)                                                                   | Ensures the session identifier cookie is synchronized with the current session identifier.                                          |
| Task RemoveSessionIdCookieAsync(CancellationToken ct)                                                                   | Removes the session identifier cookie.                                                                                              |
| Task AddClientIdAsync(string clientId, CancellationToken ct)                                                            | Adds a client to the list of clients the user has signed into during their session.                                                 |
| Task<IReadOnlyCollection<string>> GetClientListAsync(CancellationToken ct)                                              | Gets the list of clients the user has signed into during their session.                                                             |
| Task AddSamlSessionAsync(SamlSpSessionData session, CancellationToken ct)                                               | Adds a SAML SP session to the user's session. <span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>             |
| Task<IReadOnlyCollection<SamlSpSessionData>> GetSamlSessionListAsync(CancellationToken ct)                              | Gets the list of SAML SP sessions for the user's session. <span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span> |
| Task RemoveSamlSessionAsync(string entityId, CancellationToken ct)                                                      | Removes a SAML SP session by EntityId. <span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>                    |

The three SAML session methods (`AddSamlSessionAsync`, `GetSamlSessionListAsync`, `RemoveSamlSessionAsync`) are used by the [SAML 2.0 Identity Provider](/identityserver/saml/) feature. If you have a custom `IUserSession` implementation but are not using SAML, these methods can return `Task.CompletedTask` or an empty collection as appropriate.

#### GetUserAsync

Generally `GetUserAsync` should be preferred over `IAuthenticationService.AuthenticateAsync` for two reasons:

- It does not cause claims transformation to run, which prevents issues where a claims transformation is run more than
  once.
- It has a cache of the authentication result which is updated whenever a new authentication cookie is issued. Calls to
  `SignInAsync` that issue an updated authentication ticket will be reflected immediately in `GetUserAsync`, while
  `AuthenticateAsync`'s results will reflect the incoming authentication cookie throughout the entire duration of an
  HTTP request.  
