+++
title = "Extension Grants"
date = 2020-09-10T08:20:20+02:00
weight = 40
chapter = true
+++

# Extension Grants

OAuth defines an extensibility point called extension grants.

Extension grants allow adding support for non-standard token issuance scenarios, e.g.

* token transformation
    * SAML to JWT, or Windows to JWT
    * delegation or impersonation
* federation
* encapsulating custom input parameters

You can add support for additional grant types by implementing the [IExtensionGrantValidator]({{< ref "/reference/validators/extension_grant_validator" >}}) interface.
