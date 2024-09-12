+++
title = "Building Browser-Based Client Applications"
weight = 10
chapter = true
+++

# JavaScript/SPA Client Applications

When building browser-based or SPA applications, there are two main styles: those
with a backend and those without.

JavaScript applications **with a backend** are more secure, making it the
recommended style. This style uses the ["Backend For Frontend"
pattern](https://blog.duendesoftware.com/posts/20210326_bff/), or "BFF" for
short, which relies on the backend host to implement all of the security
protocol interactions with the token server. The *Duende.BFF* library is used in
[this quickstart]({{< ref "js_with_backend.md" >}}) to easily support the BFF pattern.

JavaScript applications **without a backend** need to do all the security
protocol interactions on the client-side, including driving user authentication
and token requests, session and token management, and token storage. This leads
to more complex JavaScript, cross-browser incompatibilities, and a considerably
higher attack surface. Since this style inherently needs to store security
sensitive artifacts (like tokens) in JavaScript reachable locations, this style
is not recommended. **Consequently we don't offer a quickstart for this style**.

As the ["OAuth 2.0 for Browser-Based Apps" IETF/OAuth working group BCP
document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
says:
>there is no browser API that allows to store tokens in a completely secure way. 

Additionally, modern browsers have recently added or are planning to add privacy
features that can break some front-channel protocol interactions. See 
[here]({{< ref "/bff/overview#react-to-changes-in-the-browser-security-models" >}}) 
for more details.
