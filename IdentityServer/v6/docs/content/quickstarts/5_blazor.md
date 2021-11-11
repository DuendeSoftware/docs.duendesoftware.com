---
title: "Building Blazor WASM client applications"
date: 2020-09-10T08:22:12+02:00
weight: 6
---

Similar to JavaScript SPAs, you can build Blazor WASM applications with and without a backend. Not having a backend has all the security disadvantages we discussed already in the JavaScript quickstart. 

If you are building Blazor WASM apps that do not deal with sensitive data and you want to use the no-backend approach, have a look at the standard Microsoft templates, which are using this style.

In this quickstart we will focus on how to build a Blazor WASM application using our Duende.BFF security framework.

{{% notice note %}}
To keep things simple, we will use our demo IdentityServer instance hosted at https://demo.duendesoftware.com. We will provide more details on how to configure a Blazor client in your own IdentityServer at then end.
{{% /notice %}}

### Setting up the project
The .NET 6 CLI includes a Blazor WASM with backend template. Create a directory where you want to work in, and run the following command:

```
dotnet new blazorwasm --hosted
```

This will create three projects - server, client and shared. 

### Configuring the server
First add the following package references to the server project:

```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.OpenIdConnect" Version="6.0.0" />
<PackageReference Include="Duende.BFF" Version="1.1.0" />
```

Next, we will add OpenID Connect and OAuth support to the backend. For this we are adding the Microsoft OpenID Connect authentication handler for the protocol interactions with the token service, and the cookie authentication handler for managing the resulting authentication session. See [here]({{< ref "/bff/session/handlers" >}}) for background information.

The BFF services we are adding provide the logic to invoke the authentication plumbing from the frontend (more about this later).

Add the following snippet to your *Program.cs* above the call to *builder.Build();*

```cs
builder.Services.AddBff();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
        options.DefaultSignOutScheme = "oidc";
    })
    .AddCookie("cookie", options =>
    {
        options.Cookie.Name = "__Host-blazor";
        options.Cookie.SameSite = SameSiteMode.Strict;
    })
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://demo.duendesoftware.com";

        options.ClientId = "interactive.confidential";
        options.ClientSecret = "secret";
        options.ResponseType = "code";
        options.ResponseMode = "query";

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("api");
        options.Scope.Add("offline_access");

        options.MapInboundClaims = false;
        options.GetClaimsFromUserInfoEndpoint = true;
        options.SaveTokens = true;
    });
```

The last step is to add the required middleware for authentication, authorization and BFF session management. Add the following snippet after the call to *UseRouting*:

```cs
app.UseAuthentication();
app.UseBff();
app.UseAuthorization();

app.MapBffManagementEndpoints();
```