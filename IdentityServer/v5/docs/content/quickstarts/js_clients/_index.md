+++
title = "Building JavaScript client applications"
weight = 5
chapter = true
+++

# JavaScript/SPA Client Applications

When building JavaScript (or SPA) applications, there are two main styles.
Those with a backend and those without.

JavaScript applications **with a backend** allow for more security and thus is the preferred pattern (as described by the ["OAuth 2.0 for Browser-Based Apps" IETF/OAuth working group BCP document](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)).
This style uses the ["Backend For Frontend" pattern](https://blog.duendesoftware.com/posts/20210326_bff/) (or "BFF" for short) which relies on the backend host to implement all of the security protocol interactions with the token server. The *Duende.BFF* library is used in this quickstart to easily support the BFF pattern.

JavaScript applications **without a backend** allow for less infrastructure, but more complex JavaScript which leads to cross-browser incompatabilities and a considerably higher attack surface. This pattern was more common before the IETF/OAuth working group BCP document was published, and has since fallen out of favor.

{{%children style="h4" %}}
