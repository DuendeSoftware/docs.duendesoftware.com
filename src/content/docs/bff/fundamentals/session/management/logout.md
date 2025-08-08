---
title: "BFF Logout Endpoint"
description: Learn how to use the BFF logout endpoint to sign out users and handle CSRF protection in your application
date: 2022-12-29T10:22:12+02:00
sidebar:
  label: "Logout"
  order: 30
redirect_from:
  - /bff/v2/session/management/logout/
  - /bff/v3/fundamentals/session/management/logout/
  - /identityserver/v5/bff/session/management/logout/
  - /identityserver/v6/bff/session/management/logout/
  - /identityserver/v7/bff/session/management/logout/
---

The */bff/logout* endpoint signs out of the appropriate ASP.NET Core [authentication schemes](/bff/fundamentals/session/handlers.mdx) to both delete the BFF's session cookie and to sign out from the remote identity provider. To use the logout endpoint, typically your javascript code will navigate away from your front end to the logout endpoint, similar to the login endpoint. However, unlike the login endpoint, the logout endpoint requires CSRF protection, otherwise an attacker could destroy sessions by making cross-site GET requests. The session id is used to provide this CSRF protection by requiring it as a query parameter to the logout endpoint (assuming that a session id was included during login). For convenience, the correct logout url is made available as a claim in the */bff/user* endpoint, making typical logout usage look like this:
 
```js
var logoutUrl = userClaims["bff:logout_url"]; // assumes userClaims is the result of a call to /bff/user
window.location = logoutUrl;
```

## Return Url
After signout is complete, the logout endpoint will redirect back to your front end application. By default, this redirect goes to the root of the application. You can use a different URL instead by including a local URL as the *returnUrl* query parameter. 
```js
var logoutUrl = userClaims["bff:logout_url"];
window.location = `${logoutUrl}&returnUrl=/logged-out`;
```

## Revocation Of Refresh Tokens
If the user has a refresh token, the logout endpoint can revoke it. This is enabled by default because revoking refresh tokens that will not be used anymore is generally good practice. Normally any refresh tokens associated with the current session won't be used after logout, as the session where they are stored is deleted as part of logout. However, you can disable this revocation with the *RevokeRefreshTokenOnLogout* option.

