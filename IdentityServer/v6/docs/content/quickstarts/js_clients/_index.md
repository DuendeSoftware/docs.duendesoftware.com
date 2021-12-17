+++
title = "Building JavaScript client applications"
weight = 10
chapter = true
+++

# JavaScript/SPA Client Applications

When building JavaScript (or SPA) applications, there are two main styles.
Those with a backend and those without.

JavaScript applications **with a backend** allow for more security and thus is the preferred pattern (as described by the ["OAuth 2.0 for Browser-Based Apps" IETF/OAuth working group BCP document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)).
This style uses the ["Backend For Frontend" pattern](https://blog.duendesoftware.com/posts/20210326_bff/) (or "BFF" for short) which relies on the backend host to implement all of the security protocol interactions with the token server. The *Duende.BFF* library is used in this quickstart to easily support the BFF pattern.

JavaScript applications **without a backend** need to do all security interactions on the client-side code such as driving user authentication and token requests, session and token management, and token storage. This leads to more complex JavaScript, cross-browser incompatibilities and a considerably higher attack surface. Some of the newer browsers also recently added features that break some of those mechanisms.

Since ultimately you need to store your security sensitive artifacts (like tokens) in JavaScript reachable locations, this style is not encouraged for applications dealing with sensitive data.
