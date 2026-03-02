---
title: "Identity Resources"
description: Learn about identity resources in Duende IdentityServer - named groups of claims about users that can be requested using scopes
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 10
redirect_from:
  - /identityserver/v5/fundamentals/resources/identity/
  - /identityserver/v6/fundamentals/resources/identity/
  - /identityserver/v7/fundamentals/resources/identity/
---

An identity resource is a named group of claims about a user that can be requested using the `scope` parameter.

The OpenID Connect specification [suggests](https://openid.net/specs/openid-connect-core-1_0.html#scopeclaims) a couple of standard 
scope name to claim type mappings that might be useful to you for inspiration, but you can freely design them yourself.

One of them is actually mandatory, the `openid` scope, which tells the provider to return the `sub` (subject id) claim in the identity token.

This is how you could define the openid scope in code:

```csharp
public static IEnumerable<IdentityResource> GetIdentityResources()
{
    return new List<IdentityResource>
    {
        new IdentityResource(
            name: "openid",
            userClaims: new[] { "sub" },
            displayName: "Your user identifier")
    };
}
```

But since this is one of the standard scopes from the spec you can shorten that to:

```csharp
public static IEnumerable<IdentityResource> GetIdentityResources()
{
    return new List<IdentityResource>
    {
        new IdentityResources.OpenId()
    };
}
```
:::note
See the [reference](/identityserver/reference/models/identity-resource.md) section for more information on `IdentityResource`.
:::

The following example shows a custom identity resource called `profile` that represents the display name, email address and website claim:

```csharp
public static IEnumerable<IdentityResource> GetIdentityResources()
{
    return new List<IdentityResource>
    {
        new IdentityResource(
            name: "profile",
            userClaims: new[] { "name", "email", "website" },
            displayName: "Your profile data")
    };
}
```

Once the resource is defined, you can give access to it to a client via the `AllowedScopes` option (other properties omitted):

```csharp
var client = new Client
{
    ClientId = "client",
    
    AllowedScopes = { "openid", "profile" }
};
```

:::note
See the [reference](/identityserver/reference/models/client.md) section for more information on the `Client` class.
:::

The client can then request the resource using the scope parameter (other parameters omitted):

    https://demo.duendesoftware.com/connect/authorize?client_id=client&scope=openid profile

IdentityServer will then use the scope names to create a list of requested claim types, 
and present that to your implementation of the [profile service](/identityserver/reference/services/profile-service.md).