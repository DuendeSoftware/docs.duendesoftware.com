---
title: "Redirecting Back To The Client"
description: "Guide to safely redirecting users back to client applications after login in IdentityServer, using the returnUrl parameter while protecting against open-redirect attacks and maintaining state throughout the authentication workflow."
sidebar:
  label: Redirects
  order: 30
redirect_from:
  - /identityserver/v5/ui/login/redirect/
  - /identityserver/v6/ui/login/redirect/
  - /identityserver/v7/ui/login/redirect/
---

Once the user has been logged in, they must complete the protocol workflow so they can ultimately be logged into the client.
To facilitate this, the login page is passed a `returnUrl` query parameter which refers to the URL the prior request came from.
This URL is, in essence, the same authorization endpoint to which the client made the original authorize request.

In the request to your login page where it logs the user in with a call to `SignInAsync`, it would then use the `returnUrl` to redirect the response back.
This will cause the browser to re-issue the original authorize request from the client allowing your IdentityServer to complete the protocol work.
An example of this redirect can be seen in the [local login](/identityserver/ui/login/local/) topic.

:::note
Beware [open-redirect attacks](https://en.wikipedia.org/wiki/URL_redirection#security_issues) via the `returnUrl` parameter. You should validate that the `returnUrl` refers to a well-known location.
Either use the `Url.IsLocalUrl` helper from ASP.NET Core, or use the [interaction service](/identityserver/reference/services/interaction-service/#iidentityserverinteractionservice-apis) from Duende IdentityServer for APIs to validate the `returnUrl` parameter.
:::

Keep in mind that this `returnUrl` is state that needs to be maintained during the user's login workflow.
If your workflow involves page post-backs, redirecting the user to an external login provider, or just sending the user through a custom workflow, then this value must be preserved across all of those page transitions.
