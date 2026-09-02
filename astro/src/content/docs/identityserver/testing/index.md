---
title: "Testing Duende IdentityServer"
description: "How to write integration tests for authentication and authorization against an in-process Duende IdentityServer using WebApplicationFactory and xUnit."
date: 2026-09-02T08:00:00+02:00
sidebar:
  label: Overview
  order: 14
---

Testing an application that relies on OAuth 2.0 and OpenID Connect can be intimidating. There are
tokens to acquire, discovery documents to read, and a login flow that spans several redirects. You
can avoid most of that friction by running a real, fully configured Duende IdentityServer in memory
as part of your test suite and calling it like any other ASP.NET Core application.

This page shows how to stand up an in-process IdentityServer for integration testing, request tokens,
and change configuration per test. It also covers a lightweight way to smoke test the login flow of
an instance you have already deployed.

## Why Run Integration Tests In-Process?

Most teams treat their identity provider like an appliance. It sits in the background doing critical
work, and you rarely think about it until something breaks. Running an in-process instance during
tests gives you accurate OAuth 2.0 and OpenID Connect behavior with real endpoints, real token
issuance, and real validation. You get that without external infrastructure or a headless browser.

In-process tests are a good fit when you want to verify that:

- your IdentityServer configuration (clients, scopes, resources) is correct,
- your APIs accept tokens issued by your IdentityServer,
- and any customizations, such as profile services, extension grants, or validators, behave as intended.

## How to Set Up the Test Solution

Start from the in-memory template, `duende-is-inmem`, in the
[`Duende.Templates`](/identityserver/overview/packaging.mdx) NuGet package. As the name suggests,
its configuration and users live in memory, which makes it a flexible starting point for tests.

You need at least two projects: your IdentityServer host, and a test project. This example uses
[xUnit](https://xunit.net/), but any test framework works.

To let the test project run the host as a test server, add a reference from the test project to the
host project.

In the test project, switch to the web SDK so the ASP.NET Core testing APIs are available:

```diff lang="xml" title=".csproj"
- <Project Sdk="Microsoft.NET.Sdk">
+ <Project Sdk="Microsoft.NET.Sdk.Web">
```

Then add the [`Microsoft.AspNetCore.Mvc.Testing`](https://learn.microsoft.com/aspnet/core/test/integration-tests)
package, which provides `WebApplicationFactory<T>` for running the host in memory:

```shell
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

You will likely also want to use the [Duende.IdentityModel](/identitymodel/index.mdx) package in your test project,
to make consuming OpenID Connect and OAuth 2.0 endpoints more straightforward:

```shell
dotnet add package Duende.IdentityModel
```

## How to Make Configuration Modifiable at Runtime

The template ships a static `Config` class that holds the in-memory clients, scopes, and resources.
For testing, make its collections mutable so a single test can add a purpose-built client or scope:

```csharp
// Config.cs
public static class Config
{
    public static List<IdentityResource> IdentityResources { get; } =
    [
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
    ];

    public static List<ApiScope> ApiScopes { get; } =
    [
        new ApiScope("api1", "My API"),
    ];

    public static List<Client> Clients { get; } =
    [
        new Client
        {
            ClientId = "m2m.client",
            ClientSecrets = { new Secret("secret".Sha256()) },
            AllowedGrantTypes = GrantTypes.ClientCredentials,
            AllowedScopes = { "api1" },
        },
    ];
}
```

## How to Write Integration Tests

`WebApplicationFactory<Program>` starts the IdentityServer host in memory and gives you an
`HttpClient` that targets it. The instance is served from `localhost` over HTTPS, so you can call any
endpoint directly.

### Read the Discovery Document

Start with the discovery document. It confirms the host boots, serves the OpenID Connect metadata,
and reports no configuration errors. It is the smallest useful test and a quick way to check that the
fixture itself works before you write anything more involved.

```csharp
// IdentityServerTests.cs
public class IdentityServerTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Discovery_document_is_available()
    {
        var client = factory.CreateClient();

        var disco = await client.GetDiscoveryDocumentAsync();

        Assert.False(disco.IsError);
    }
}
```

### Request a Token

Use the client from the factory to request a token with the client credentials grant, using the
`m2m.client` from `Config`:

```csharp
[Fact]
public async Task Can_request_client_credentials_token()
{
    var client = factory.CreateClient();

    var response = await client.RequestClientCredentialsTokenAsync(new()
    {
        Address = "connect/token",
        ClientId = "m2m.client",
        ClientSecret = "secret",
        Scope = "api1",
    });

    Assert.False(response.IsError);
    Assert.NotNull(response.AccessToken);
}
```

The `RequestClientCredentialsTokenAsync` and `GetDiscoveryDocumentAsync` helpers come from the
[Duende.IdentityModel](/identitymodel/index.mdx) package.

### Customize Configuration for a Single Test

Because the collections in `Config` are mutable, a test can clear the client list and register a
client tailored to the scenario under test:

```csharp
[Fact]
public async Task Custom_client_can_request_token()
{
    Config.Clients.Clear();
    Config.Clients.Add(new Client
    {
        ClientId = "test.client",
        ClientSecrets = { new Secret("test-secret".Sha256()) },
        AllowedGrantTypes = GrantTypes.ClientCredentials,
        AllowedScopes = { "api1" },
    });

    var client = factory.CreateClient();
    var response = await client.RequestClientCredentialsTokenAsync(new()
    {
        Address = "connect/token",
        ClientId = "test.client",
        ClientSecret = "test-secret",
        Scope = "api1",
    });

    Assert.False(response.IsError);
}
```

### Access IdentityServer Services

Because the host runs in process, you can reach its service provider through `factory.Services`. This
helps when you want to assert on custom registrations or work out why a customized IdentityServer
behaves in an unexpected way:

```csharp
using var scope = factory.Services.CreateScope();
var profileService = scope.ServiceProvider.GetRequiredService<IProfileService>();
```

## How to Smoke Test a Deployed Login Flow

Integration tests validate configuration, but sometimes you want a quick check that a deployed
instance can still complete an interactive login. You can do this without an end-to-end tool like
Playwright or Selenium and a headless browser.

Simulate a browser from plain .NET code by driving the login flow with an `HttpClient` that tracks
cookies. The pieces you need are:

- A cookie-aware handler, for example an `HttpClientHandler` with a `CookieContainer`, so the session
  and antiforgery cookies flow across requests the way a browser handles them.
- Parsing the returned login HTML to extract the form fields, including the antiforgery token, and
  posting valid credentials back to the login endpoint.
- Confirming that IdentityServer redirects back to the original client host, which is the expected
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
