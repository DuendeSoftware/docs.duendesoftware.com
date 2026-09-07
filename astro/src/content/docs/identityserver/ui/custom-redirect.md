---
title: "Customizing IdentityServer Interaction Redirects"
description: "How to route users to registration with prompt=create and customize IdentityServer redirects to login, consent, and other interaction pages."
date: 2026-05-08
sidebar:
  label: "Custom redirect writer"
  order: 55
---

When IdentityServer needs to send a user to an interaction page, like login, consent, create-account, or a [custom page](/identityserver/ui/custom.md),
it builds a redirect URL and writes an HTTP 303 response. The class responsible for this is `AuthorizeInteractionPageHttpWriter`, which is public and designed to be subclassed.

You might want to customize this behavior to:

* Set a cookie before the redirect (for example, to carry state that survives the round-trip through the interaction page).
* Append a custom query parameter to the interaction page URL (for example, a tenant identifier or a UI hint).
* Change the redirect status code or add extra response headers.

## How IdentityServer Interaction Redirects Work

`AuthorizeInteractionPageHttpWriter` implements `IHttpResponseWriter<AuthorizeInteractionPageResult>` and exposes three virtual methods you can override independently:

| Method                  | Responsibility                                                      |
|-------------------------|---------------------------------------------------------------------|
| `BuildReturnUrlAsync`   | Builds the URL that points back to the authorize callback endpoint. |
| `BuildRedirectUrlAsync` | Combines the interaction page URL with the return URL.              |
| `WriteResponseAsync`    | Writes the HTTP response (status code, `Location` header).          |

The default `WriteHttpResponse` implementation calls all three in sequence. You only need to override the method that covers the behavior you want to change.

## How To Append A Custom Query Parameter

The example below adds a `ui_hint` query parameter to every redirect URL so the interaction page can adjust its appearance based on the originating client.

```csharp
// CustomRedirectWriter.cs
using Duende.IdentityServer.Configuration;
using Duende.IdentityServer.Endpoints.Results;
using Duende.IdentityServer.Hosting;
using Duende.IdentityServer.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

public class CustomRedirectWriter : AuthorizeInteractionPageHttpWriter
{
    public CustomRedirectWriter(
        IdentityServerOptions options,
        IServerUrls urls,
        IUiLocalesService localesService)
        : base(options, urls, localesService)
    {
    }

    protected override async Task<string> BuildRedirectUrlAsync(
        AuthorizeInteractionPageResult result,
        string returnUrl,
        HttpContext context)
    {
        var redirectUrl = await base.BuildRedirectUrlAsync(result, returnUrl, context);

        // Append a ui_hint parameter so the interaction page knows which client triggered the flow.
        var clientId = result.Request?.ClientId;
        if (!string.IsNullOrEmpty(clientId))
        {
            redirectUrl += (redirectUrl.Contains('?') ? "&" : "?")
                + "ui_hint=" + Uri.EscapeDataString(clientId);
        }

        return redirectUrl;
    }
}
```

## How To Set A Cookie Before The Redirect

Override `WriteResponseAsync` when you need to write response headers or cookies in addition to the redirect itself.

```csharp
// CookieRedirectWriter.cs
protected override Task WriteResponseAsync(HttpContext context, string redirectUrl)
{
    // Set a short-lived cookie that the interaction page can read.
    context.Response.Cookies.Append("idsrv.hint", "active", new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Lax,
        MaxAge = TimeSpan.FromMinutes(5)
    });

    return base.WriteResponseAsync(context, redirectUrl);
}
```

## How To Register A Custom Redirect Writer

Register your subclass using `AddHttpWriter<TResult, TWriter>()` in your IdentityServer setup:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddHttpWriter<AuthorizeInteractionPageResult, CustomRedirectWriter>();
```

This replaces the default `AuthorizeInteractionPageHttpWriter` for `AuthorizeInteractionPageResult` responses. All other result types keep their default writers.

:::note
The return URL built by `BuildReturnUrlAsync` points back into the authorize endpoint. Validate it using the [interaction service](/identityserver/reference/v8/services/interaction-service.md)
before following it in your interaction page to guard against open-redirect attacks.
:::

## How To Start User Registration With `prompt=create`

The [Initiating User Registration via OpenID Connect](https://openid.net/specs/openid-connect-prompt-create-1_0.html)
specification defines `prompt=create` as a standard way for a client to ask the OpenID Provider to show its registration
UI. The client does not need to know the URL of that page.

Add this configuration to `Program.cs` in the **IdentityServer host**. The URL identifies the registration page served by
IdentityServer:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.UserInteraction.CreateAccountUrl = "/Account/Register";
});
```

IdentityServer now adds `create` to `prompt_values_supported` in its discovery document. An authorization request with
`prompt=create` is redirected to `/Account/Register` with a `returnUrl` query parameter. If `CreateAccountUrl` is not
configured, IdentityServer ignores `prompt=create` and does not advertise it in discovery.

:::note
`prompt=create` must be the only `prompt` value in the authorization request. It cannot be combined with `login`,
`consent`, `select_account`, or `none`.
:::

### Start Registration From An ASP.NET Core Client

This code runs in the **ASP.NET Core client application**, not the IdentityServer host. It assumes the client has an
OpenID Connect authentication scheme named `oidc`. The `/register` endpoint starts a registration challenge without
changing regular login challenges:

```csharp
// Program.cs
app.MapGet("/register", () =>
{
    var properties = new OpenIdConnectChallengeProperties
    {
        Prompt = "create",
        RedirectUri = "/"
    };

    return Results.Challenge(properties, ["oidc"]);
});
```

When a user visits `/register`, the OpenID Connect handler sends an authorization request with `prompt=create` to
IdentityServer. IdentityServer then redirects the browser to its configured registration page.

`RedirectUri` is the local path in the client application to visit after the OpenID Connect flow completes. The
protocol redirect URI used by the OpenID Connect handler must still match the client's configuration in IdentityServer.

### Continue The Authorization Flow After Registration

This code runs in the **IdentityServer host**, in the Razor Page handler for the `/Account/Register` page configured
above. The registration page receives the same `returnUrl` pattern used by the login and consent pages. Use
`IIdentityServerInteractionService` to load the authorization context, create and sign in the user, then return to the
authorization flow. `CreateUserAsync` and `Input` represent your own validated user-registration code:

```csharp
// Register.cshtml.cs
public async Task<IActionResult> OnPostAsync(string returnUrl)
{
    var context = await _interaction.GetAuthorizationContextAsync(
        returnUrl,
        HttpContext.RequestAborted);

    if (context is null)
    {
        return BadRequest();
    }

    var user = await CreateUserAsync(Input);

    // Only sign in after any required email confirmation, account approval,
    // or MFA enrollment has completed.
    await HttpContext.SignInAsync(new IdentityServerUser(user.SubjectId));

    return Redirect(returnUrl);
}
```

`GetAuthorizationContextAsync` returns `null` for an invalid return URL, so the context check prevents an open redirect.
Razor Pages protects POST handlers with antiforgery validation by default; add equivalent CSRF protection if you adapt
this flow to another endpoint type.

:::note
This flow uses the OpenID Connect-specific `GetAuthorizationContextAsync` rather than the protocol-agnostic
`GetAuthenticationContextAsync`. `prompt=create` is defined only by OpenID Connect and has no SAML equivalent, so the
registration page always runs under an OpenID Connect authorization request and the returned context is always an
`AuthorizationRequest`. Both methods share the same return URL validation, so the null check guards against open
redirects identically. Using `GetAuthorizationContextAsync` here matches IdentityServer's built-in `Account/Create`
page and the quickstart templates.
:::

In production, finish any required email confirmation, account approval, or MFA enrollment before calling `SignInAsync`.
Preserve the `returnUrl` through those steps and only continue the authorization flow after the account is ready to sign
in. Your registration code should also handle an existing username or email address without revealing whether an account
already exists. The client should consider registration complete only after the OpenID Connect flow returns successfully.
