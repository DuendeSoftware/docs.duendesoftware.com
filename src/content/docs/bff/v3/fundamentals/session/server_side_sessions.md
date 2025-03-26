---
title: "Server-side Sessions"
description: "BFF"
weight: 40
---

By default, ASP.NET Core's cookie handler will store all user session data in a protected cookie. This works very well unless cookie size or revocation becomes an issue.

Duende.BFF includes all the plumbing to store your sessions server-side. The cookie will then only be used to transmit the session ID between the browser and the BFF host. This has the following advantages

* the cookie size will be very small and constant - regardless how much data (e.g. token or claims) is stored in the authentication session
* the session can be also revoked outside the context of a browser interaction, for example when receiving a back-channel logout notification from the upstream OpenID Connect provider

## Configuring Server-side Sessions

Server-side sessions can be enabled in the application's startup:

```csharp
builder.Services.AddBff()
    .AddServerSideSessions();
```

The default implementation stores the session in-memory. This is useful for testing, but for production you typically want a more robust storage mechanism. We provide an implementation of the session store built with EntityFramework (EF) that can be used with any database with an EF provider (e.g. Microsoft SQL Server). You can also use a custom store. See [extensibility](/bff/v3/extensibility/sessions#user-session-store) for more information.

## Using Entity Framework for the Server-side Session Store

To use the EF session store, install the *Duende.BFF.EntityFramework* NuGet package and register it by calling *AddEntityFrameworkServerSideSessions*, like this:

```csharp
var cn = _configuration.GetConnectionString("db");
        
builder.Services.AddBff()
    .AddEntityFrameworkServerSideSessions(options=> 
    {
        options.UseSqlServer(cn);        
    });
```

### Entity Framework Migrations 
Most datastores that you might use with Entity Framework use a schema to define the structure of their data. *Duende.BFF.EntityFramework* doesn't make any assumptions about the underlying datastore, how (or indeed even if) it defines its schema, or how schema changes are managed by your organization. For these reasons, Duende does not directly support database creation, schema changes, or data migration by publishing database scripts. You are expected to manage your database in the way your organization sees fit. Using EF migrations is one possible approach to that, which Duende facilitates by publishing entity classes in each version of *Duende.BFF.EntityFramework*. An example project that uses those entities to create migrations is [here](https://github.com/DuendeSoftware/products/tree/main/bff/migrations/UserSessionDb).

## Session Store Cleanup

Added in v1.2.0.

Abandoned sessions will remain in the store unless something removes the stale entries.
If you wish to have such sessions cleaned up periodically, then you can configure the *EnableSessionCleanup* and *SessionCleanupInterval* options:

```csharp
builder.Services.AddBff(options => {
        options.EnableSessionCleanup = true;
        options.SessionCleanupInterval = TimeSpan.FromMinutes(5);
    })
    .AddServerSideSessions();
```

This requires an implementation of [*IUserSessionStoreCleanup*](/bff/v3/extensibility/sessions#user-session-store-cleanup) in the DI system.

If using Entity Framework Core, then the *IUserSessionStoreCleanup* implementation is provided for you when you use *AddEntityFrameworkServerSideSessions*.
Just enable session cleanup:

```csharp
var cn = _configuration.GetConnectionString("db");
        
builder.Services.AddBff(options => {
        options.EnableSessionCleanup = true;
    })
    .AddEntityFrameworkServerSideSessions(options=> 
    {
        options.UseSqlServer(cn);        
    });
```
