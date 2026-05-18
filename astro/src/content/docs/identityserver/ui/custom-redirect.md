---
title: "Customizing authorize interaction redirects"
description: "How to subclass AuthorizeInteractionPageHttpWriter to customize how IdentityServer redirects users to login, consent, and other interaction pages."
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

## How it works

`AuthorizeInteractionPageHttpWriter` implements `IHttpResponseWriter<AuthorizeInteractionPageResult>` and exposes three virtual methods you can override independently:

| Method                  | Responsibility                                                      |
|-------------------------|---------------------------------------------------------------------|
| `BuildReturnUrlAsync`   | Builds the URL that points back to the authorize callback endpoint. |
| `BuildRedirectUrlAsync` | Combines the interaction page URL with the return URL.              |
| `WriteResponseAsync`    | Writes the HTTP response (status code, `Location` header).          |

The default `WriteHttpResponse` implementation calls all three in sequence. You only need to override the method that covers the behavior you want to change.

## Example: appending a custom query parameter

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
        IUiLocalesService localesService,
        IAuthorizationParametersMessageStore? authorizationParametersMessageStore = null)
        : base(options, urls, localesService, authorizationParametersMessageStore)
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

## Example: setting a cookie before the redirect

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

## Registering your writer

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
