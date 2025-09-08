---
title: "Backchannel User Login Request"
description: "Reference documentation for the BackchannelUserLoginRequest class which models the information needed to initiate a user login request for Client Initiated Backchannel Authentication (CIBA)."
sidebar:
  order: 80
redirect_from:
  - /identityserver/v5/reference/models/ciba_login_request/
  - /identityserver/v6/reference/models/ciba_login_request/
  - /identityserver/v7/reference/models/ciba_login_request/
---

## Duende.IdentityServer.Models.BackchannelUserLoginRequest

Models the information to initiate a user login request for [CIBA](/identityserver/ui/ciba.md).

* **`InternalId`**

  Ihe identifier of the request in the store.

* **`Subject`**

  The subject for whom the login request is intended.

* **`BindingMessage`**

  The binding message used in the request.

* **`AuthenticationContextReferenceClasses`**

  The acr_values used in the request.

* **`Tenant`**

  The tenant value from the acr_values used the request.

* **`IdP`**

  The idp value from the acr_values used in the request.

* **`RequestedResourceIndicators`**

  The resource indicator values used in the request.

* **`Client`**

  The client that initiated the request.

* **`ValidatedResources`**

  The validated resources (i.e. scopes) used in the request.
