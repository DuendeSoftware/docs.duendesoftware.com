---
title: "User Session Service"
order: 55
---

The *IUserSession* interface is the contract for a service that manages the user's session and tracks the clients that are participating in the session.

User sessions are identified by the session identifier, which is a unique random number assigned when the user initially logs in. When client applications request tokens for a flow that involves a user, that client application's id is recorded in the user's session. Using that information, IdentityServer can determine which applications are participating in the current session. This can be useful for various purposes, but most notably, at signout time, IdentityServer sends logout notifications to the clients that are participating in the session that is ending.

The *IUserSession* interface also contains methods for manipulating the session cookie. The session cookie contains a copy of the session id value, and is used by IdentityServer's implementation of OIDC session management. The session id cookie's name is controlled by the *IdentityServerOptions.Authentication.CheckSessionCookieName* option, which defaults to "idsrv.session".

The default implementation of the *IUserSession* is the *DefaultUserSession* class. It stores the session identifier and client list in the authentication properties. 

### Duende.IdentityServer.Services.IUserSession

#### Members
| name                                                                                              | description                                                                                |
|---------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Task<string> CreateSessionIdAsync(ClaimsPrincipal principal, AuthenticationProperties properties) | Creates a session id and issues the session id cookie.                                     |
| Task<ClaimsPrincipal> GetUserAsync()                                                              | Gets the current authenticated user.                                                       |
| Task<string?> GetSessionIdAsync()                                                                 | Gets the current session identifier.                                                       |
| Task EnsureSessionIdCookieAsync()                                                                 | Ensures the session identifier cookie is synchronized with the current session identifier. |
| Task RemoveSessionIdCookieAsync()                                                                 | Removes the session identifier cookie.                                                     |
| Task AddClientIdAsync(string clientId)                                                            | Adds a client to the list of clients the user has signed into during their session.        |
| Task<IEnumerable<string>> GetClientListAsync()                                                    | Gets the list of clients the user has signed into during their session.                    |

#### GetUserAsync
Generally *GetUserAsync* should be preferred over *IAuthenticationService.AuthenticateAsync* for two reasons:
- It does not cause claims transformation to run, which prevents issues where a claims transformation is run more than once.
- It has a cache of the authentication result which is updated whenever a new authentication cookie is issued. Calls to *SignInAsync* that issue an updated authentication ticket will be reflected immediately in *GetUserAsync*, while *AuthenticateAsync*'s results will  reflect the incoming authentication cookie throughout the entire duration of an HTTP request.  
