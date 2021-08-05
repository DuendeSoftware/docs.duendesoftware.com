---
title: "Custom Pages"
weight: 50
---

In addition to the pages your IdentityServer is expected to provide, you can add any other pages you wish. 
These could be pages needed during login (e.g. registration, password reset), self-service pages to allow the user to manage their profile (e.g. change password, change email), or even more specialized pages for various user workflows (e.g. password expired, or EULA).

These custom pages can be made available to the end user as links from the standard pages in your IdentityServer (i.e. login, consent), they can be rendered to the user during during login page workflows, or they could be displayed as a result of requests into the authorize endpoint.

## Authorize Endpoint Requests and Custom Pages

As requests are made into the authorize endpoint, if a user already has an established authentication session then they will not be presented with a login page at your IdentityServer (as that is the normal expectation for single sign-on).

Duende IdentityServer provides the [authorize interaction response generator]({{<ref "/reference/response_handling/authorize_interaction_response_generator">}}) extensibility point to allow overriding or controlling the response from the authorize endpoint.

### Built-in AuthorizeInteractionResponseGenerator

To provide custom logic for the authorize endpoint, the recommondation is to derive from the built-in *AuthorizeInteractionResponseGenerator* to inherit all the default logic pertaining to login and consent semantics.
To augment the built-in logic, override *ProcessLoginAsync* and/or *ProcessConsentAsync* (depending on the nature of the custom logic).
The pattern would be to invoke the base implementation and if the result did not cause a login, consent or error, then the custom logic could be tested to determine if it is desired to prevent SSO and instead force the user to interact in some way (e.g. re-login, trigger MFA, accept a EULA, etc).
The sample below illustrates:

```cs
public class CustomAuthorizeInteractionResponseGenerator : AuthorizeInteractionResponseGenerator
{
    public CustomAuthorizeInteractionResponseGenerator(IdentityServerOptions options, ISystemClock clock, ILogger<AuthorizeInteractionResponseGenerator> logger, IConsentService consent, IProfileService profile) 
        : base(options, clock, logger, consent, profile)
    {
    }

    protected internal override async Task<InteractionResponse> ProcessLoginAsync(ValidatedAuthorizeRequest request)
    {
        var result = await base.ProcessLoginAsync(request);

        if (!result.IsLogin && !result.IsError)
        {
            // check EULA database
            var mustShowEulaPage = HasUserAcceptedEula(request.Subject);
            if (!mustShowEulaPage)
            {
                result = new InteractionResponse { 
                    RedirectUrl = "/eula/accept"
                };
            }
        }

        return result;
    }
}
```

### Custom Redirects

When using custom redirect pages by setting the *RedirectUrl* on the *InteractionResponse*, IdentityServer will provide a *returnUrl* query parameter with the request (much like on the login page).
Once the custom logic is complete on the page, then the URL in the *returnUrl* query parameter should be used to return the user back into the IdentityServer authorize request workflow.

{{% notice note %}}
Beware [open-redirect attacks](https://en.wikipedia.org/wiki/URL_redirection#Security_issues) via the *returnUrl* parameter. You should validate that the *returnUrl* refers to well-known location.
Either use the *Url.IsLocalUrl* helper from ASP.NET Core, or use the [interaction service]({{< ref "/reference/services/interaction_service#iidentityserverinteractionservice-apis" >}}) from Duende IdentityServer for APIs to validate the *returnUrl* parameter.
{{% /notice %}}
