---
title: "Consent"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

During an authorization request, if user consent is required the browser will be redirected to the consent page.

{{% notice note %}}
You can configure the consent requirement per client. By default no consent is required, but this setting can be changed via the *RequireConsent* [setting]({{< ref "/reference/models/client#consent-screen" >}}).
{{% /notice %}}

Consent is used to allow an end user to grant a client access to [resources]({{< ref "/fundamentals/resources" >}}).

## Consent Page
In order for the user to grant consent, a consent page must be provided by the
hosting application. When IdentityServer needs to prompt the
user for consent, it will redirect the user to a configurable *ConsentUrl*. 
```
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.ConsentUrl = "/path/to/consent";
})
```
By default, the ConsentUrl is set to "/consent".  The quickstart UI includes a
basic implementation of a consent page at that route.

A consent page normally renders the display name of the current user, 
the display name of the client requesting access, 
the logo of the client, 
a link for more information about the client, 
and the list of resources the client is requesting access to.
It's also common to allow the user to indicate that their consent should be "remembered" so they are not prompted again in the future for the same client.

Once the user has provided consent, the consent page must inform your IdentityServer of the consent, and then the browser must be redirected back to the authorization endpoint. 

## Authorization Context
Your IdentityServer will pass a *returnUrl* parameter to the consent page which contains the parameters of the authorization request.
These parameters provide the context for the consent page, and can be read with help from the [interaction service]({{< ref "/reference/services/interaction_service" >}}).

The *GetAuthorizationContextAsync* API will return an instance of *AuthorizationRequest*. Additional details about the client or resources can be obtained using the *IClientStore* and *IResourceStore* interfaces. 

## Informing IdentityServer of the consent result
The *GrantConsentAsync* API on the [interaction service]({{< ref "/reference/services/interaction_service" >}}) allows the consent page to inform your IdentityServer of the outcome of consent (which might also be to deny the client access).

Your IdentityServer will temporarily persist the outcome of the consent.
This persistence uses a cookie by default, as it only needs to last long enough to convey the outcome back to the authorization endpoint.
This temporary persistence is different than the persistence used for the "remember my consent" feature (and it is the authorization endpoint which persists the "remember my consent" for the user).
If you wish to use some other persistence between the consent page and the authorization redirect, then you can implement *IMessageStore<ConsentResponse>* and register the implementation in DI.

## Returning the user to the authorization endpoint
Once the consent page has informed IdentityServer of the outcome, the user can be redirected back to the *returnUrl*. 
Your consent page should protect against open redirects by verifying that the *returnUrl* is valid.
This can be done by calling *IsValidReturnUrl* on the [interaction service]({{< ref "/reference/services/interaction_service" >}}).

Also, if *GetAuthorizationContextAsync* returns a non-null result, then you can also trust that the *returnUrl* is valid.



