---
title: "User Interaction"
weight: 15
---

These samples illustrate customization of the [interactive pages]({{< ref "/ui" >}}) used in your IdentityServer.

### SPA-style login page
This sample shows an example of building the interactive pages (login, consent, logout, and error) as client-rendered (typical of SPAs), rather than server-rendered. Since there are many different SPA frameworks, the actual pages are coded using vanilla JavaScript.

Key takeaways:

* how to handle the necessary request parameters
* how to contact the backend of IdentityServer to implement the various workflows (login, logout, etc.)
* how to implement a backend to support the frontend pages

[link to source code]({{< param samples_base >}}/UserInteraction/SpaLoginUi)
