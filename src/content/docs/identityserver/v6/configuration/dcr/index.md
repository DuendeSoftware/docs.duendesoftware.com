---
title: "Dynamic Client Registration"
order: 95
chapter: true
---

Dynamic Client Registration (DCR) is the process of registering OAuth clients
dynamically. The client provides information about itself and specifies its
desired configuration in an HTTP request to the configuration endpoint. The
endpoint will then create the necessary client configuration and return an HTTP
response describing the new client, if the request is authorized and valid.

DCR eliminates the need for a manual registration process, making it more
efficient and less time-consuming to register new clients.

TODO LIST CHILDREN HERE