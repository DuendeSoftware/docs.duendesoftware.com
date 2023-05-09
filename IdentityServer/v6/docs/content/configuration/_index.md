---
title: "Dynamic Client Registration"
weight: 95
chapter: true
---

# Dynamic Client Registration 
Dynamic Client Registration (DCR) is the process of registering OAuth clients dynamically. The client provides information about itself and specifies its desired configuration in an HTTP request to the configuration endpoint. The endpoint will then create the necessary client configuration and return an HTTP response describing the new client, if the request is authorized and valid.

DCR eliminates the need for a manual registration process, making it more efficient and less time-consuming to register new clients.

Duende's support for DCR is the first protocol that we are supporting as part of
a larger effort to provide configuration tools for IdentityServer. As we expand
the suite of configuration tools, they will be collectively be distributed
through the [Duende.IdentityServer.Configuration nuget
package](https://www.nuget.org/packages/Duende.IdentityServer.Configuration).

The Configuration API's source code is available [on github](https://github.com/DuendeSoftware/IdentityServer/tree/main/src/Configuration).

