---
title: "Local sign-in"
weight: 10
---

## Login User Interface and Identity Management System
One of the key features of Duende IdentityServer is that you have full control over the login UI, login workflow and the datasources you need to connect to.

We provide a full featured UI that you can use as a starting point to customize and connect to your own data stores in the quickstart UI [repo](https://github.com/DuendeSoftware/IdentityServer.Quickstart.UI). A popular option for greenfield scenarios is using Microsoft's ASP.NET Identity library for user management (TODO link to integration docs).

## Sample login page

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

The above sample hard codes the logic to validate the user's credentials. Of course, this is where your IdentityServer could implement this login logic in any way you see fit. Regardless, the steps are to validate the user's credentials, issue the authentication cookie, and redirect to the return url.

