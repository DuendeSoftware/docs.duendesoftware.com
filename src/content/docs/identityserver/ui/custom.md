---
title: "Custom Pages"
description: "Guide for implementing custom pages in IdentityServer beyond standard authentication pages, including integration with the authorize endpoint and extending the interaction response generator."
sidebar:
  order: 5
redirect_from:
  - /identityserver/v5/ui/custom/
  - /identityserver/v6/ui/custom/
  - /identityserver/v7/ui/custom/
---

In addition to the pages your IdentityServer is expected to provide, you can add any other pages you wish. 
These could be pages needed during login (e.g. registration, password reset), self-service pages to allow the user to manage their profile (e.g. change password, change email), or even more specialized pages for various user workflows (e.g. password expired, or EULA).

These custom pages can be made available to the end user as links from the standard pages in your IdentityServer (i.e. login, consent), they can be rendered to the user during login page workflows, or they could be displayed as a result of requests into the authorize endpoint.

## Authorize Endpoint Requests And Custom Pages

As requests are made into the authorize endpoint, if a user already has an established authentication session then they will not be presented with a login page at your IdentityServer (as that is the normal expectation for single sign-on).

Duende IdentityServer provides the [authorize interaction response generator](/identityserver/reference/response-handling/authorize-interaction-response-generator/) extensibility point to allow overriding or controlling the response from the authorize endpoint.

### Built-in AuthorizeInteractionResponseGenerator

To provide custom logic for the authorize endpoint, the recommendation is to derive from the built-in `AuthorizeInteractionResponseGenerator` to inherit all the default logic pertaining to log in and consent semantics.
To augment the built-in logic, override `ProcessLoginAsync` and/or `ProcessConsentAsync` (depending on the nature of the custom logic).
The pattern would be to invoke the base implementation and if the result did not cause a login, consent or error, then the custom logic could be tested to determine if it is desired to prevent SSO and instead force the user to interact in some way (e.g. re-login, trigger MFA, accept a EULA, etc.).
The sample below illustrates:

```csharp
public class CustomAuthorizeInteractionResponseGenerator : AuthorizeInteractionResponseGenerator
{
    public CustomAuthorizeInteractionResponseGenerator(IdentityServerOptions options, ISystemClock clock, ILogger<AuthorizeInteractionResponseGenerator> logger, IConsentService consent, IProfileService profile) 
        : base(options, clock, logger, consent, profile)
    {
    }

    protected override async Task<InteractionResponse> ProcessLoginAsync(ValidatedAuthorizeRequest request)
    {
        var result = await base.ProcessLoginAsync(request);

        if (!result.IsLogin && !result.IsError)
        {
            // check EULA database
            var mustShowEulaPage = !HasUserAcceptedEula(request.Subject);
            if (mustShowEulaPage)
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

When using custom redirect pages by setting the `RedirectUrl` on the `InteractionResponse`, IdentityServer will provide a `returnUrl` query parameter with the request (much like on the login page).
Once the custom logic is complete on the page, then the URL in the `returnUrl` query parameter should be used to return the user back into the IdentityServer authorize request workflow.

:::note
Beware [open-redirect attacks](https://en.wikipedia.org/wiki/URL_redirection#security_issues) via the `returnUrl` parameter. You should validate that the `returnUrl` refers to a well-known location.
Either use the `Url.IsLocalUrl` helper from ASP.NET Core, or use the [interaction service](/identityserver/reference/services/interaction-service/#iidentityserverinteractionservice-apis) from Duende IdentityServer for APIs to validate the `returnUrl` parameter.
:::
