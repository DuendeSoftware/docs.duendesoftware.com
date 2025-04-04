---
title: "API Resource"
description: "Model Reference"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 30
---

#### Duende.IdentityServer.Models.ApiResource

This class models an API.

* **`Enabled`**

  Indicates if this resource is enabled and can be requested. Defaults to true.

* **`Name`**

  The unique name of the API. This value is used for authentication with introspection and will be added to the audience
  of the outgoing access token.

* **`DisplayName`**

  This value can be used e.g. on the consent screen.

* **`Description`**

  This value can be used e.g. on the consent screen.

* **`RequireResourceIndicator`**

  Indicates if this API resource requires the resource indicator to request it, and expects access tokens issued to it
  will only ever contain this API resource as the audience.

* **`ApiSecrets`**

  The API secret is used for the introspection endpoint. The API can authenticate with introspection using the API name
  and secret.

* **`AllowedAccessTokenSigningAlgorithms`**

  List of allowed signing algorithms for access token. If empty, will use the server default signing algorithm.

* **`UserClaims`**

  List of associated user claim types that should be included in the access token.

* **`Scopes`**

  List of API scope names. You need to create those using [ApiScope](api_scope).

## Defining API resources in appsettings.json

The `AddInMemoryApiResource` extensions method also supports adding API resources from the ASP.NET Core configuration
file:

    "IdentityServer": {
        "IssuerUri": "urn:sso.company.com",
        "ApiResources": [
            {
                "Name": "resource1",
                "DisplayName": "Resource #1",

                "Scopes": [
                    "resource1.scope1",
                    "shared.scope"
                ]
            },
            {
                "Name": "resource2",
                "DisplayName": "Resource #2",
                
                "UserClaims": [
                    "name",
                    "email"
                ],

                "Scopes": [
                    "resource2.scope1",
                    "shared.scope"
                ]
            }
        ]
    }

Then pass the configuration section to the `AddInMemoryApiResource` method:

```cs
idsvrBuilder.AddInMemoryApiResources(configuration.GetSection("IdentityServer:ApiResources"))
```
