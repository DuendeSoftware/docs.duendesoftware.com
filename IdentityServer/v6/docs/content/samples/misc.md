---
title: "Miscellaneous"
date: 2020-09-10T08:22:12+02:00
weight: 1000
---

### WebForms client
This sample shows how to add OpenID Connect code flow with PKCE to a .NET 4.8 WebForms client.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/various/WebFormsOidcClient)

### Securing Azure Functions
This sample shows how to parse and validate a JWT token issued by IdentityServer inside an Azure Function.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/various/JwtSecuredAzureFunction)

### Client Initiated Backchannel Login (CIBA)
This sample shows how a client can make CIBA-style login requests using Duende IdentityServer.
To run the sample, the IdentityServer and API hosts should be started first.
Next run the ConsoleCibaClient which will initiate the backchannel login request.
The URL the user would receive to login and approve the request is being written out to the IdentityServer log (visible in the console window).
Follow that URL, login as "alice", and then approve the login request to allow the client to receive the results.

[link to source code]({{< param samples_base >}}/Ciba)

