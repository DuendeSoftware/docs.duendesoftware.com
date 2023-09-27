---
title: "API Resources"
description: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

When the API/resource surface gets larger, a flat list of scopes might become hard to  manage.

In Duende IdentityServer, the *ApiResource* class allows for some additional organization as well as grouping and isolation of scopes as well as providing some common settings.

Let's use the following scope definition as an example:

```cs
public static IEnumerable<ApiScope> GetApiScopes()
{
    return new List<ApiScope>
    {
        // invoice API specific scopes
        new ApiScope(name: "invoice.read",   displayName: "Reads your invoices."),
        new ApiScope(name: "invoice.pay",    displayName: "Pays your invoices."),

        // customer API specific scopes
        new ApiScope(name: "customer.read",    displayName: "Reads you customers information."),
        new ApiScope(name: "customer.contact", displayName: "Allows contacting one of your customers."),

        // shared scopes
        new ApiScope(name: "manage",    displayName: "Provides administrative access.")
        new ApiScope(name: "enumerate", displayName: "Allows enumerating data.")
    };
}
```

With *ApiResource* you can now create two logical APIs and their corresponding scopes:

```cs
public static readonly IEnumerable<ApiResource> GetApiResources()
{ 
    return new List<ApiResource>
    {
        new ApiResource("invoice", "Invoice API")
        {
            Scopes = { "invoice.read", "invoice.pay", "manage", "enumerate" }
        },
        
        new ApiResource("customer", "Customer API")
        {
            Scopes = { "customer.read", "customer.contact", "manage", "enumerate" }
        }
    };
}
```

Using the API resource grouping gives you the following additional features

* support for the JWT *aud* claim. The value(s) of the audience claim will be the name of the API resource(s)
* support for adding common user claims across all contained scopes
* support for introspection by assigning an API secret to the resource
* support for configuring the access token signing algorithm for the resource

Let's have a look at some example access tokens for the above resource configuration.

Client requests: **invoice.read** and **invoice.pay**:

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": "invoice",
        "scope": "invoice.read invoice.pay"
    }
```

Client requests: **invoice.read** and **customer.read**:

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": [ "invoice", "customer" ],
        "scope": "invoice.read customer.read"
    }
```

Client requests: **manage**:

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": [ "invoice", "customer" ],
        "scope": "manage"
    }
```

### Adding user claims
You can specify that an access token for an API resource (regardless of which scope is requested) should contain additional user claims. 

```cs
var customerResource = new ApiResource("customer", "Customer API")
    {
        Scopes = { "customer.read", "customer.contact", "manage", "enumerate" },
        
        // additional claims to put into access token
        UserClaims =
        {
            "department_id",
            "sales_region"
        }
    }
```

If a client now requested a scope belonging to the *customer* resource, the access token would contain the additional claims (if provided by your [profile service]({{< ref "/reference/services/profile_service" >}})).

```json
    {
        "typ": "at+jwt"
    }.
    {
        "client_id": "client",
        "sub": "123",

        "aud": [ "invoice", "customer" ],
        "scope": "invoice.read customer.read",

        "department_id": 5,
        "sales_region": "south"
    }
```

### Setting a signing algorithm
Your APIs might have certain requirements for the cryptographic algorithm used to sign the access tokens for that resource.
An example could be regulatory requirements, or that you are starting to migrate your system to higher security algorithms.

The following sample sets *PS256* as the required signing algorithm for the *invoices* API:

```cs
var invoiceApi = new ApiResource("invoice", "Invoice API")
    {
        Scopes = { "invoice.read", "invoice.pay", "manage", "enumerate" },

        AllowedAccessTokenSigningAlgorithms = { SecurityAlgorithms.RsaSsaPssSha256 }
    }
```

{{% notice note %}}
Make sure that you have configured your IdentityServer for the required signing algorithm. See [here]({{< ref "../keys" >}}) for more details.
{{% /notice %}}
