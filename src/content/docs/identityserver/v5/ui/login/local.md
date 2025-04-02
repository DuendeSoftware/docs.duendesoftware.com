---
title: "Accepting Local Credentials"
order: 50
---

The steps for implementing a local login page are:
* Validate the user's credentials
* Issue the authentication cookie
* Redirect the user to the return URL

The below code shows a sample Razor Page that could act as a login page.
This sample hard codes the logic for the credentials, so this is where your implementation would use your custom user database or identity management library.

This is the cshtml for the login Razor Page:

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

And this is the code behind for the login Razor Page:

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

The above Razor page is expected to be located in the project at the path: ~/Pages/Account/Login.cshtml, which allows it to be loaded from the browser at the "/Account/Login" path.

:::note
While you can use any custom user database or identity management library for your users, we provide first class [integration support](/identityserver/v5/aspnet_identity) for ASP.NET Identity.
:::
