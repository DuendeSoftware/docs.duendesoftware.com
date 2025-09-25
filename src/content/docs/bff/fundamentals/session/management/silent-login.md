---
title: "BFF Silent Login Endpoint"
description: "Endpoint for non-interactive authentication using an existing session at the remote identity provider"
date: 2022-12-29T10:22:12+02:00
sidebar:
  label: "Silent Login"
  order: 35
redirect_from:
  - /bff/v2/session/management/silent-login/
  - /bff/v3/fundamentals/session/management/silent-login/
  - /identityserver/v5/bff/session/management/silent-login/
  - /identityserver/v6/bff/session/management/silent-login/
  - /identityserver/v7/bff/session/management/silent-login/
---

:::note
Deprecated. See [OIDC Prompt support](/bff/fundamentals/session/oidc-prompts.md) instead.
:::

**Added in v1.2.0.**

The */bff/silent-login* endpoint triggers authentication similarly to the login endpoint, but in a non-interactive way. 

The expected usage pattern is that the application code loads in the browser and triggers a request to the *User Endpoint*. If that indicates that there is no BFF session, then the *Silent Login Endpoint* can be requested to attempt to automatically log the user in, using an existing session at the remote identity provider.

This non-interactive design relies upon the use of an *iframe* to make the silent login request.
The result of the silent login request in the *iframe* will then use *postMessage* to notify the parent window of the outcome.
If the result is that a session has been established, then the application logic can either re-trigger a call to the *User Endpoint*, or reload the entire page (depending on the preferred design). If the result is that a session has not been established, then the application redirects to the login endpoint to log the user in interactively.

To trigger the silent login, the application code must have an *iframe* and then set its *src* to the silent login endpoint.
For example in your HTML:

```html
<iframe id="bff-silent-login"></iframe>
```

And then in JavaScript:

```javascript
document.querySelector('#bff-silent-login').src = '/bff/silent-login';
```

To receive the result, the application should handle the *message* event in the browser and look for the *data.isLoggedIn* property on the event object:

```javascript
window.addEventListener("message", e => {
  if (e.data && e.data.source === 'bff-silent-login' && e.data.isLoggedIn) {
      // we now have a user logged in silently, so reload this window
      window.location.reload();
  }
});
```
