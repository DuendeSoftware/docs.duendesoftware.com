---
title: "Third Party Cookies"
weight: 12
---

If the BFF and OpenID Connect Provider (OP) are hosted on different [sites](https://developer.mozilla.org/en-US/docs/Glossary/Site), then some browsers will block cookies from being sent during navigation between those sites. Almost all browsers have the option of blocking third party cookies. Safari and Firefox are the most widely used browsers that do so by default, while Chrome is planning to do so in the future. This change is being made to protect user privacy, but it also impacts OIDC flows traditionally used by SPAs. 

A couple of particularly notable OIDC flows that don't work for SPAs when third party cookies are blocked are [OIDC Session Management](https://openid.net/specs/openid-connect-session-1_0.html) and [OIDC Silent Login via the prompt=none parameter](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest).

## Session Management

OIDC Session Management allows a client SPA to monitor the session at the OP by reading a cookie from the OP in a hidden iframe. If third party cookie blocking prevents the iframe from seeing that cookie, the SPA will not be able to monitor the session. The BFF solves this problem using [OIDC back-channel logout]({{<ref "/bff/session/management/back-channel-logout" >}}). 

The BFF is able to operate server side, and is therefore able to have a back channel to the OP. When the session ends at the OP, it can send a back-channel message to the BFF, ending the session at the BFF.

## Silent Login
OIDC Silent Login allows a client application to start its session without needing any user interaction if the OP has an ongoing session. The main benefit is that a SPA can load in the browser and then start a session without navigating away from the SPA for an OIDC flow, preventing the need to reload the SPA.

Similarly to OIDC Session Management, OIDC Silent Login relies on a hidden iframe, though in this case, the hidden iframe makes requests to the OP, passing the *prompt=none* parameter to indicate that user interaction isn't sensible. If that request includes the OP's session cookie, the OP can respond successfully and the application can obtain tokens. But if the request does not include a session - either because no session has been started or because the cookie has been blocked - then the silent login will fail, and the user will have to be redirected to the OP for an interactive login.

### BFF with a Federation Gateway

The BFF supports silent login from the SPA with the /bff/silent-login [endpoint]({{<ref "/bff/session/management/silent-login">}}). This endpoint is intended to be invoked in an iframe and issues a challenge to login non-interactively with *prompt=none*. Just as in a traditional SPA, this technique will be disrupted by third party cookie blocking when the BFF and OP are third parties.

If you need silent login with a third party OP, we recommend that you use the [Federation Gateway]({{<ref "/ui/federation" >}}) pattern. In the federation gateway pattern, one identity provider (the gateway) federates with other remote identity providers. Because the client applications only interact with the gateway, the implementation details of the remote identity providers are abstracted. In this case, we shield the client application from the fact that the remote identity provider is a third party by hosting the gateway as a first party to the client. This makes the client application's requests for silent login always first party.


### Alternatives
Alternatively, you can accomplish a similar goal (logging in without needing to initially load the SPA, only to redirect away from it) by detecting that the user is not authenticated in the BFF and issuing a challenge before the site is ever loaded. This approach is not typically our first recommendation, because it makes allowing anonymous access to parts of the UI difficult and because it requires *samesite=lax* cookies (see below).



