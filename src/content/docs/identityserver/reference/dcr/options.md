---
title: "Options"
description: "Reference documentation for the IdentityServer configuration options related to dynamic client registration and secret lifetimes."
sidebar:
  order: 60
redirect_from:
  - /identityserver/v5/configuration/dcr/reference/options/
  - /identityserver/v6/configuration/dcr/reference/options/
  - /identityserver/v7/configuration/dcr/reference/options/
---

The page describes the `IdentityServerConfigurationOptions` class, which provides top-level configuration options for
IdentityServer, including the `DynamicClientRegistrationOptions` class for managing dynamic client registration and
secret lifetimes.

## IdentityServerConfigurationOptions

Top level options for IdentityServer.Configuration.

```csharp
public class IdentityServerConfigurationOptions
```

### Public Members

| name                                                                         | description                             |
|------------------------------------------------------------------------------|-----------------------------------------|
| [DynamicClientRegistration](#dynamicclientregistrationoptions) { get; set; } | Options for Dynamic Client Registration |

## DynamicClientRegistrationOptions

Options for dynamic client registration.

```csharp
public class DynamicClientRegistrationOptions
```

### Public Members

| name                         | description                                                                                                                                               |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| SecretLifetime { get; set; } | Gets or sets the lifetime of secrets generated for clients. If unset, generated secrets will have no expiration. Defaults to null (secrets never expire). |
