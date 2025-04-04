---
title: "External Logout"
order: 70
---

When a user is [logging out](/identityserver/v5/ui/logout), and they have used an external identity provider to sign-in then it is likely that they should be redirected to also sign-out of the external provider.
Not all external providers support sign-out, as it depends on the protocol and features they support.

Don't forget that your logout page still needs to complete all the other steps to properly sign the user out.
This is complicated if the logout page must redirect to an external provider to sign out.
To achieve both, it is necessary to have the external provider to redirect the user back to your IdentityServer after signing out of the external provider.
Across this redirect exchange, there will be state that must be maintained so the complete sign-out workflow can complete successfully.

## Determining the Identity Provider

To detect that a user must be redirected to an external identity provider for sign-out is typically done by using an *idp* claim issued into the cookie at IdentityServer.
The value is either *local* for a local sign-in or the scheme of the corresponding authentication handler used for an external provider.
At sign-out time this claim should be consulted to determine if an external sign-out is required.

:::note
The constant *IdentityServerConstants.LocalIdentityProvider* can be used instead of hard coding the value *local* for the local login provider identifier.
:::

## Redirecting to the External Provider

To trigger logout at an external provider, use the *SignOutAsync* extension method on the *HttpContext* (or the *SignOutResult* action result in MVC or Razor Pages). You must pass the scheme of the provider as configured in your startup (which should also match the *idp* claim mentioned above).

```csharp
public IActionResult Logout(string logoutId)
{
    // other code elided

    var idp = User.FindFirst("idp").Value;
    if (idp != IdentityServerConstants.LocalIdentityProvider)
    {
        return SignOut(idp);
    }

    // other code elided
}
```

## Redirecting back from the External Provider and State Management

To redirect back to your IdentityServer after the external provider sign-out, the *RedirectUri* should be used on the *AuthenticationProperties* when using ASP.NET Core's *SignOutAsync* API.

Recall that after we return, we must perform the other steps to complete the logout workflow.
These steps require the context passed as the *logoutId* parameter, so this state needs to be roundtripped to the external provider.
We can do so by incorporating the *logoutId* value into the *RedirectUri*.

If there is no *logoutId* parameter on the original logout page request, we still might have context that needs to be round tripped.
We can obtain a *logoutId* to use by calling *CreateLogoutContextAsync* API on the [interaction service](/identityserver/v5/reference/services/interaction_service).

For example:

```csharp
public async Task<IActionResult> Logout(string logoutId)
{
    // other code elided

    var idp = User.FindFirst("idp").Value;
    if (idp != IdentityServerConstants.LocalIdentityProvider)
    {
        logoutId = logoutId ?? await _interaction.CreateLogoutContextAsync();
        string url = Url.Action("Logout", new { logoutId = logoutId });

        return SignOut(new AuthenticationProperties { RedirectUri = url }, idp);
    }

    // other code elided
}
```

Once the user is signed out of the external provider and then redirected back, the normal sign-out processing at your IdentityServer should execute which involves processing the *logoutId* and doing all necessary cleanup.
