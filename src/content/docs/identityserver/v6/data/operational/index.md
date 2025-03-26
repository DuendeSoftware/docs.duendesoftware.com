---
title: Operational Data
sidebar:
  order: 20
---


For certain operations, IdentityServer needs a persistence store to keep dynamically created state. 
This data is collectively called *operational data*, and includes:

* [Grants](grants) for authorization and device codes, reference and refresh tokens, and remembered user consent
* [Keys](keys) managing dynamically created signing keys
* [Server Side Sessions](sessions) for storing authentication session data for interactive users server-side
