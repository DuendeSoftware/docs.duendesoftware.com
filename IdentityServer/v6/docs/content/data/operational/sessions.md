---
title: "Server-Side Sessions"
description: "Data Store"
weight: 50
---

(added in 6.1)

The [server-side sessions]({{<ref "/ui/server_side_sessions">}}) feature in Duende IdentityServer requires a store to persist a user's session data.

## Server-Side Session Store

The [IServerSideSessionStore]({{<ref "/reference/stores/server_side_sessions">}}) abstracts storing the server-side session data.
[ServerSideSession]({{<ref "/reference/stores/server_side_sessions#serversidesession">}}) objects act as the storage entity, and provide several properties uses as metadata for the session. The *Ticket* property contains the actual serailized data used by the ASP.NET Cookie Authentication handler.

The methods on the [IServerSideSessionStore]({{<ref "/reference/stores/server_side_sessions">}}) are used to orchestrate the various management functions needed by the [server-side sessions]({{<ref "/ui/server_side_sessions#session-management">}}) feature.

## Registering a custom store

To register a custom server-side session store in the DI container, there is a *AddServerSideSessionStore* helper on the *IIdentityServerBuilder*.
It is still necessary to call *AddServerSideSessions* to enable the server-side session feature.
For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
        .AddServerSideSessions()
        .AddServerSideSessionStore<YourCustomStore>();
}
```

There is also an overloaded version of a *AddServerSideSessions* that will perform both registration steps in one call.
For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
        .AddServerSideSessions<YourCustomStore>();
}
```

## EntityFramework store implementation

An EntityFramework Core implementation of the server-side session store is included in the [Entity Framework Integration]({{<ref "/data/ef#operational-store">}}) operational store.

When using the EntityFramework Core operational store, it will be necessary to indicate that server-side sessions need to be used with the call to the *AddServerSideSessions* fluent API.
For example:


```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
            .AddServerSideSessions()
            .AddOperationalStore(options =>
            {
                // ...
            });
}
```
