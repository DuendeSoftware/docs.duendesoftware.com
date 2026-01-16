---
title: "Discovery Endpoint"
description: "Learn about the discovery endpoint that provides metadata about your IdentityServer configuration, including issuer name, key material, and supported scopes."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Discovery
  order: 1
redirect_from:
  - /identityserver/v5/reference/endpoints/discovery/
  - /identityserver/v6/reference/endpoints/discovery/
  - /identityserver/v7/reference/endpoints/discovery/
---

The [discovery endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html) can be used to retrieve metadata
about your IdentityServer - it returns information like the issuer name, key material, supported scopes etc.

The discovery endpoint is available via `/.well-known/openid-configuration` relative to the base address, e.g.:

```text
https://demo.duendesoftware.com/.well-known/openid-configuration
```

## Issuer Name and Path Base

When your IdentityServer is hosted in an application that uses [ASP.NET Core's `PathBaseMiddleware`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.builder.extensions.usepathbasemiddleware), the base path will be
included in the issuer name and discovery document URLs. For example, if your application is configured with a path base
of `/identity`, your configuration will look like this:

```csharp title="Program.cs"
var builder = WebApplication.CreateBuilder(args);

// 👨‍💻 configure Application Host

var app = builder.Build();
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// 👋 Configuring the path base
app.UsePathBase("/identity");

app.UseStaticFiles();
app.UseRouting();

app.UseIdentityServer();
app.UseAuthorization();

app.MapRazorPages()
    .RequireAuthorization();

return app;
```

And the discovery document will look like this:

```json title=".well-known/openid-configuration"
{
  "issuer": "https://localhost:5001/identity",
  "jwks_uri": "https://localhost:5001/identity/.well-known/openid-configuration/jwks",
  "authorization_endpoint": "https://localhost:5001/identity/connect/authorize",
  "token_endpoint": "https://localhost:5001/identity/connect/token",
  "userinfo_endpoint": "https://localhost:5001/identity/connect/userinfo",
  "end_session_endpoint": "https://localhost:5001/identity/connect/endsession",
  "check_session_iframe": "https://localhost:5001/identity/connect/checksession",
  "revocation_endpoint": "https://localhost:5001/identity/connect/revocation",
  "introspection_endpoint": "https://localhost:5001/identity/connect/introspect",
  "device_authorization_endpoint": "https://localhost:5001/identity/connect/deviceauthorization",
  "backchannel_authentication_endpoint": "https://localhost:5001/identity/connect/ciba",
  "pushed_authorization_request_endpoint": "https://localhost:5001/identity/connect/par"
}
```

This can be helpful when configuring IdentityServer in a multi-tenant scenario where the base path is used to
identify the tenant.

## .NET Client Library

You can use the [Duende IdentityModel](/identitymodel/index.mdx) client library to programmatically interact with
the protocol endpoint from .NET code.

```csharp
var client = new HttpClient();

var disco = await client.GetDiscoveryDocumentAsync("https://demo.duendesoftware.com");
```