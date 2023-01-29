---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---
Writing a browser-based application is challenging, particularly when it comes to security. The guidance for securing these types of applications changes frequently. In the past, cookies were used to secure Ajax calls, but it was later discovered that this method is vulnerable to cross-site request forgery (CSRF) attacks. The introduction of the implicit flow led to an increase in the use of JavaScript-based OAuth, but this also brought with it a new set of security issues such as cross-site scripting (XSS), token leakage, and the risk of token exfiltration.

Recognizing the limitations of the implicit flow, the Internet Engineering Task Force (IETF) has decided to deprecate it in [OAuth 2.1](https://tools.ietf.org/wg/oauth/draft-ietf-oauth-v2-1/). 

The newest guidance from the IETF is the [OAuth for Browser-Based Apps](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps) Best Current Practices (BCP) document, which describes how to secure browser-based applications using OAuth. The document differentiates between two architectural approaches: "JavaScript Applications with a Backend" and "JavaScript Applications without a Backend."

For applications without a backend, the recommended approach is to use the authorization code flow with PKCE and refresh tokens. However, this approach can be problematic as it encourages storing tokens in the browser, which increases the risk of token leakage and exfiltration. Dr. Philippe De Ryck's [webinar](https://pragmaticwebsecurity.com/talks/xssoauth.html), provides a good explanation of why this is not secure enough.

On the other hand, if you have a backend, it can assist the frontend with many security-related tasks such as protocol flow, token storage, token lifetime management, and session management, among other things. This approach, often called the BFF (Backend for Frontend) pattern, is particularly useful with the advent of more modern security features in browsers (e.g. anti-forgery countermeasures). 

Overall, the BFF pattern solves many of the security problems that can arise when developing browser-based applications, making it [our preferred approach](https://leastprivilege.com/2019/01/18/an-alternative-way-to-secure-spas-with-asp-net-core-openid-connect-oauth-2-0-and-proxykit/) for securing these types of applications.

#### "No tokens in the browser" Policy
Increasingly, organizations are becoming more aware of the risks associated with storing high-value access tokens in JavaScript-accessible locations and adopting a "No tokens in the browser" policy.

Risk comes to an application not only from its own code, which must be protected against XSS, CSRF, and other vulnerabilities, but also from the frameworks, libraries, and other NPM packages it uses, as well as all of their transitive dependencies. Additionally, other applications running on the same domain must also be secured. The recent [Spectre](https://www.securityweek.com/google-releases-poc-exploit-browser-based-spectre-attack) attacks against browsers serve as a reminder that new threats are constantly emerging.

Storing tokens on the server-side and using encrypted and signed HTTP-only cookies for session management greatly simplifies the threat model and reduces the risk. While this does not make the application "auto-magically" secure against content injection, it limits the attacker's ability to abuse a stolen token by forcing them to go through a well-defined interface to the backend which eliminates the possibility of arbitrary API calls.

#### React to changes in the browser security models
Browsers are increasingly restricting the use of cookies across site boundaries to protect user privacy. This can be a [problem](https://leastprivilege.com/2020/03/31/spas-are-dead/) for legitimate OAuth and OpenID Connect interactions, as these protocols are indistinguishable from common tracking mechanisms from a browser's perspective.

This affects several key areas of web security, including:

- Front-channel logout notifications, which are used in almost every authentication protocol, such as SAML, WS-Fed, and OpenID Connect
- [OpenID Connect Session Management](https://openid.net/specs/openid-connect-session-1_0.html)
- The "silent renew" technique that was previously recommended for session-bound token refreshing

To overcome these limitations, we need the help of an application backend. This can bridge the gap to the authentication system, provide more robust server-side token management with refresh tokens, and support more future-proof mechanisms such as back-channel logout notifications.

#### Simplify the JavaScript frontend protocol interactions and make use of advanced features that only exist server-side
And last but not least, writing a robust protocol library for JavaScript is not a trivial task. As of this writing, there are no OpenID Connect certified Relying Party libraries for JavaScript that are being actively maintained. Writing you own implementation requires protocol expertise and a substantial amount of on-going maintenance necessary due to subtle behavior changes between browsers and their versions.

In contrast, an ASP.NET Core server-side application has access to a full featured and stable OpenID Connect client library that supports all the necessary protocol mechanisms and provides an excellent extensibility model for advanced features like Mutual TLS, Proof-of-Possession, JWT secured authorization requests, and JWT-based client authentication.

### Enter Duende.BFF
Duende.BFF is a NuGet package that helps solve the security challenges associated with browser-based applications. It is designed for use with ASP.NET Core and provides a range of features including session and token management, API endpoint protection, and logout notifications for web-based frontends such as SPAs or Blazor WASM applications. In the next section, we will examine the individual components that make up Duende.BFF.