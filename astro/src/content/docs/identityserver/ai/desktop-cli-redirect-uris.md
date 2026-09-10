---
title: "OAuth Redirect URIs For Desktop And CLI MCP Clients"
description: "How to configure Duende IdentityServer to accept OAuth callback URIs with ephemeral loopback ports for desktop and command-line MCP clients."
sidebar:
  label: Desktop & CLI Redirects
  order: 2
redirect_from:
  - /identityserver/ai/loopback-redirect-uris/
---

Desktop and command-line OAuth clients, including MCP clients, often open the user's browser for authorization and start
a temporary HTTP listener to receive the callback. The operating system assigns an available port, so the redirect URI
changes each time the client starts. IdentityServer's default redirect URI validator uses exact string matching, which
rejects a port that was not registered in advance.

IdentityServer provides an opt-in validator for the AppAuth pattern described by RFC 8252. It accepts an ephemeral port
on the IPv4 loopback address while keeping exact matching for other redirect URIs.

:::note
Hosted MCP clients with a stable HTTPS callback do not need this setup. Register their complete redirect URI as usual.
:::

## How To Enable Port-Agnostic Loopback Redirects

Use this setup when a public client can use the IPv4 loopback address but cannot know its callback port before it starts.

Register the validator in the **IdentityServer host**:

```csharp
// Program.cs in the IdentityServer host
builder.Services.AddIdentityServer()
    .AddAppAuthRedirectUriValidator();
```

`AddAppAuthRedirectUriValidator` registers `StrictRedirectUriValidatorAppAuth` as the application's
`IRedirectUriValidator`. It replaces the default validator, keeps exact matching for regular redirect URIs, and adds the
port-agnostic `127.0.0.1` behavior described below.

Configure the public client in the **IdentityServer host** with PKCE and the exact base URI `http://127.0.0.1`:

```csharp
// Config.cs in the IdentityServer host
new Client
{
    ClientId = "desktop-mcp-client",
    RequireClientSecret = false,
    RequirePkce = true,
    AllowedGrantTypes = GrantTypes.Code,
    RedirectUris = { "http://127.0.0.1" },
    AllowedScopes = { "openid", "mcp:tools" }
};
```

At runtime, the client can use an available port and callback path:

```text
http://127.0.0.1:49152/callback
```

The validator applies the same port-agnostic behavior to post-logout redirects when the client registers
`http://127.0.0.1` in `PostLogoutRedirectUris`.

## What Does The AppAuth Validator Accept?

The built-in validator requires all the following:

* The client has `RequirePkce = true`
* The registered redirect URI is exactly `http://127.0.0.1`, without a port
* The requested redirect URI uses `http`, the IPv4 literal `127.0.0.1`, and a numeric port from 0 through 65535

Clients should use the non-zero port assigned by the operating system. Port 0 is accepted by the validator, but it does
not identify the port where the client is listening.

It does not apply port-agnostic matching to `localhost`, IPv6 loopback (`[::1]`), HTTPS loopback URIs, or any other host.
Those values still need an exact registered match unless you provide a custom validator.

:::caution
The built-in AppAuth validator accepts the callback path supplied at runtime. If your client requires a fixed callback
path, implement [`IRedirectUriValidator`](/identityserver/reference/v8/validators/redirect-uri-validator.md) and validate
the scheme, loopback address, and path explicitly while allowing only the port to vary. Do not use a general wildcard or
suffix match for redirect URIs.
:::

## How To Secure The Local Callback

[RFC 8252](https://www.rfc-editor.org/rfc/rfc8252#section-7.3) allows HTTP for loopback redirects because the request does
not leave the device. It requires authorization servers to allow an ephemeral port for loopback IP redirect URIs.

The client should:

* Use an external browser for authorization
* Bind the listener only to the loopback interface
* Open the listener immediately before authorization and close it after the callback
* Use PKCE and validate the authorization response state
* Avoid `localhost`, whose name resolution may not point only to the loopback interface

PKCE protects an intercepted authorization code, but it does not make a shared client secret confidential. Desktop and
command-line applications should be configured as public clients unless they can protect credentials independently.

The built-in validator intentionally supports only `127.0.0.1`. If a third-party client requires `localhost` or IPv6,
use a custom `IRedirectUriValidator` and document why the broader behavior is needed.
