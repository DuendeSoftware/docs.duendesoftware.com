---
title: "Authorize Interaction Response Generator"
weight: 10
---

#### Duende.IdentityServer.ResponseHandling.IAuthorizeInteractionResponseGenerator

The *IAuthorizeInteractionResponseGenerator* interface models the logic for determining if user must login or consent when making requests to the authorization endpoint.

{{% notice note %}}
If a custom implementation of *IAuthorizeInteractionResponseGenerator* is desired, then it's [recommended]({{<ref "/ui/custom#built-in-authorizeinteractionresponsegenerator">}}) to derive from the built-in *AuthorizeInteractionResponseGenerator* to inherit all the default logic pertaining to login and consent semantics.
{{% /notice %}}


## IAuthorizeInteractionResponseGenerator APIs

* ***ProcessInteractionAsync***
    
    Returns the *InteractionResponse* based on the *ValidatedAuthorizeRequest* an and optional *ConsentResponse* if the user was shown a consent page.

## InteractionResponse

* ***IsLogin***
       
    Specifies if the user must login.

* ***IsConsent***
       
    Specifies if the user must consent.

* ***IsCreateAccount***

    Specifies if the user must create an account.

* ***IsError***
       
    Specifies if the user must be shown an error page.

* ***Error***
       
    The error to display on the error page.

* ***ErrorDescription***
       
    The description of the error to display on the error page.

* ***IsRedirect***
       
    Specifies if the user must be redirected to a custom page for custom processing.

* ***RedirectUrl***
       
    The URL for the redirect to the page for custom processing.
