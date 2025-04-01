---
title: "Client Application Portal"
sidebar:
  order: 160
---

(Added in 6.3)

You can create a client application portal within your IdentityServer host that contains links to client applications that are configured with an `InitiateLoginUri`. `InitiateLoginUri` is an optional URI that can be used to [initiate login](https://openid.net/specs/openid-connect-core-1_0.html#thirdpartyinitiatedlogin). Your IdentityServer host can check for clients with this property and render links to those applications. 

Those links are just links to pages within your client applications that will start an OIDC challenge when the user follows them. This creates a curious pattern, where the user follows a link from the portal page in the IdentityServer host to an external application only to have that application immediately redirect back to the IdentityServer host's `/connect/authorize` endpoint. However, if the user has logged in and created a session at the IdentityServer host, they will get a single sign on experience as they navigate to the various applications in the portal.

The quickstart UI contains an example of such a portal in the `~/portal` razor page.