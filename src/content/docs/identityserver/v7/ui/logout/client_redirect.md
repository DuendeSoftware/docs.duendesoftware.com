---
title: "Returning to the Client"
weight: 60
---

If sign-out was initiated by a client application, then the client first redirected the user to the [end session endpoint](/identityserver/v7/reference/endpoints/end_session).
This can be determined if a `logoutId` is passed to the login page and the returned `LogoutRequest`'s `PostLogoutRedirectUri` is set.

## How to Redirect

If there is a `PostLogoutRedirectUri` value, then it's important how this URL is used to redirect the user.
The logout page typically should not directly redirect the user to this URL.
Doing so would skip the necessary [front-channel notifications](notification#front-channel-server-side-clients) to clients.

Instead, the typical approach is to render the `PostLogoutRedirectUri` as a link on the "logged out" page.
This will allow the page to render, the front-channel iframes will load and perform their duty. 
It's possible to add JavaScript to the page to enhance this experience even more.
