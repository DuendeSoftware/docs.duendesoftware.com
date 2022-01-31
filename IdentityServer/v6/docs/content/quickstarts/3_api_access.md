---
title: "ASP.NET Core and API access"
date: 2020-09-10T08:22:12+02:00
weight: 4
---

Welcome to Quickstart 3 for Duende IdentityServer!

The previous quickstarts introduced 
[API access]({{< ref "1_client_credentials" >}}) and 
[user authentication]({{< ref "2_interactive" >}}). This quickstart will bring 
the two together.

OpenID Connect and OAuth combine elegantly; you can achieve both user
authentication and api access in a single exchange with the token service.

In Quickstart 2, the token request in the login process asked for only identity
resources, that is, only scopes such as *profile* and *openid*. In this
quickstart, you will add scopes for API resources to that request.
*IdentityServer* will respond with two tokens:
1. the identity token, containing information about the authentication process
  and session, and
2. the access token, allowing access to APIs on behalf of the logged on user

{{% notice note %}}

We recommend you do the quickstarts in order, but if you'd like to start here,
begin from a copy of [Quickstart 2's source code]({{< param qs_base
>}}/2_InteractiveAspNetCore). You will also need to [install the IdentityServer
templates]({{< ref "0_overview#preparation" >}}).

{{% /notice %}}

## Modifying the client configuration

The client configuration in IdentityServer requires two straightforward updates.
1. Add the *api1* resource to the allowed scopes list so that the client will
   have permission to access it.
2. Enable support for refresh tokens by setting the *AllowOfflineAccess* flag.

Update the *Client* in *IdentityServer/Config.cs* as follows:
```cs
new Client
{
    ClientId = "mvc",
    ClientSecrets = { new Secret("secret".Sha256()) },

    AllowedGrantTypes = GrantTypes.Code,
            
    // where to redirect to after login
    RedirectUris = { "https://localhost:5002/signin-oidc" },

    // where to redirect to after logout
    PostLogoutRedirectUris = { "https://localhost:5002/signout-callback-oidc" },
    
    AllowOfflineAccess = true,

    AllowedScopes = new List<string>
    {
        IdentityServerConstants.StandardScopes.OpenId,
        IdentityServerConstants.StandardScopes.Profile,
        "verification",
        "api1"
    }
}
```

## Modifying the MVC client
Now just configure the client to ask for the *api1* scope. This is done in the
OpenID Connect handler configuration in *MvcClient/Program.cs*:

```cs
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "oidc";
})
    .AddCookie("Cookies")
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://localhost:5001";

        options.ClientId = "mvc";
        options.ClientSecret = "secret";
        options.ResponseType = "code";

        options.SaveTokens = true;

        options.Scope.Add("api1");
        options.Scope.Add("offline_access");
    });
```

Since *SaveTokens* is enabled, ASP.NET Core will automatically store the id,
access, and refresh tokens in the properties of the authentication cookie. If
you run the solution and authenticate, you will see the tokens on
the page that displays the cookie claims and properties created in quickstart 2.

## Using the access token
Now you will use the access token to authorize requests from the *MvcClient* to
the *Api*. 

Create an action on the *HomeController* that will 
1. Retrieve the access token from the session using the *GetTokenAsync*
method from *Microsoft.AspNetCore.Authentication*
2. Set the token in an *Authentication: Bearer* HTTP header
3. Make an HTTP request to the *API*
4. Display the results

```cs
public async Task<IActionResult> CallApi()
{
    var accessToken = await HttpContext.GetTokenAsync("access_token");

    var client = new HttpClient();
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    var content = await client.GetStringAsync("https://localhost:6001/identity");

    var parsed = JsonDocument.Parse(content);
    var formatted = JsonSerializer.Serialize(parsed, new JsonSerializerOptions { WriteIndented = true });

    ViewBag.Json = formatted;
    return View("json");
}
```

Create a view in *MvcClient/Views/Home/json.cshtml* that outputs the json like this:

```html
<pre>@ViewBag.Json</pre>
```

Make sure the API is running, start the MVC client and call */home/CallApi*
after authentication.

## Further Reading - Access token lifetime management
By far the most complex task for a typical client is to manage the access token.
You typically want to 

* request the access and refresh token at login time
* cache those tokens
* use the access token to call APIs until it expires
* use the refresh token to get a new access token
* repeat the process of caching and refreshing with the new token

ASP.NET Core has built-in facilities that can help you with some of those tasks
(like caching or sessions), but there is still quite some work left to do.
Consider using the
[IdentityModel](https://identitymodel.readthedocs.io/en/latest/aspnetcore/overview.html)
library for help with access token lifetime management. It provides abstractions
for storing tokens, automatic refresh of expired tokens, etc.
