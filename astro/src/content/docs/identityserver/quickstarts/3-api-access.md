---
title: "ASP.NET Core And API access"
description: "Learn how to combine user authentication with API access by requesting both identity and API scopes during the OpenID Connect login flow."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 4
redirect_from:
   - /identityserver/v5/quickstarts/3_api_access/
   - /identityserver/v6/quickstarts/3_api_access/
   - /identityserver/v7/quickstarts/3_api_access/
---

Welcome to Quickstart 3 for Duende IdentityServer!

The previous quickstarts introduced
[API access](/identityserver/quickstarts/1-client-credentials.md) and
[user authentication](/identityserver/quickstarts/2-interactive.md). This quickstart will bring
the two together.

In addition to the written steps below a YouTube video is available:

<iframe width="853" height="505" src="https://www.youtube.com/embed/zHVmzgPUImc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

OpenID Connect and OAuth combine elegantly; you can achieve both user
authentication and api access in a single exchange with the token service.

In Quickstart 2, the token request in the login process asked for only identity
resources, that is, only scopes such as _profile_ and _openid_. In this
quickstart, you will add scopes for API resources to that request.
_IdentityServer_ will respond with two tokens:

1. the identity token, containing information about the authentication process
   and session, and
2. the access token, allowing access to APIs on behalf of the logged on user

:::note
We recommend you do the quickstarts in order. If you'd like to start here, begin
from a copy of
the [reference implementation of Quickstart 2](https://github.com/DuendeSoftware/samples/tree/main/IdentityServer/v7/Quickstarts/2_InteractiveAspNetCore).
Throughout this quickstart, paths are written relative to the base `_quickstart`
directory created in part 1, which is the root directory of the reference
implementation. You will also need to [install the IdentityServer templates](/identityserver/quickstarts/0-overview.md#preparation).
:::

## Modifying The Client Configuration

The client configuration in IdentityServer requires one straightforward update. We should add the _api1_ resource to the
allowed scopes list so that the client will have permission to access it.

Update the _Client_ in _src/IdentityServer/Config.cs_ as follows:

```csharp
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

## Modifying The Web client

Now configure the client to ask for access to api1 by
requesting the _api1_ scope. This is done in the OpenID
Connect handler configuration in _src/WebClient/Program.cs_:

```csharp
// Program.cs
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

## Using The Access Token

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

```csharp
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
