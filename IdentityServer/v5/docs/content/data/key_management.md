---
title: "Key Management Store"
date: 2020-11-30T00:00:00+00:00
weight: 50
---

The automatic key management feature in Duende IdentityServer requires a store to persist keys that are dynamically created.
By default, the file system is used, but the storage of these keys is abstracted behind an extensibility point.
This page describes the extensibility point that models the key management store, and is useful if you wish to implement your own storage.

{{% notice note %}}
If you are using the Entity Framework Integration package, then an implementation of the key management store is already provided.
{{% /notice %}}

## Signing Key Store
The *Duende.IdentityServer.Stores.ISigningKeyStore* models the storage of keys used in automatic key management. Its methods include:

* ***LoadKeysAsync***
    
    Returns all the keys in storage as *IEnumerable< SerializedKey >*. 

* ***StoreKeyAsync***

    Persists new key in storage via a *SerializedKey* parameter.

* ***DeleteKeyAsync*** 

    Deletes key from storage based on a *string* identifier parameter.

### Key Lifecycle
When keys are required, *LoadKeysAsync* will be called to load them all from the store. They are then usually cached for some amount of time.
Periodically a new key will be created, and *StoreKeyAsync* will be used to persist the new key.
Once a key is past its retirement, *DeleteKeyAsync* will be used to purge the key from the store.

### Serialized Key
The *SerializedKey* is the model that contains the key data to persist. Its properties include:

* ***Id*** (string)

    Key identifier.

* ***Version*** (int)

    Version number of seralized key.

* ***Created*** (DateTime)

    Date key was created.

* ***Algorithm*** (string)

    The algorithm.

* ***IsX509Certificate*** (bool)

    Contains X509 certificate.

* ***Data*** (string)

    Serialized data for key.

* ***DataProtected*** (bool)

    Indicates if data is protected.

It is expected that the *Id* is the unique identifier for the key in the store. The *Data* property is the main payload of the key and contains a copy of all the other values. Some of the properties affect how the *Data* is processed (e.g. *DataProtected*), and the other properties are considered read-only and thus can't be changed to affect the behavior (e.g. changing the *Created* value will not affect the key lifetime, nor will changing *Algorithm* change which signing algorithm the key is used for).

### Registering a custom signing key store

To register a custom signing key store in the DI container, there is a *AddSigningKeyStore* helper on the *IIdentityServerBuilder*. 
For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer()
        .AddSigningKeyStore<YourCustomStore>();
}
```
