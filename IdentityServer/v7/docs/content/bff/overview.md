---
title: "Overview"
description: "BFF"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

Duende.BFF is a library for building services that solve security and identity problems in browser based applications such as SPAs and Blazor WASM applications. It is used to create a backend host that is paired with a frontend application. This backend is called the Backend For Frontend (BFF) host, and is responsible for all of the OAuth and OIDC protocol interactions. Moving the protocol handling out of JavaScript provides important security benefits and works around changes in browser privacy rules that increasingly disrupt OAuth and OIDC protocol flows in browser based applications. The Duende.BFF library makes it easy to build and secure BFF hosts by providing [session and token management]({{< ref "/bff/session" >}}), [API endpoint protection]({{< ref "/bff/apis" >}}), and [logout notifications]({{< ref "/bff/session/management/back-channel-logout" >}}).

## Threats against browser based applications

Browser based applications have a relatively large attack surface. Security risks come not only from the application's own code, which must be protected against cross site scripting, cross site request forgery, and other vulnerabilities, but also from the frameworks, libraries, and other NPM packages it uses, as well as all of their transitive dependencies. Additionally, other applications running on the same site must also be secured. The recent [Spectre](https://www.securityweek.com/google-releases-poc-exploit-browser-based-spectre-attack) attacks against browsers serve as a reminder that new threats are constantly emerging. Given all of these risks, we do not recommend storing high-value access tokens or refresh tokens in JavaScript-accessible locations.

In Duende.BFF, tokens are only accessible server-side and sessions are managed using encrypted and signed HTTP-only cookies. This greatly simplifies the threat model and reduces risk. While  content injection attacks are still possible, the BFF limits the attacker's ability to abuse APIs by constraining access through a well-defined interface to the backend which eliminates the possibility of arbitrary API calls.

## Changes in browser privacy rules
Browsers are increasingly restricting the use of cookies across site boundaries to protect user privacy. This can be a [problem](https://leastprivilege.com/2020/03/31/spas-are-dead/) for legitimate OAuth and OpenID Connect interactions, as some interactions in these protocols are indistinguishable from common tracking mechanisms from a browser's perspective. When the identity provider and client application are hosted on 3rd party sites, this affects several flows, including:

- Front-channel logout notifications
- [OpenID Connect Session Management](https://openid.net/specs/openid-connect-session-1_0.html)
- The "silent renew" technique for session-bound token refreshing

Using a BFF removes or mitigates all of these problems in the design. The backend component makes backchannel logout notifications possible, while still allowing the option of front-channel notifications for 1st party clients. Robust server-side session and token management with optional server-side sessions and refresh tokens take the place of OIDC Session Management and older token refresh mechanisms. As an ASP.NET Core server-side application, the BFF has access to a full featured and stable OpenID Connect client library that supports all the necessary protocol mechanisms and provides an excellent extensibility model for advanced features like [Mutual TLS]({{<ref "/tokens/pop/mtls" >}}), [DPoP]({{<ref "/tokens/pop/dpop" >}}), [JWT secured authorization requests]({{<ref "/tokens/jar">}}), and [JWT-based client authentication]({{<ref "/tokens/authentication/jwt">}}).
