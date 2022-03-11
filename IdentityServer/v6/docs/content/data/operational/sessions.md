---
title: "Server-Side Sessions"
weight: 50
---

(added in 6.1)

The [server-side sessions]({{<ref "/ui/server_side_sessions">}}) feature in Duende IdentityServer requires a store to persist a user's session data.

## Server-Side Session Store

xoxo


By default, the file system is used, but the storage of these keys is abstracted behind a extensible store interface.
The [IServerSideSessionStore]({{<ref "/reference/stores/signing_key_store">}}) is that storage interface. 

## Registering a custom signing key store

To register a custom signing key store in the DI container, there is a *AddSigningKeyStore* helper on the *IIdentityServerBuilder*. 
For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
        .AddSigningKeyStore<YourCustomStore>();
}
```

## Key Lifecycle
When keys are required, *LoadKeysAsync* will be called to load them all from the store. 
They are then cached automatically for some amount of time based on [configuration]({{<ref "/reference/options#key-management">}}).
Periodically a new key will be created, and *StoreKeyAsync* will be used to persist the new key.
Once a key is past its retirement, *DeleteKeyAsync* will be used to purge the key from the store.

## Serialized Key
The [SerializedKey]({{<ref "/reference/stores/signing_key_store#serializedkey">}}) is the model that contains the key data to persist. 

It is expected that the *Id* is the unique identifier for the key in the store. The *Data* property is the main payload of the key and contains a copy of all the other values. Some of the properties affect how the *Data* is processed (e.g. *DataProtected*), and the other properties are considered read-only and thus can't be changed to affect the behavior (e.g. changing the *Created* value will not affect the key lifetime, nor will changing *Algorithm* change which signing algorithm the key is used for).

