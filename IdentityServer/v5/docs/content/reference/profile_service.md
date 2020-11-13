---
title: "Profile Service"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

#### Duende.IdentityServer.Services.IProfileService

Often IdentityServer requires identity information about users when creating tokens or when handling requests to the userinfo or introspection endpoints.
By default, IdentityServer only has the claims from the session to draw upon for this identity data.

It is impractical to put all of the possible claims needed for users into the session, so IdentityServer defines an extensibility point for allowing claims to be dynamically loaded as needed for a user.

This extensibility point is the *IProfileService* and it is common for a developer to implement this interface to access a custom database or API that contains the identity data for users.

```cs
public class SampleProfileService : IProfileService
{
    public virtual Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        context.LogProfileRequest(Logger);
        context.AddRequestedClaims(context.Subject.Claims);
        context.LogIssuedClaims(Logger);

        return Task.CompletedTask;
    }

    public virtual Task IsActiveAsync(IsActiveContext context)
    {
        context.IsActive = true;
        return Task.CompletedTask;
    }
}
```

## IProfileService APIs

* ***GetProfileDataAsync***
    
    The API that is expected to load claims for a user. It is passed an instance of *ProfileDataRequestContext*.

* ***IsActiveAsync***
    
    The API that is expected to indicate if a user is currently allowed to obtain tokens. It is passed an instance of *IsActiveContext*.

## ProfileDataRequestContext
Models the request for user claims and is the vehicle to return those claims. It contains these properties:

* ***Subject***
    
    The *ClaimsPrincipal* modeling the user.

* ***Client***
    
    The *Client* for which the claims are being requested.

* ***RequestedClaimTypes***
    
    The collection of claim types being requested. This data is source from the requested scopes and their associated claim types.

* ***Caller***
    
    An identifier for the context in which the claims are being requested (e.g. an identity token, an access token, or the user info endpoint. The constant *IdentityServerConstants.ProfileDataCallers* contains the different constant values.

* ***IssuedClaims***

    The list of claims that will be returned. This is expected to be populated by the custom *IProfileService* implementation.

* ***AddRequestedClaims***

    Extension method on the *ProfileDataRequestContext* to populate the *IssuedClaims*, but first filters the claims based on *RequestedClaimTypes*.

## Requested scopes and claims mapping
The scopes requested by the client control what user claims are returned in the tokens to the client. 

The *GetProfileDataAsync* method is responsible for dynamically obtaining those claims based on the *RequestedClaimTypes* collection on the *ProfileDataRequestContext*.

The *RequestedClaimTypes* collection is populated based on the user claims defined on the requested resources (TODO: link to resource design) that model the scopes.

## IsActiveContext
Models the request to determine if the user is currently allowed to obtain tokens. It contains these properties:

* ***Subject***
    
    The *ClaimsPrincipal* modeling the user.

* ***Client***
    
    The *Client* for which the claims are being requested.

* ***Caller***
    
    An identifier for the context in which the claims are being requested (e.g. an identity token, an access token, or the user info endpoint. The constant *IdentityServerConstants.ProfileDataCallers* contains the different constant values.

* ***IsActive***
    
    The flag indicating if the user is allowed to obtain tokens. This is expected to be assigned by the custom *IProfileService* implementation.
