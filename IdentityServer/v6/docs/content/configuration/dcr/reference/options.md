---
title: "Options"
weight: 60
---

## IdentityServerConfigurationOptions

Top level options for IdentityServer.Configuration.

```
public class IdentityServerConfigurationOptions
```

#### Public Members

| name | description |
| --- | --- |
| [DynamicClientRegistration](#DynamicClientRegistrationOptions) { get; set; } | Options for Dynamic Client Registration |

## DynamicClientRegistrationOptions

Options for dynamic client registration.

```
public class DynamicClientRegistrationOptions
```

#### Public Members

| name | description |
| --- | --- |
| SecretLifetime { get; set; } | Gets or sets the lifetime of secrets generated for clients. If unset, generated secrets will have no expiration. Defaults to null (secrets never expire). |
