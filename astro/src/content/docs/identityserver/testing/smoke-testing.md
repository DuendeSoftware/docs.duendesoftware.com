---
title: "Smoke Testing a Login Flow"
description: "How to smoke test the interactive login flow of a deployed Duende IdentityServer from plain .NET, using a cookie-aware HttpClient and AngleSharp instead of a headless browser."
date: 2026-09-02T08:00:00+02:00
sidebar:
  label: Smoke Testing
  order: 20
---

[Integration tests](/identityserver/testing/index.md) validate configuration, but sometimes you want
a quick check that a *deployed* instance can still complete an interactive login. You can do this
without an end-to-end tool like Playwright or Selenium and a headless browser.

Simulate a browser from plain .NET code by driving the login flow with an `HttpClient` that tracks
cookies. The pieces you need are:

* A cookie-aware handler, for example an `HttpClientHandler` with a `CookieContainer`, so the session
  and antiforgery cookies flow across requests the way a browser handles them.
* Parsing the returned login HTML to extract the form fields, including the antiforgery token, and
  posting valid credentials back to the login endpoint.
* Confirming that IdentityServer redirects back to the original client host, which is the expected
  outcome of a successful OpenID Connect sign-in.

This makes a useful post-deployment or CI health check. Given a protected URL, a username, and a
password, the script confirms that first-party logins still work against a live deployment.

The example below uses [AngleSharp](https://www.nuget.org/packages/AngleSharp) to parse the login
form HTML:

```shell
dotnet add package AngleSharp
```

```csharp
// LoginSmokeTest.cs
using AngleSharp.Html.Parser;

var protectedUrl = "https://your-app.example.com/protected";
var username = "alice";
var password = "alice";

// A cookie container lets session and antiforgery cookies flow across requests.
var cookies = new CookieContainer();
using var handler = new HttpClientHandler { CookieContainer = cookies };
using var client = new HttpClient(handler);

// 1. Request the protected page. This follows the redirect to the login page.
var loginPage = await client.GetAsync(protectedUrl);
var loginHtml = await loginPage.Content.ReadAsStringAsync();

// 2. Parse the login form and read the antiforgery token.
var document = await new HtmlParser().ParseDocumentAsync(loginHtml);
var form = document.QuerySelector("form")
    ?? throw new InvalidOperationException("No login form found.");
var antiforgeryToken = form
    .QuerySelector("input[name='__RequestVerificationToken']")
    ?.GetAttribute("value");

// 3. Post the credentials back to the login endpoint.
var loginUrl = new Uri(loginPage.RequestMessage!.RequestUri!, form.GetAttribute("action"));
var formData = new FormUrlEncodedContent(new Dictionary<string, string>
{
    ["Username"] = username,
    ["Password"] = password,
    ["__RequestVerificationToken"] = antiforgeryToken!,
    ["button"] = "login",
});
var result = await client.PostAsync(loginUrl, formData);

// 4. A successful sign-in redirects back to the original application host.
var succeeded = result.RequestMessage!.RequestUri!.Host == new Uri(protectedUrl).Host;
Console.WriteLine(succeeded ? "Login succeeded." : "Login failed.");
```

:::note
This technique assumes the default template field names on the login form. If you have customized
your login page, adjust the field parsing to match.
:::
