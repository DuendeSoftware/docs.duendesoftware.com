---
title: "Getting Started With Spaces"
description: "Step-by-step guide to installing Duende.MultiSpace, configuring space resolution by origin or path and creating your first IdentityServer space"
date: 2026-09-01
sidebar:
  label: "Getting Started"
  order: 10
---

Spaces require [Duende Storage](/identityserver/data/providers/duende-storage/index.mdx) for their management data and
isolated storage pools.

## Install Duende.MultiSpace Packages

This example uses SQLite:

```bash
# Terminal
dotnet add package Duende.IdentityServer --prerelease
dotnet add package Duende.Storage.Sqlite --prerelease
dotnet add package Duende.MultiSpace --prerelease
```

See the [Duende.MultiSpace](https://www.nuget.org/packages/Duende.MultiSpace) NuGet Gallery page for package versions.

## Configure IdentityServer with Spaces

Register the database provider, Spaces and the IdentityServer stores:

```csharp
// Program.cs
using System.Net;
using Duende.MultiSpace;
using Duende.Storage.Internal;
using Duende.Storage.Schema;
using Duende.Storage.Sqlite;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddStorageInternal(storage =>
    storage.AddSqliteStore(options =>
        options.ConnectionString =
            builder.Configuration.GetConnectionString("IdentityServer")
            ?? throw new InvalidOperationException(
                "IdentityServer connection string is missing.")));

builder.Services.AddMultiSpace();
builder.Services.Configure<MultiSpaceOptions>(options =>
{
    options.SpacePathPrefix = "/t";
    options.FallbackToDefault = false;
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedHost |
        ForwardedHeaders.XForwardedProto;
    options.KnownProxies.Add(IPAddress.Parse("203.0.113.42"));
    options.ForwardLimit = 1;
});

builder.Services
    .AddIdentityServer()
    .AddServerSideSessions()
    .AddConfigurationStorage()
    .AddOperationalStorage();

var app = builder.Build();

await app.Services
    .GetRequiredService<IDatabaseSchema>()
    .MigrateAsync(CancellationToken.None);
```

`FallbackToDefault` is already `false`; setting it explicitly makes the intended isolation behavior visible during review.
The current preview storage bootstrap API is named `AddStorageInternal` and may change before general availability.

## Create A Space

Use `ISpaceAdmin` from a trusted provisioning or administration path. Query by name before creating the space:

```csharp
// Program.cs
using Duende.Storage.Querying;

var spaces = app.Services.GetRequiredService<ISpaceAdmin>();

var existing = await spaces.QueryAsync(
    QueryRequest.Create<SpaceFilter, SpaceSortField>(
        new SpaceFilter { Name = "Acme" }),
    CancellationToken.None);

if (!existing.Items.Any(space =>
    string.Equals(space.Name, "Acme", StringComparison.Ordinal)))
{
    var result = await spaces.CreateAsync(
        new CreateSpaceConfiguration
        {
            Name = "Acme",
            MatchPatterns =
            [
                new SpaceMatchPattern
                {
                    Origin = "https://login.example.com",
                    Path = "/acme"
                }
            ]
        },
        CancellationToken.None);

    if (!result.IsSuccess)
    {
        throw new InvalidOperationException(
            $"Could not create the Acme space: {result.Errors}");
    }
}
```

The `Acme` space created in this example requires both the origin and path to match. A request to
`https://login.example.com/t/acme/.well-known/openid-configuration` resolves to the Acme pool.

:::tip[Make Provisioning Idempotent]
Always query existing spaces before creating them. Run provisioning from one deployment process to avoid concurrent
instances racing between the query and create operations.
:::

## Add Space Resolution Middleware

Forwarded headers must run before space resolution so the resolver sees the public scheme and host. Space resolution must
then run before ASP.NET Core routing because path-based matches rewrite `PathBase` and `Path`:

```csharp
// Program.cs
app.UseForwardedHeaders();
app.UseMultiSpaceResolution();
app.UseRouting();

app.UseIdentityServer();

app.Run();
```

If another middleware reads tenant-specific data, place it after `UseMultiSpaceResolution`. You can inject
`ISpaceContextAccessor` into scoped services and call `GetSpaceId()` after resolution.

Replace `203.0.113.42` with your proxy's address or configure an appropriate trusted network. Only accept forwarded
headers from expected proxies or networks. An untrusted forwarded host or protocol can otherwise influence which security
boundary the request selects. See [Proxy Servers and Load Balancers](/identityserver/deployment/index.md#proxy-servers-and-load-balancers)
for more configuration options.

## Choose Match Patterns

* Use origin matching when each space has a dedicated host name.
* Use path matching when spaces share a host. The default `/t` prefix keeps space paths separate from ordinary routes.
* Use both when a space must be constrained to a specific host and path.

Origins must include the scheme and host, plus the port when it is not the scheme default.

## Before Deployment

Review [what Spaces does not isolate](/identityserver/spaces/index.mdx#what-spaces-does-not-isolate) before deploying.
Confirm whether signing credentials, Data Protection, caches, telemetry, rate limits and custom services require
space-aware configuration.
