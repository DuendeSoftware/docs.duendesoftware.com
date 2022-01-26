---
title: "Miscellaneous"
weight: 1000
---

### WebForms client
This sample shows how to add OpenID Connect code flow with PKCE to a .NET 4.8 WebForms client.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/various/WebFormsOidcClient)

### Securing Azure Functions
This sample shows how to parse and validate a JWT token issued by IdentityServer inside an Azure Function.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/various/JwtSecuredAzureFunction)

### Mutual TLS using Kestrel 
This sample shows how to use Kestrel using using MTLS for [client authentication]({{<ref "/tokens/authentication/mtls">}}) and [proof of possesion]({{<ref "/tokens/pop">}}) API access.
Using Kestrel will not likely be how MTLS is configured in a production environment, but it is convenient for local testing.
This approach requires DNS entries for *mtls.localhost* and *api.localhost* to resolve to *127.0.0.1*, and is easily configured by modifying your local *hosts* file.

[link to source code]({{< param samples_base >}}/MTLS)
