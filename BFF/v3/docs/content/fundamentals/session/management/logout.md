---
title: "BFF Logout Endpoint"
menuTitle: "Logout"
date: 2022-12-29T10:22:12+02:00
weight: 30
---

The */bff/logout* endpoint signs out of the appropriate ASP.NET Core [authentication schemes]({{< ref "handlers" >}}) to both delete the BFF's session cookie and to sign out from the remote identity provider. To use the logout endpoint, typically your javascript code will navigate away from your front end to the logout endpoint, similar to the login endpoint. However, unlike the login endpoint, the logout endpoint requires CSRF protection, otherwise an attacker could destroy sessions by making cross-site GET requests. The session id is used to provide this CSRF protection by requiring it as a query parameter to the logout endpoint (assuming that a session id was included during login). For convenience, the correct logout url is made available as a claim in the */bff/user* endpoint, making typical logout usage look like this:
 
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

## Revocation of Refresh Tokens
If the user has a refresh token, the logout endpoint can revoke it. This is enabled by default because revoking refresh tokens that will not be used any more is generally good practice. Normally any refresh tokens associated with the current session won't be used after logout, as the session where they are stored is deleted as part of logout. However, you can disable this revocation with the *RevokeRefreshTokenOnLogout* option.

