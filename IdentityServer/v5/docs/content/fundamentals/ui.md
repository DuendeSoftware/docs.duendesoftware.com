---
title: "Adding UI"
date: 2020-09-10T08:22:12+02:00
weight: 50
---

Duende IdentityServer is middleware that implements the OpenID Connect and OAuth2 security protocols.
It does not manage users, or provide a user database, or provide any built-in means for users to create accounts, reset passwords, or login.

This design requires the developer using Duende IdentityServer to "bring" their users to the implementation.
This means the developer using Duende IdentityServer is expected to provide a means for those users to login (typically via a login page), and then based on that login, Duende IdentityServer can issue tokens for those users.

{{% notice note %}}
This design is a major feature of Duende IdentityServer; the ability to customize the login workflow (password, MFA, etc.), use any user credentials system or database (greenfield or legacy), and/or used federated logins from a variety of sources (social or enterprise).
This allows the developer to have control over the entire user experience while allowing Duende IdentityServer to provide the security protocol, which of course enables single sign-on (SSO) for users.
{{% /notice %}}

This document will describe, at a high level, the request workflow and interaction between the Duende IdentityServer middleware endpoints (specifically the authorization endpoint) and a simple login page.

## Login workflow

Recall the diagram of an application hosting Duende IdentityServer and the user interface (indicated by "Your code"):

![](../../overview/images/middleware.png)

Requests from a client to log a user in are made to the authorize endpoint (not directly to the login page). This is the protocol endpoint the clients redirect a user to in order to request authentication.

When Duende IdentityServer receives an authorize request, it will inspect it for a current authentication session for a user. This authentication session is based on ASP.NET Core's authentication system and is ultimately determined by a cookie issued from your login page. 

If the user has never logged in there will be no cookie, and then the request to the authorize endpoint will result in a redirect to a login page that is expected to be co-hosted in the same running host as Duende IdentityServer. 

![](../../authentication/images/signin_flow.png)

The login page (which is provided by the developer) will prompt the user to login using any mechanism desired (typically using a password). 
Once the user has provided valid credentials (as determined by your custom logic), then the login page will establish an authentication session for the user with a cookie that contains a claim (i.e. the *sub* claim) that uniquely identifies the user.

A *returnUrl* parameter is passed to this login page so that once the interactive login workflow is complete, the login page can redirect the user back into the Duende IdentityServer endpoint to complete the original authorization request from the client (but this time with an authenticated session for the user).

The below code shows a sample Razor Page that could act as a login page:

```html
@page
@model Sample.Pages.Account.LoginModel
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers

<div asp-validation-summary="All"></div>

<form method="post">
    <input type="hidden" asp-for="ReturnUrl" />

    <div>
        <label asp-for="Username">Username</label>
        <input asp-for="Username" autofocus>
    </div>
    <div>
        <label asp-for="Password">Password</label>
        <input type="password" asp-for="Password" autocomplete="off">
    </div>

    <button type="submit">Login</button>
</form>
```

The below code shows the code behind for the login Razor Page:

```cs
namespace Sample.Pages.Account
{
    public class LoginModel : PageModel
    {
        [BindProperty(SupportsGet = true)]
        public string ReturnUrl { get; set; }
        [BindProperty]
        public string Username { get; set; }
        [BindProperty]
        public string Password { get; set; }
        
        public async Task<IActionResult> OnPost()
        {
            if (Username == "alice" && Password == "password")
            {
                var claims = new Claim[] {
                    new Claim("sub", "unique_id_for_alice")
                };
                var identity = new ClaimsIdentity(claims, "pwd");
                var user = new ClaimsPrincipal(identity);
                
                await HttpContext.SignInAsync(user);

                if (Url.IsLocalUrl(ReturnUrl))
                {
                    return Redirect(ReturnUrl);
                }
            }

            ModelState.AddModelError("", "Invalid username or password");

            return Page();
        }
    }
}
```

{{% notice note %}}
The above Razor page is expected to be located in the project at the path: ~/Pages/Account/Login.cshtml, which allows it to be loaded from the browser at the "/Account/Login" path.
{{% /notice %}}

The above sample hard codes the logic to validate the user's credentials. Of course, this is where the developer using Duende IdentityServer could implement this login logic in any way they see fit.

