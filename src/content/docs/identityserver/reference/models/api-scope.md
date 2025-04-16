---
title: "API Scope"
description: "Reference documentation for the ApiScope class which models an OAuth scope in Duende IdentityServer, including its properties and configuration options."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 25
redirect_from:
  - /identityserver/v5/reference/models/api_scope/
  - /identityserver/v6/reference/models/api_scope/
  - /identityserver/v7/reference/models/api_scope/
---

## Duende.IdentityServer.Models.ApiScope

This class models an OAuth scope.

* **`Enabled`**

  Indicates if this resource is enabled and can be requested. Defaults to true.

* **`Name`**

  The unique name of the API. This value is used for authentication with introspection and will be added to the audience
  of the outgoing access token.

* **`DisplayName`**

  This value can be used e.g. on the consent screen.

* **`Description`**

  This value can be used e.g. on the consent screen.

* **`UserClaims`**

  List of associated user claim types that should be included in the access token.

## Defining API Scope In appsettings.json

The `AddInMemoryApiResource` extension method also supports adding clients from the ASP.NET Core configuration file:

```json
{
  "IdentityServer": {
    "IssuerUri": "urn:sso.company.com",
    "ApiScopes": [
      {
        "Name": "IdentityServerApi"
      },
      {
        "Name": "resource1.scope1"
      },
      {
        "Name": "resource2.scope1"
      },
      {
        "Name": "scope3"
      },
      {
        "Name": "shared.scope"
      },
      {
        "Name": "transaction",
        "DisplayName": "Transaction",
        "Description": "A transaction"
      }
    ]
  }
}
```

Then pass the configuration section to the `AddInMemoryApiScopes` method:

```cs
// Program.cs
idsvrBuilder.AddInMemoryApiScopes(configuration.GetSection("IdentityServer:ApiScopes"))
```
