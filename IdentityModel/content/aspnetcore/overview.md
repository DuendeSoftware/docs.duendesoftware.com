Overview
========

IdentityModel.AspNetCore is a helper library for ASP.NET Core web
applications and service worker applications.

It helps with access token lifetime management for pure machine to
machine communication and user-centric applications with refresh tokens.

For user-centric it provides:

-   storage abstraction for access and refresh tokens (default
```
implementation using the ASP.NET Core authentication session)
```
-   automatic refresh of expired access tokens
-   refresh token revocation
-   token lifetime automation for HttpClient

For worker services it provides:

-   caching abstraction for access tokens (default implementation using
```
`IDistributedCache`)
```
-   automatic renewal of expired access tokens
-   token lifetime automation for HttpClient

