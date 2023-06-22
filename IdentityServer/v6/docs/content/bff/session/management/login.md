---
title: "BFF Login Endpoint"
menuTitle: "Login"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

The */bff/login* endpoint begins the authentication process. To use it, typically javascript code will navigate away from the frontend application to the login endpoint:
 
```js
window.location = "/bff/login";
```

In Blazor, instead use the *NavigationManager* to navigate to the login endpoint:

```cs
Navigation.NavigateTo($"bff/login", forceLoad: true);
```

The login endpoint triggers an authentication challenge using the default challenge scheme, which will typically use the OpenID Connect [handler]({{< ref "handlers" >}}).

## Return Url
After authentication is complete, the login endpoint will redirect back to your front end application. By default, this redirect goes to the root of the application. You can use a different URL instead by including a local URL as the *returnUrl* query parameter. 
```js
window.location = "/bff/login?returnUrl=/logged-in";
```
