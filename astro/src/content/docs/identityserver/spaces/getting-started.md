---
title: "Getting Started With Spaces"
description: "Configure Duende.MultiSpace, request resolution, and an initial IdentityServer space"
date: 2026-09-01
sidebar:
  label: "Getting Started"
  order: 10
---

Spaces require [`Duende.Storage`](/identityserver/data/providers/duende-storage/index.mdx) for their management data and
isolated storage pools.

## Install The Packages

This example uses SQLite:

```bash
# Terminal
dotnet add package Duende.IdentityServer --prerelease
dotnet add package Duende.Storage.Sqlite --prerelease
dotnet add package Duende.MultiSpace --prerelease
```

See the [Duende.MultiSpace](https://www.nuget.org/packages/Duende.MultiSpace) NuGet Gallery page for package versions.

## Configure Services

Register the database provider, Spaces, and the IdentityServer stores:

```csharp
// Program.cs
using Duende.MultiSpace;
using Duende.Storage.Internal;
using Duende.Storage.Schema;
using Duende.Storage.Sqlite;

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

builder.Services
    .AddIdentityServer()
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

Use `ISpaceAdmin` from a trusted provisioning or administration path:

```csharp
// Program.cs
var spaces = app.Services.GetRequiredService<ISpaceAdmin>();

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
```

This pattern requires both the origin and path to match. A request to
`https://login.example.com/t/acme/.well-known/openid-configuration` resolves to the Acme pool.

In a production application, make provisioning idempotent by querying existing spaces before creating them. Do not run
unconditional creation on every application instance.

## Add The Middleware

Space resolution must run before ASP.NET Core routing because path-based matches rewrite `PathBase` and `Path`:

```csharp
// Program.cs
app.UseMultiSpaceResolution();
app.UseRouting();

app.UseIdentityServer();

app.Run();
```

If another middleware reads tenant-specific data, place it after `UseMultiSpaceResolution`. You can inject
`ISpaceContextAccessor` into scoped services and call `GetSpaceId()` after resolution.

## Choose Match Patterns

- Use origin matching when each space has a dedicated host name.
- Use path matching when spaces share a host. The default `/t` prefix keeps space paths separate from ordinary routes.
- Use both when a space must be constrained to a specific host and path.

Origins must include the scheme and host, plus the port when it is not the scheme default. Configure forwarded headers
correctly when a trusted reverse proxy terminates Transport Layer Security (TLS), so IdentityServer resolves the public
origin rather than an internal proxy address.
