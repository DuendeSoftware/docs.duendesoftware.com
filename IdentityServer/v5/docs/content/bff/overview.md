---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

Writing a browser-based application is hard, and when it comes to security the guidance changes every year. It all started with securing your Ajax calls with cookies until we learned that this is prone to CSRF attacks. Then the IETF made JS-based OAuth *official* by introducing the Implicit Flow - until we learned how hard it is to protect against XSS, token leakage and the threat of token ex-filtration. Seems you cannot win.

In the meantime the IETF realised that Implicit Flow is an anachronism and will deprecate it. So what's next?

There is on-going work in the [OAuth for browser-based Apps](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps) BCP document to give practical guidance on this very topic. The document distinguishes between two architectural approaches: "JavaScript Applications **with** a Backend" and "JavaScript Applications **without** a Backend". If you don't have the luxury of a backend, the more up-to-date recommendation is to use authorization code flow with PKCE and refresh tokens. We think this approach is problematic because it encourages storing your tokens in the browser.

If you have a backend, the backend can help out the frontend with many security related tasks like protocol flow, token storage, token lifetime management, session management etc. With the advent of more modern security features in browsers (e.g. SameSite cookies and CORS), this is our preferred approach and we already detailed this in January 2019 [here](https://leastprivilege.com/2019/01/18/an-alternative-way-to-secure-spas-with-asp-net-core-openid-connect-oauth-2-0-and-proxykit/). This is also often called the BFF (Backend for Frontend) pattern.

Let's have a closer look at all the problems the BFF pattern solves.

#### "No tokens in the browser" Policy
This is definitely the elephant in the room. More and more companies are coming to the conclusion that the threat of token ex-filtration is too big of an unknown and that no high value access tokens should be stored in JavaScript accessible locations.

It's not only your own code that must be XSS-proof. It's also all the frameworks, libraries and NPM packages you are pulling in (as well as their dependencies). And even worse, you have to worry about other people's code running on your host. The recent work around [Spectre](https://www.securityweek.com/google-releases-poc-exploit-browser-based-spectre-attack) attacks against browsers illustrates nicely that there is more to come.

Storing tokens on the server-side and using encrypted/signed HTTP-only cookies for session management makes that threat model considerably easier. This is not to say that this makes the application auto-magically secure against content injection, but forcing the attacker through a well defined interface to the backend gives you more leverage.

#### React to changes in the browser security models
We wrote about this [before](https://leastprivilege.com/2020/03/31/spas-are-dead/), but in a nutshell browsers are (and will be even more in the future) restricting the usage of cookies across site boundaries to protect users from privacy invasion techniques. The problem is that legitimate OAuth & OpenID Connect protocol interactions are from a browser's point of view indistinguishable from common tracking mechanisms.

This affects:

- front-channel logout notifications (used in pretty much every authentication protocol – like SAML, WS-Fed and OpenID Connect)
- the OpenID Connect JavaScript session management
- the “silent renew” technique that was recommended to give your application session bound token refreshing

To overcome these limitations we need the help of an application backend to bridge the gap to the authentication system, do more robust server-side token management with refresh tokens, and provide support for more future proof mechanisms like back-channel logout notifications.

#### Simplify the JavaScript frontend protocol interactions and make use of advanced features that only exist server-side
And last but not least, writing a robust protocol library for JavaScript is not a trivial task. We are maintaining one of the original OpenID Connect certified JavaScript [libraries](https://github.com/IdentityModel/oidc-client-js), and there is a substantial amount of on-going maintenance necessary due to subtle behaviour changes between browsers and their versions.

On the server-side though (and especially in our case with ASP.NET Core), we have a full featured and stable OpenID Connect client library that supports all the necessary protocol mechanisms and provides an excellent extensibility model for advanced features like Mutual TLS, Proof-of-Possession, JWT secured authorization requests, and JWT-based client authentication.

### Enter Duende.BFF
Duende.BFF is Nuget package that adds all the necessary features required to solve above problems to an ASP.NET Core host. It provides services for session and token management, API endpoint protection and logout notifications to your web-based frontends like SPAs or Blazor WASM applications. Let's have a look at the building blocks in the next section.