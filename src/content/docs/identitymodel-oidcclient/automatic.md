---
title: OIDC Client Automatic Mode
description: Learn how to implement automatic OAuth/OIDC authentication by encapsulating browser interactions using OidcClient
sidebar:
  label: Automatic Mode
  order: 3
redirect_from:
  - /foss/identitymodel.oidcclient/automatic/
---

OpenID Connect (OIDC) is a simple identity layer on top of the OAuth 2.0
protocol. It allows clients to verify the identity of the end-user based on
the authentication performed by an authorization server, as well as obtain
basic profile information.

An essential part of the OIDC flow is the use of a browser to interact with the
end-user and to obtain permissions to access protected resources.

In the OidcClient library, you can encapsulate the browser interaction by implementing the
[IBrowser](https://github.com/DuendeSoftware/foss/blob/main/identity-model-oidc-client/src/IdentityModel.OidcClient/Browser/IBrowser.cs)
interface. Using `IBrowser` helps create a reusable component for all OIDC interaction.

```csharp
// Copyright (c) Duende Software. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

namespace Duende.IdentityModel.OidcClient.Browser;

/// <summary>
/// Models a browser
/// </summary>
public interface IBrowser
{
    /// <summary>
    /// Invokes the browser.
    /// </summary>
    /// <param name="options">The options.</param>
    /// <param name="cancellationToken">A token that can be used to cancel the request</param>
    /// <returns></returns>
    Task<BrowserResult> InvokeAsync(BrowserOptions options, CancellationToken cancellationToken = default);
}
```

The `BrowserResult` represents the result of the browser interaction, including any OIDC payloads that
are returned from the authentication server.

```csharp
// Copyright (c) Duende Software. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

namespace Duende.IdentityModel.OidcClient.Browser;

/// <summary>
/// The result from a browser login.
/// </summary>
/// <seealso cref="Result" />
public class BrowserResult : Result
{
    /// <summary>
    /// Gets or sets the type of the result.
    /// </summary>
    /// <value>
    /// The type of the result.
    /// </value>
    public BrowserResultType ResultType { get; set; }

    /// <summary>
    /// Gets or sets the response.
    /// </summary>
    /// <value>
    /// The response.
    /// </value>
    public string Response { get; set; }
}
```

:::note
The `IBrowser` implementation must be specific to the platform and environment and must be provided by the
host application. For example, a Windows-specific implementation will not work within a macOS, iOS, Android, or Linux environment.
:::

For a simple example, the following code shows how to use the
[SystemBrowser](https://github.com/DuendeSoftware/foss/blob/main/identity-model-oidc-client/clients/ConsoleClientWithBrowser/SystemBrowser.cs)
to invoke a browser on the host desktop platform. The `SystemBrowser` is a naive implementation that uses the
[System.Diagnostics.Process](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.process) class to invoke the browser.

```cs
var options = new OidcClientOptions
{
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native",
    RedirectUri = redirectUri,
    Scope = "openid profile api",
    Browser = new SystemBrowser() 
};

var client = new OidcClient(options);
```

Once the `IBrowser` is configured, the `LoginAsync` method can be invoked to start the authentication flow.

```cs
var result = await client.LoginAsync();
```

Setting the `Browser` property reduces the need to process browser respones and to handle the `BrowserResult` directly. When using this automatic mode, the `LoginAsync` method will return a
[`LoginResult`](https://github.com/DuendeSoftware/foss/blob/19370c6d4820a684d41d1d40b8192ee8b873b8f0/identity-model-oidc-client/src/IdentityModel.OidcClient/LoginResult.cs) which will contain a `ClaimsPrincipal` with the user's claims along with the `IdentityToken` and `AccessToken`.


