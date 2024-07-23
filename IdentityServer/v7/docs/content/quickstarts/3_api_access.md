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
resources, that is, only scopes such as _profile_ and _openid_. In this
quickstart, you will add scopes for API resources to that request.
_IdentityServer_ will respond with two tokens:

1. the identity token, containing information about the authentication process
   and session, and
2. the access token, allowing access to APIs on behalf of the logged on user

{{% notice note %}}

We recommend you do the quickstarts in order. If you'd like to start here, begin
from a copy of the [reference implementation of Quickstart 2]({{< param qs_base >}}/2*InteractiveAspNetCore).
Throughout this quickstart, paths are written relative to the base \_quickstart*
directory created in part 1, which is the root directory of the reference
implementation. You will also need to [install the IdentityServer templates]({{< ref "0_overview#preparation" >}}).

{{% /notice %}}

## Modifying the client configuration

The client configuration in IdentityServer requires one straightforward update. We should add the _api1_ resource to the allowed scopes list so that the client will have permission to access it.

Update the _Client_ in _src/IdentityServer/Config.cs_ as follows:

```cs
new Client
{
    ClientId = "web",
    ClientSecrets = { new Secret("secret".Sha256()) },

    AllowedGrantTypes = GrantTypes.Code,

    // where to redirect to after login
    RedirectUris = { "https://localhost:5002/signin-oidc" },

    // where to redirect to after logout
    PostLogoutRedirectUris = { "https://localhost:5002/signout-callback-oidc" },

    AllowedScopes =
    {
        IdentityServerConstants.StandardScopes.OpenId,
        IdentityServerConstants.StandardScopes.Profile,
        "verification",
        "api1"
    }
}
```

## Modifying the Web client

Now configure the client to ask for access to api1 by
requesting the _api1_ scope. This is done in the OpenID
Connect handler configuration in _src/WebClient/Program.cs_:

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

        options.ClientId = "web";
        options.ClientSecret = "secret";
        options.ResponseType = "code";

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("api1");
        options.Scope.Add("verification");
        options.ClaimActions.MapJsonKey("email_verified", "email_verified");
        options.GetClaimsFromUserInfoEndpoint = true;

        options.MapInboundClaims = false; // Don't rename claim types

        options.SaveTokens = true;
    });
```

Since _SaveTokens_ is enabled, ASP.NET Core will automatically store the id and
access tokens in the properties of the authentication cookie. If
you run the solution and authenticate, you will see the tokens on
the page that displays the cookie claims and properties created in quickstart 2.

## Using the access token

Now you will use the access token to authorize requests from the _WebClient_ to
the _Api_.

Create a page that will

1. Retrieve the access token from the session using the _GetTokenAsync_
   method from _Microsoft.AspNetCore.Authentication_
2. Set the token in an _Authentication: Bearer_ HTTP header
3. Make an HTTP request to the _API_
4. Display the results

Create the Page by running the following command from the _src/WebClient/Pages_
directory:

```console
dotnet new page -n CallApi
```

Update _src/WebClient/Pages/CallApi.cshtml.cs_ as follows:

```cs
public class CallApiModel : PageModel
{
    public string Json = string.Empty;

    public async Task OnGet()
    {
        var accessToken = await HttpContext.GetTokenAsync("access_token");
        var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        var content = await client.GetStringAsync("https://localhost:6001/identity");

        var parsed = JsonDocument.Parse(content);
        var formatted = JsonSerializer.Serialize(parsed, new JsonSerializerOptions { WriteIndented = true });

        Json = formatted;
    }
}
```

And update _src/WebClient/Pages/CallApi.cshtml_ as follows:

```html
@page @model MyApp.Namespace.CallApiModel

<pre>@Model.Json</pre>
```

Also add a link to the new page in _src/WebClient/Shared/\_Layout.cshtml_ with the following:

```html
<li class="nav-item">
  <a class="nav-link text-dark" asp-area="" asp-page="/CallApi">CallApi</a>
</li>
```

Make sure the _IdentityServer_ and _Api_ projects are running, start the
_WebClient_ and request _/CallApi_ after authentication.

## Further Reading - Access token lifetime management

By far the most complex task for a typical client is to manage the access token.
You typically want to

- request an access and refresh token at login time
- cache those tokens
- use the access token to call APIs until it expires
- use the refresh token to get a new access token
- repeat the process of caching and refreshing with the new token

ASP.NET Core has built-in facilities that can help you with some of those tasks
(like caching or sessions), but there is still quite some work left to do.
Consider using the
[Duende.AccessTokenManagement](https://github.com/DuendeSoftware/Duende.AccessTokenManagement/wiki)
library for help with access token lifetime management. It provides abstractions
for storing tokens, automatic refresh of expired tokens, etc.
