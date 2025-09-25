---
title: "Duende BFF Security Framework v3.0 to v4.0"
description: Guide for upgrading Duende BFF Security Framework from version 3.x to version 4.0, including migration steps for custom implementations and breaking changes.
sidebar:
  label: v3.0 → v4.0
  order: 20
---

Duende BFF Security Framework v4.0 is a significant release that includes:

* Multi-frontend support
* OpenTelemetry support
* Support for login prompts
* Several fixes and improvements

The extensibility approach has been drastically changed, and many `virtual` methods containing implementation logic are now internal instead.

:::caution[Duende BFF Security Framework v4 is still in preview]
The Duende BFF Security Framework v4 is still in preview. This version (and associated documentation) is still evolving.
:::

## Upgrading

This release introduces many breaking changes. This upgrade guide covers cases where a breaking change was introduced.

### Remote APIs

The syntax for configuring remote APIs has changed slightly:

```diff lang="csharp" title="Program.cs"
// Use a client credentials token
- app.MapRemoteBffApiEndpoint("/api/client-token", "https://localhost:5010")
-    .RequireAccessToken(TokenType.Client);

+ app.MapRemoteBffApiEndpoint("/api/client-token", new Uri("https://localhost:5010"))
+    .WithAccessToken(RequiredTokenType.Client);      

// Use the client token only if the user is logged in
- app.MapRemoteBffApiEndpoint("/api/optional-user-token", "https://localhost:5010")
-    .WithOptionalUserAccessToken();

+ app.MapRemoteBffApiEndpoint("/api/optional-user-token", new Uri("https://localhost:5010"))
+    .WithAccessToken(RequiredTokenType.UserOrNone);            
```

* The enum `TokenType` has been renamed to `RequiredTokenType`, and moved from the `Duende.Bff` to `Duende.Bff.AccessTokenManagement` namespace.
* The methods to configure the token type have all been replaced with a new method `WithAccessToken()`
* Requesting an optional access token should no longer be done by calling `WithOptionalUserAccessToken()`. Use `WithAccessToken(RequiredTokenType.UserOrNone)` instead.

### Configuring Token Types In YARP

The required token type configuration in YARP has also changed slightly. It uses the enum values from `RequiredTokenType`.

### Extending The BFF

#### Simplified Wireup Without Explicit Authentication Setup

The V3 style of wireup still works, but BFF V4 comes with a newer style of wireup:

```csharp
services.AddBff()
    .ConfigureOpenIdConnect(options =>
    {
        options.Authority = "your authority";
        options.ClientId = "your client id";
        options.ClientSecret = "secret";
        // ... other OpenID Connect options. 
    }
    .ConfigureCookies(options => {
        // The cookie options are automatically configured with recommended practices.
        // However, you can change the config here. 
    });
```

Adding this will automatically configure a Cookie and OpenID Connect flow.

#### Adding Multiple Frontends

You can statically add a list of frontends by calling the `AddFrontends` method.

```csharp
.AddFrontends(
    new BffFrontend(BffFrontendName.Parse("default-frontend"))
        .WithIndexHtmlUrl(new Uri("https://localhost:5005/static/index.html")),

    new BffFrontend(BffFrontendName.Parse("with-path"))
        .WithOpenIdConnectOptions(opt =>
        {
            opt.ClientId = "bff.multi-frontend.with-path";
            opt.ClientSecret = "secret";
        })
        .WithIndexHtmlUrl(new Uri("https://localhost:5005/static/index.html"))
        .MappedToPath(LocalPath.Parse("/with-path")),

    new BffFrontend(BffFrontendName.Parse("with-domain"))
        .WithOpenIdConnectOptions(opt =>
        {
            opt.ClientId = "bff.multi-frontend.with-domain";
            opt.ClientSecret = "secret";
        })
        .WithIndexHtmlUrl(new Uri("https://localhost:5005/static/index.html"))
        .MappedToOrigin(Origin.Parse("https://app1.localhost:5005"))
        .WithRemoteApis(
            new RemoteApi(LocalPath.Parse("/api/user-token"), new Uri("https://localhost:5010")),
            new RemoteApi(LocalPath.Parse("/api/client-token"), new Uri("https://localhost:5010"))
)
```

#### Loading Configuration From `IConfiguration`

Loading configuration, including OpenID Connect configuration from `IConfiguration` is now supported:

```csharp
services.AddBff().LoadConfiguration(bffConfig);
```

This enables you to configure your OpenID Connect options, including secrets, and configure the list of frontends. This also adds a file watcher, to automatically add / remove frontends from the config file.

See the type `BffConfiguration` to see what settings can be configured.

#### Index HTML Retrieval

It's fairly common to deploy your application in such a way to have the BFF be the first entrypoint for your application. It should serve an index.html that will bootstrap your frontend. However, your static content should be loaded from a CDN.

If you publish your frontend code to a cdn with absolute paths (for example by specifying a base path in your vite config), then all static content is loaded directly from the CDN.

You can configure the location of your `index.html` by specifying:

```csharp
.WithIndexHtmlUrl(new Uri("https://localhost:5005/static/index.html"))
```

### Server Side Sessions Database Migrations

When using the server side sessions feature backed by the `Duende.BFF.EntityFramework` package, you will need to script [Entity Framework database migrations](/bff/fundamentals/session/server-side-sessions.mdx#entity-framework-migrations) and apply these changes to your database. 

```shell
dotnet ef migrations add BFFUserSessionsV4 -o Migrations -c SessionDbContext
```

In the `UserSessions` table, a number of changes were introduced:
* The `ApplicationName` column was renamed to `PartitionKey`. This column will contain the BFF frontend name.
* Related indexes were updated.

```sqlite
// serversidesessions.sql
ALTER TABLE "UserSessions" RENAME COLUMN "ApplicationName" TO "PartitionKey";

DROP INDEX "IX_UserSessions_ApplicationName_SubjectId_SessionId";
CREATE UNIQUE INDEX "IX_UserSessions_PartitionKey_SubjectId_SessionId" ON "UserSessions" ("PartitionKey", "SubjectId", "SessionId");

DROP INDEX "IX_UserSessions_ApplicationName_SessionId";
CREATE UNIQUE INDEX "IX_UserSessions_PartitionKey_SessionId" ON "UserSessions" ("PartitionKey", "SessionId");

DROP INDEX "IX_UserSessions_ApplicationName_Key";
CREATE UNIQUE INDEX "IX_UserSessions_PartitionKey_Key" ON "UserSessions" ("PartitionKey", "Key");
```

:::note
This is a breaking database schema change. If you have multiple BFF V3 applications that share the same database table,
you either need to update all BFF applications to V4 at the same time or use a new database for the upgraded BFF V4 application.
:::
