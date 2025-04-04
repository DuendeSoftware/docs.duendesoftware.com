---
title: "Operational Options"
sidebar:
  order: 10
---

#### Duende.IdentityServer.EntityFramework.Options.OperationalStoreOptions

These options are configurable when using the Entity Framework Core for
the [operational store](/identityserver/v7/data/operational):

You set the options at startup time in your `AddOperationalStore` method:

```cs
builder.Services.AddIdentityServer()
    .AddOperationalStore(options =>
    {
        // configure options here..
    })
```

## Pooling

Settings that affect the DbContext pooling feature of Entity Framework Core.

* **`EnablePooling`**

  Gets or set if EF DbContext pooling is enabled. Defaults to `false`.


* **`PoolSize`**

  Gets or set the pool size to use when DbContext pooling is enabled. If not set, the EF default is used.

## Schema

Settings that affect the database schema and table names.

* **`DefaultSchema`**

  Gets or sets the default schema. Defaults to `null`.

`TableConfiguration` settings for each individual table (schema and name) managed by this feature:

* **`PersistedGrants`**
* **`DeviceFlowCodes`**
* **`Keys`**
* **`ServerSideSessions`**

## Persisted Grants Cleanup

Settings that affect the background cleanup of expired entries (tokens) from the persisted grants table.

* **`EnableTokenCleanup`**

  Gets or sets a value indicating whether stale entries will be automatically cleaned up from the database.
  This is implemented by periodically connecting to the database (according to the TokenCleanupInterval) from the
  hosting application.
  Defaults to `false`.

* **`RemoveConsumedTokens`**

  Gets or sets a value indicating whether consumed tokens will be included in the automatic clean up.
  Defaults to `false`.

* **`TokenCleanupInterval`**

  Gets or sets the token cleanup interval (in seconds). The default is `3600` (1 hour).

* **`TokenCleanupBatchSize`**

  Gets or sets the number of records to remove at a time. Defaults to `100`.

* **`FuzzTokenCleanupStart`**

  The background token cleanup job runs at a configured interval. If multiple nodes run the cleanup
  job at the same time there will be updated conflicts in the store. To avoid that, the startup time
  can be fuzzed. The first run is scheduled at a random time between the host startup and the configured
  TokenCleanupInterval. Subsequent runs are run on the configured TokenCleanupInterval. Defaults to `true`

