---
title: "Options"
order: 60
---

## IdentityServerConfigurationOptions

Top level options for IdentityServer.Configuration.

```csharp
public class IdentityServerConfigurationOptions
```

#### Public Members

| name                                                                         | description                             |
|------------------------------------------------------------------------------|-----------------------------------------|
| [DynamicClientRegistration](#dynamicclientregistrationoptions) { get; set; } | Options for Dynamic Client Registration |

## DynamicClientRegistrationOptions

Options for dynamic client registration.

```csharp
public class DynamicClientRegistrationOptions
```

#### Public Members

| name                         | description                                                                                                                                               |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| SecretLifetime { get; set; } | Gets or sets the lifetime of secrets generated for clients. If unset, generated secrets will have no expiration. Defaults to null (secrets never expire). |
