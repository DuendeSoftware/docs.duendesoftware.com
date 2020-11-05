---
title: "Sign-out with external Identity Providers"
date: 2020-09-10T08:22:12+02:00
weight: 4
---

When a user is [signing-out]({{< ref "sign_out" >}}), and they have used an external identity provider to sign-in then it is likely that they should be redirected to also sign-out of the external provider.
Not all external providers support sign-out, as it depends on the protocol and features they support.

To detect that a user must be redirected to an external identity provider for sign-out is typically done by using a *idp* claim issued into the cookie at IdentityServer.
The value is either *local* for a local sing-in or the scheme of the corresponding authentication handler used for an external provider.
At sign-out time this claim is consulted to know if an external sign-out is required.

Redirecting the user to an external identity provider is problematic due to the cleanup and state management already required by the normal sign-out workflow.
The only way to then complete the normal sign-out and cleanup process at Duende IdentityServer is to then request from the external identity provider that after its logout that the user be redirected back to your IdentityServer.
Not all external providers support post-logout redirects, as it depends on the protocol and features they support.

The workflow at sign-out is then to revoke your IdentityServer's authentication cookie, and then redirect to the external provider requesting a post-logout redirect.
The post-logout redirect should maintain the necessary sign-out [state]({{< ref "sign_out#sign-out-initiated-by-a-client-application" >}}) (i.e. the *logoutId* parameter value).

To redirect back to IdentityServer after the external provider sign-out, the *RedirectUri* should be used on the *AuthenticationProperties* when using ASP.NET Core's *SignOutAsync* API, for example:

```cs
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> Logout(LogoutInputModel model)
{
    // build a model so the logged out page knows what to display
    var vm = await BuildLoggedOutViewModelAsync(model.LogoutId);

    if (User?.Identity.IsAuthenticated == true)
    {
        // delete local authentication cookie
        await HttpContext.SignOutAsync();
    }

    // check if we need to trigger sign-out at an upstream identity provider
    if (vm.TriggerExternalSignout)
    {
        // build a return URL so the upstream provider will redirect back
        // to us after the user has logged out. this allows us to then
        // complete our single sign-out processing.
        string url = Url.Action("Logout", new { logoutId = vm.LogoutId });

        // this triggers a redirect to the external provider for sign-out
        return SignOut(new AuthenticationProperties { RedirectUri = url }, vm.ExternalAuthenticationScheme);
    }

    return View("LoggedOut", vm);
}
```

Once the user is signed-out of the external provider and then redirected back, the normal sign-out processing at IdentityServer should execute which involves processing the *logoutId* and doing all necessary cleanup.
