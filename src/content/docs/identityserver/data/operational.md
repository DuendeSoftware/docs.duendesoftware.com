---
title: Operational Data
description: Documentation for managing dynamic operational data in IdentityServer including grants, keys, and server-side sessions
sidebar:
  order: 20
redirect_from:
  - /identityserver/v5/data/operational/
  - /identityserver/v5/data/operational/grants/
  - /identityserver/v5/data/operational/keys/
  - /identityserver/v6/data/operational/
  - /identityserver/v6/data/operational/grants/
  - /identityserver/v6/data/operational/keys/
  - /identityserver/v6/data/operational/sessions/
  - /identityserver/v7/data/operational/
  - /identityserver/v7/data/operational/grants/
  - /identityserver/v7/data/operational/keys/
  - /identityserver/v7/data/operational/sessions/
---


For certain operations, IdentityServer needs a persistence store to keep dynamically created state.
This data is collectively called *operational data*, and includes:

* [Grants](#grants) for authorization and device codes, reference and refresh tokens, and remembered user consent
* [Keys](#keys) managing dynamically created signing keys
* [Server Side Sessions](#server-side-sessions) for storing authentication session data for interactive users server-side

## Grants

Many protocol flows produce state that represents a grant of one type or another.
These include authorization and device codes, reference and refresh tokens, and remembered user consent.

### Stores

The persistence for grants is abstracted behind two interfaces:
* The [persisted grant store](/identityserver/reference/stores/persisted-grant-store/) is a common store for most grants.
* The [device flow store](/identityserver/reference/stores/device-flow-store/) is a specialized store for device grants.

### Registering Custom Stores

Custom implementations of `IPersistedGrantStore`, and/or `IDeviceFlowStore` must be registered in the ASP.NET Core service provider.
For example:

```cs
// Program.cs
builder.Services.AddIdentityServer();

builder.Services.AddTransient<IPersistedGrantStore, YourCustomPersistedGrantStore>();
builder.Services.AddTransient<IDeviceFlowStore, YourCustomDeviceFlowStore>();
```

### Grant Expiration and Consumption
The presence of the record in the store without a `ConsumedTime` and while still within the `Expiration` represents the validity of the grant.
Setting either of these two values, or removing the record from the store effectively revokes the grant.

Some grant types are one-time use only (either by definition or configuration).
Once they are "used", rather than deleting the record, the `ConsumedTime` value is set in the database marking them as having been used.
This "soft delete" allows for custom implementations to either have flexibility in allowing a grant to be re-used (typically within a short window of time),
or to be used in risk assessment and threat mitigation scenarios (where suspicious activity is detected) to revoke access.
For refresh tokens, this sort of custom logic would be performed in the [IRefreshTokenService](/identityserver/reference/services/refresh-token-service/).

### Grant Data
The `Data` property of the model contains the authoritative copy of the values in the store. This data is protected at rest using the ASP.NET Data Protection API. Except for `ConsumedTime`, the other properties of the model should be treated as read-only.

### Persisted Grant Service
Working with the grants store directly might be too low level.
As such, a higher level service called the [IPersistedGrantService](/identityserver/reference/services/persisted-grant-service/) is provided.
It abstracts and aggregates the different grant types into one concept, and allows querying and revoking the persisted grants for a user.

## Keys

The [automatic key management](/identityserver/fundamentals/key-management/#automatic-key-management) feature in Duende IdentityServer requires a store to persist keys that are dynamically created.

### Signing Key Store
By default, the file system is used, but the storage of these keys is abstracted behind an extensible store interface.
The [ISigningKeyStore](/identityserver/reference/stores/signing-key-store/) is that storage interface.

### Registering a custom signing key store

To register a custom signing key store in the ASP.NET Core service provider, there is a `AddSigningKeyStore` helper on the `IIdentityServerBuilder`.
For example:

```cs
// Program.cs
builder.Services.AddIdentityServer()
    .AddSigningKeyStore<YourCustomStore>();
```

### Key Lifecycle
When keys are required, `LoadKeysAsync` will be called to load them all from the store.
They are then cached automatically for some amount of time based on [configuration](/identityserver/reference/options/#key-management).
Periodically a new key will be created, and `StoreKeyAsync` will be used to persist the new key.
Once a key is past its retirement, `DeleteKeyAsync` will be used to purge the key from the store.

### Serialized Key
The [SerializedKey](/identityserver/reference/stores/signing-key-store/#serializedkey) is the model that contains the key data to persist.

It is expected that the `Id` is the unique identifier for the key in the store. The `Data` property is the main payload of the key and contains a copy of all the other values. Some of the properties affect how the `Data` is processed (e.g. `DataProtected`), and the other properties are considered read-only and thus can't be changed to affect the behavior (e.g. changing the `Created` value will not affect the key lifetime, nor will changing `Algorithm` change which signing algorithm the key is used for).

## Server Side Sessions

:::tip
Added in Duende IdentityServer 6.1
:::

The [server-side sessions](/identityserver/ui/server-side-sessions/) feature in Duende IdentityServer requires a store to persist a user's session data.

### Server-Side Session Store

The [IServerSideSessionStore](/identityserver/reference/stores/server-side-sessions/) abstracts storing the server-side session data.
[ServerSideSession](/identityserver/reference/stores/server-side-sessions/#serversidesession) objects act as the storage entity, and provide several properties uses as metadata for the session. The `Ticket` property contains the actual serialized data used by the ASP.NET Cookie Authentication handler.

The methods on the [IServerSideSessionStore](/identityserver/reference/stores/server-side-sessions/) are used to orchestrate the various management functions needed by the [server-side sessions](/identityserver/ui/server-side-sessions/#session-management) feature.

### Registering a custom store

To register a custom server-side session store in the ASP.NET Core service provider, there is a `AddServerSideSessionStore` helper on the `IIdentityServerBuilder`.
It is still necessary to call `AddServerSideSessions` to enable the server-side session feature.
For example:

```cs
// Program.cs
builder.Services.AddIdentityServer()
    .AddServerSideSessions()
    .AddServerSideSessionStore<YourCustomStore>();
```

There is also an overloaded version of a `AddServerSideSessions` that will perform both registration steps in one call.
For example:

```cs
// Program.cs
builder.Services.AddIdentityServer()
    .AddServerSideSessions<YourCustomStore>();
```

### EntityFramework Store Implementation

An EntityFramework Core implementation of the server-side session store is included in the [Entity Framework Integration](/identityserver/data/ef#operational-store) operational store.

When using the EntityFramework Core operational store, it will be necessary to indicate that server-side sessions need to be used with the call to the `AddServerSideSessions` fluent API.
For example:


```cs
// Program.cs
builder.Services.AddIdentityServer()
    .AddServerSideSessions()
    .AddOperationalStore(options =>
    {
       // ...
    });
```
