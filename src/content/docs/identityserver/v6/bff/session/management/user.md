---
title: "BFF User Endpoint"
menuTitle: "User"
date: 2022-12-29T10:22:12+02:00
weight: 25
---

The */bff/user* endpoint returns data about the currently logged-on user and the session. It is typically invoked at application startup to check if the user has authenticated, and if so, to get profile data about the user. It can also be used to periodically query if the session is still valid.

## Output
If there is no current session, the user endpoint returns a response indicating that the user is anonymous. By default, this is a 401 status code, but this can be [configured](#anonymous-session-response-option).

If there is a current session, the user endpoint returns a JSON array containing the claims in the ASP.NET Core authentication session as well as several BFF specific claims. For example:

```json
[
  {
    "type": "sid",
    "value": "173E788068FFB728806501F4F46C52D6"
  },
  {
    "type": "sub",
    "value": "88421113"
  },
  {
    "type": "idp",
    "value": "local"
  },
  {
    "type": "name",
    "value": "Bob Smith"
  },
  {
    "type": "bff:logout_url",
    "value": "/bff/logout?sid=173E788068FFB728806501F4F46C52D6"
  },
  {
    "type": "bff:session_expires_in",
    "value": 28799
  },
  {
    "type": "bff:session_state",
    "value": "q-Hl1V9a7FCZE5o-vH9qpmyVKOaeVfMQBUJLrq-lDJU.013E58C33C7409C6011011B8291EF78A"
  }
]
```

## User Claims
Since the user endpoint returns the claims that are in the ASP.NET Core session, anything that changes the session will be reflected in its output. You can customize the contents of the session via the OpenID Connect handler's [ClaimAction](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.claimactioncollectionmapextensions?view=aspnetcore-7.0) infrastructure, or by using [claims transformation](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.iclaimstransformation?view=aspnetcore-7.0). For example, if you add a [claim](/identityserver/v6/fundamentals/claims) to the [userinfo endpoint](../../../reference/endpoints/userinfo) at IdentityServer that you would like to include in the */bff/user* endpoint, you need to add a corresponding ClaimAction in the BFF's OpenID Connect Handler to include the claim in the BFF's session.

## Management Claims
In addition to the claims in the ASP.NET Core Session, Duende.BFF adds three additional claims:

**bff:session_expires_in**

This is the number of seconds the current session will be valid for.

**bff:session_state**

This is the session state value of the upstream OIDC provider that can be use for the JavaScript *check_session* mechanism (if provided).

**bff:logout_url**

This is the URL to trigger logout. If the upstream provider includes a *sid* claim, the BFF logout endpoint requires this value as a query string parameter for CSRF protection. This behavior can be configured with the *RequireLogoutSessionId* in the [options](/identityserver/v6/bff/options).

## Typical Usage
To use the endpoint, make an http GET request to it from your frontend javascript code. For example, your application could use the fetch api to make requests to the user endpoint like this:

```js
var req = new Request("/bff/user", {
  headers: new Headers({
    "X-CSRF": "1",
  }),
});

var resp = await fetch(req);
if (resp.ok) {
  userClaims = await resp.json();
  console.log("user logged in", userClaims);
} else if (resp.status === 401) {
  console.log("user not logged in");
}
```

## Cross-Site Request Forgery
To protect against cross-site request forgery, you need to add a [static header](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers) to the GET request. The header's name and required value can be configured in the [options](/identityserver/v6/bff/options).

## Anonymous Session Response Option
The *AnonymousSessionResponse* option allows you to change the behavior of the user endpoint to return 200 instead of 401 when the user is anonymous. If *AnonymousSessionResponse* is set to *AnonymousSessionResponse.Response200*, then the endpoint's response will set its status code to 200 and its payload will contain the literal *null* (the response body will be the characters 'n', 'u', 'l', 'l' without quotes).

## Cookie Sliding
If your ASP.NET Core session cookie is configured to use a sliding expiration, you need to be able to query the session state without extending the session's lifetime; a periodic check for user activity shouldn't itself count as user activity. To prevent the call to the user endpoint from sliding the cookie, add the *slide=false* parameter to the request.

```js
var req = new Request("/bff/user?slide=false", {
  headers: new Headers({
    "X-CSRF": "1",
  }),
});
```
:::note
The cookie sliding prevention feature requires either usage of server-side sessions or .NET 6 or higher (or both).
:::
