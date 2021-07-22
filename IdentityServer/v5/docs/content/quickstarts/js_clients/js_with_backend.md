---
title: "JavaScript applications with a backend"
weight: 1
---

{{% notice note %}}
For any pre-requisites (like e.g. templates) have a look at the [Quickstarts Overview]({{< ref "0_overview" >}}) first.
{{% /notice %}}

This quickstart will show how to build a browser-based JavaScript client application with a backend. 
This means your application will have server-side code that can support the frontend application code.
In this quickstart we will be implementing the BFF pattern (with the help of the *Duende.BFF* library), which means the backend implements all of the security protocol interactions with the token server.
This simplifies the JavaScript in the client-side, and reduces the attack surface of the application.

The features that will be shown in this quickstart will allow the user will login with IdentityServer, invoke the web API with an access token issued by IdentityServer, and logout of IdentityServer.

