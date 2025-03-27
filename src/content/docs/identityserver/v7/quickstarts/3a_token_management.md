---
title: "Token Management"
date: 2024-07-23T08:22:12+02:00
weight: 5
---

Welcome to this Quickstart for Duende IdentityServer!

The previous quickstart introduced [API access](3_api_access) with interactive applications, but by far the most complex task for a typical client is to manage the access token.

In addition to the written steps below a YouTube video is available:

<iframe width="853" height="505" src="https://www.youtube.com/embed/W8jtc2Ou1d4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Given that the access token has a finite lifetime, you typically want to

- request a refresh token in addition to the access token at login time
- cache those tokens
- use the access token to call APIs until it expires
- use the refresh token to get a new access token
- repeat the process of caching and refreshing with the new token

ASP.NET Core has built-in facilities that can help you with some of those tasks
(like caching or sessions), but there is still quite some work left to do.
[Duende.AccessTokenManagement](https://github.com/DuendeSoftware/Duende.AccessTokenManagement/wiki)
can help. It provides abstractions for storing tokens, automatic refresh of expired tokens, etc.

## Requesting a refresh token

To allow the _web_ client to request a refresh token set the _AllowOfflineAccess_ property to true in the client configuration.

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
    AllowOfflineAccess = true,

    AllowedScopes =
    {
        IdentityServerConstants.StandardScopes.OpenId,
        IdentityServerConstants.StandardScopes.Profile,
        "verification",
        "api1"
    }
}
```

To get the refresh token the _offline_access_ scope has to be requested by the client.

In _src/WebClient/Program.cs_ add the scope to the scope list:

```cs
options.Scope.Add("offline_access");
```

When running the solution the refresh token should now be visible under _Properties_ on the landing page of the client.

## Automatically refreshing an access token

In the WebClient project add a reference to the NuGet package `Duende.AccessTokenManagement.OpenIdConnect` and in _Program.cs_ add the needed types to dependency injection:

```cs
builder.Services.AddOpenIdConnectAccessTokenManagement();
```

In _CallApi.cshtml.cs_ update the method body of `OnGet` as follows:

```cs
public async Task OnGet()
{
    var tokenInfo = await HttpContext.GetUserAccessTokenAsync();
    var client = new HttpClient();
    client.SetBearerToken(tokenInfo.AccessToken!);

    var content = await client.GetStringAsync("https://localhost:6001/identity");

    var parsed = JsonDocument.Parse(content);
    var formatted = JsonSerializer.Serialize(parsed, new JsonSerializerOptions { WriteIndented = true });

    Json = formatted;
}
```

There are two changes here that utilize the AccessTokenManagement NuGet package:

- An object called tokenInfo containing all stored tokens is returned by the _GetUserAccessTokenAsync_ extension method. This will make sure the access token is _automatically refreshed_ using the refresh token if needed.
- The _SetBearerToken_ extension method on HttpClient is used for convenience to place the access token in the needed HTTP header.

## Using a Named HttpClient

On each call to OnGet in _CallApi.cshtml.cs_ a new HttpClient is created in the code above. Recommended however is to use the [HttpClientFactory](https://learn.microsoft.com/en-us/dotnet/core/extensions/httpclient-factory) pattern so that instances can be reused.

`Duende.AccessTokenManagement.OpenIdConnect` builds on top of _HttpClientFactory_ to create HttpClient instances that automatically retrieve the needed access token and refresh if needed.

In the client in _Program.cs_ under the call to _AddOpenIdConnectAccessTokenManagement_ register the HttpClient:

```cs
builder.Services.AddUserAccessTokenHttpClient("apiClient", configureClient: client =>
{
    client.BaseAddress = new Uri("https://localhost:6001");
});
```

Now the _OnGet_ method in _CallApi.cshtml.cs_ can be even more straightforward:

```cs
  public class CallApiModel(IHttpClientFactory httpClientFactory) : PageModel
  {
      public string Json = string.Empty;

      public async Task OnGet()
      {
          var client = httpClientFactory.CreateClient("apiClient");

          var content = await client.GetStringAsync("https://localhost:6001/identity");

          var parsed = JsonDocument.Parse(content);
          var formatted = JsonSerializer.Serialize(parsed, new JsonSerializerOptions { WriteIndented = true });

          Json = formatted;
      }
  }
```

Note that:

- The httpClientFactory is injected using a primary constructor. The type was registered when _AddOpenIdConnectAccessTokenManagement_ was called in _Program.cs_.
- The client is created using the factory passing in the name of the client that was registered in _program.cs_.
- No additional code is needed. The client will automatically retrieve the access token and refresh it if needed.
