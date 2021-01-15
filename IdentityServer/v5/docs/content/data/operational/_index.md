+++
title = "Operational Data"
weight = 20
chapter = true
+++

# Operational Data

For certain operations, IdentityServer needs a persistence store to keep dynamically created state. 
This data is collectively called *operational data*, and includes:

* [Grants]({{<ref "./grants">}}) for authorization and device codes, reference and refresh tokens, and remembered user consent
* [Keys]({{<ref "./keys">}}) managing dynamically created signing keys

