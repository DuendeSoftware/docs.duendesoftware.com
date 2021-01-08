+++
title = "Users and User Interaction"
date = 2020-09-10T08:20:20+02:00
weight = 40
chapter = true
+++

# Users and User Interaction

Two important aspects of your IdentityServer that you get to control are 1) the user interface your users interact with, and 2) all the data for your users needed by your IdentityServer (which might include credentials and possibly profile data).

As browser requests are made to the protocol endpoints in your IdentityServer, they will be redirected to the interactive pages for the user to see. Depending on the features required, the pages expected in your IdentityServer are:
* [Login]({{< ref "./login" >}}): allows the user to login. This could be achieved with a local credential, or could utilize an external login provider (e.g. social or enterprise federation system).
* [Logout]({{< ref "./logout" >}}): allows the user to logout (including providing single sign-out).
* [Error]({{< ref "./error" >}}): display error information to the end user, typically when there are workflow errors.
* [Consent]({{< ref "./consent" >}}): allows the user to grant resource access to clients (typically only used if the client is third-party).

[Additional pages]({{< ref "./custom" >}}) that you might want are then also possible (e.g. password reset, registration), and those are typically available to the user as links from one of the above pages.

To implement any of the above pages, you will need to provide and use some identity management library for credentials and other user data.
This might be a legacy or custom user database, but it could also be a framework like [ASP.NET Identity](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/identity). We provide first class [integration support]({{< ref "/aspnet_identity" >}}) for ASP.NET Identity.

As your IdentityServer issues tokens for your users, it will likely require claims from your identity management library and user database.
You can implement the [profile service]({{< ref "/reference/profile_service" >}}) extensibility point to allow IdentityServer to obtain the claims for your users so they can be included in the tokens it issues.
