---
title: "Backchannel Authentication Interaction Service"
order: 80
---

#### Duende.IdentityServer.Services.IBackchannelAuthenticationInteractionService

The *IBackchannelAuthenticationInteractionService* interface provides services for a user to access or complete a login requests for [CIBA](/identityserver/v6/ui/ciba).
It is available from the dependency injection system and would normally be injected as a constructor parameter into your MVC controllers for the user interface of IdentityServer.


## IBackchannelAuthenticationInteractionService APIs

* ***GetPendingLoginRequestsForCurrentUserAsync***
    
    Returns a collection of [BackchannelUserLoginRequest](/identityserver/v6/reference/models/ciba_login_request) objects which represent pending login requests for the current user.

* ***GetLoginRequestByInternalIdAsync***
    
    Returns the [BackchannelUserLoginRequest](/identityserver/v6/reference/models/ciba_login_request) object for the id.

* ***CompleteLoginRequestAsync***
    
    Completes the login request with the provided *CompleteBackchannelLoginRequest* response for the current user or the subject passed.


### CompleteBackchannelLoginRequest
Models the data needed for a user to complete a backchannel authentication request.

* ***InternalId***
    
    The internal store id for the request.

* ***ScopesValuesConsented***
    
    Gets or sets the scope values consented to. 
    Setting any scopes grants the login request.
    Leaving the scopes null or empty denies the request.

* ***Description***
    
    Gets or sets the optional description to associate with the consent.

* ***Subject***
    
    The subject for which the completion is being made.
    This allows more claims to be associated with the request that was identified on the backchannel authentication request.
    If not provided, then the *IUserSession* service will be consulting to obtain the current subject.

* ***SessionId***
    
    The session id to associate with the completion request if the Subject is provided. 
    If the Subject is not provided, then this property is ignored in favor of the session id provided by the *IUserSession* service.

