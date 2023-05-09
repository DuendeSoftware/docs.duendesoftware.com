---
title: "Store"
weight: 30
---

## IClientConfigurationStore

The *IClientConfigurationStore* interface defines the contract for a service
that communication with the client configuration data store. It contains a
single *AddAsync* method.

```csharp
public interface IClientConfigurationStore
```

#### Members

| name | description |
| --- | --- |
| AddAsync(…) | Adds a client to the configuration store. |

## ClientConfigurationStore

The *ClientConfigurationStore* is the default implementation of the *IClientConfigurationStore*. It uses Entity Framework to communicate with the client configuration store, and is intended to be used when IdentityServer is configured to use the Entity Framework based configuration stores. 