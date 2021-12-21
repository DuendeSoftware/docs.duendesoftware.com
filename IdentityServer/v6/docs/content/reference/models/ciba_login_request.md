---
title: "Backchannel User Login Request"
weight: 80
---

#### Duende.IdentityServer.Models.BackchannelUserLoginRequest

Models the information to initiate a user login request due to a [CIBA]({{< ref "/ui/ciba">}}) request.

* ***InternalId***
    
    Gets or sets the id of the request in the store.

* ***Subject***
    
    The subject for whom the login request is intended.

* ***BindingMessage***
    
    The binding message used in the request.

* ***AuthenticationContextReferenceClasses***
    
    The acr_values used in the request.

* ***Tenant***
    
    The tenant value from the acr_values used the request.

* ***IdP***
    
    The idp value from the acr_values used in the request.

* ***RequestedResourceIndicators***
    
    The resource values used in the request.

* ***Client***
    
    The client that initiated the request.

* ***ValidatedResources***
    
    The validated resources requested in the request.


