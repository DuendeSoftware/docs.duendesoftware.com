---
title: "User Interaction"
order: 20
---

These samples illustrate customization of the [interactive pages](/identityserver/v5/ui) used in your IdentityServer.

### SPA-style login page
This sample shows an example of building the interactive pages (login, consent, logout, and error) as client-rendered (typical of SPAs), rather than server-rendered. Since there are many different SPA frameworks, the actual pages are coded using vanilla JavaScript.

Key takeaways:

* how to handle the necessary request parameters
* how to contact the backend of IdentityServer to implement the various workflows (login, logout, etc.)
* how to implement a backend to support the frontend pages

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v5/UserInteraction/SpaLoginUi)

### Adding other protocol types to dynamic providers

The [dynamic providers](/identityserver/v5/ui/login/dynamicproviders) feature allows for loading OpenID Connect identity provider configuration dynamically from a store. This sample shows how to extend the dynamic providers feature to support additional protocol types, and specifically WS-Federation.

Key takeaways:

* how to define a custom identity provider model
* how to map from the custom identity provider model to the protocol options
* how to register the custom protocol type with IdentityServer
* how to register the custom protocol type with IdentityServer
* how to use the existing provider store to persist custom provider model data

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v5/UserInteraction/WsFederationDynamicProviders)
