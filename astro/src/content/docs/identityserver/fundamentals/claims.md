---
title: "Controlling Claims In IdentityServer Tokens"
description: "How IdentityServer selects, filters, and serializes user and client claims for identity tokens, access tokens, and the userinfo endpoint."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Claims
  order: 45
redirect_from:
  - /identityserver/v5/fundamentals/claims/
  - /identityserver/v6/fundamentals/claims/
  - /identityserver/v7/fundamentals/claims/
---

IdentityServer emits claims about users and clients into tokens. You are in full control of which claims you want to
emit, in which situations you want to emit those claims, and where to retrieve those claims from.

## User Claims

User claims can be emitted in both identity and access tokens and in
the [userinfo endpoint](/identityserver/reference/v8/endpoints/userinfo.md). The central extensibility point to implement
to emit claims is called the [profile service](/identityserver/reference/v8/services/profile-service.md). The profile
service is responsible for both gathering claim data and deciding which claims should be emitted.

Whenever IdentityServer needs the claims for a user, it invokes the registered profile service with
a [context](/identityserver/reference/v8/services/profile-service.md#duendeidentityservermodelsprofiledatarequestcontext)
that presents detailed information about the current request, including

* the client that is making the request
* the identity of the user
* the type of the request (access token, id token, or userinfo)
* the requested claim types, which are the claims types associated with requested scopes and resources

### Strategies For Emitting Claims

You can use different strategies to determine which claims to emit based on the information in the profile context.

* emit claims based on the requested claim types
* emit claims based on user or client identity
* always emit certain claims

#### Emit Claims Based On The Client's Request

You can filter the claims you emit to only include the claim types requested by the client. If your client requires
consent, this will also give end users the opportunity to approve or deny sharing those claims with the client.

Clients can request claims in several ways:

- Requesting an [IdentityResource](/identityserver/fundamentals/resources/identity.md) by including the scope parameter
  for the `IdentityResource` requests the claims associated with the `IdentityResource` in its `UserClaims` collection.
- Requesting an [ApiScope](/identityserver/fundamentals/resources/api-scopes.md) by including the scope parameter for
  the `ApiScope` requests the claims associated with the `ApiScope` in its `UserClaims` collection.
- Requesting an [ApiResource](/identityserver/fundamentals/resources/api-resources.md) by including the resource
  indicator parameter for the `ApiResource` requests the claims associated with the `ApiResource` in its `UserClaims`
  collection.

The `RequestedClaimTypes` property of the `ProfileDataRequestContext` contains the collection of claims requested by the
client.

If your profile service extends the `DefaultProfileService`, you can use its `AddRequestedClaims` method to add only
requested and approved claims. The intent is that your profile service can retrieve claim data and then filter that
claim data based on what was requested by the client. For example:

```csharp
// SampleProfileService.cs
public class SampleProfileService : DefaultProfileService
{
    public virtual async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var claims = await GetClaimsAsync(context);
        
        context.AddRequestedClaims(claims);
    }


    private async Task<List<Claim>> GetClaimsAsync(ProfileDataRequestContext context)
    {
        // Your implementation that retrieves claims goes here
    }
}
```

#### Why Is A User Claim Missing From The Token?

A claim on `HttpContext.User` or `ProfileDataRequestContext.Subject` is not automatically included in a token.
`AddRequestedClaims` compares each claim type with `ProfileDataRequestContext.RequestedClaimTypes` and drops claims that
were not requested. The default profile service uses this filtering behavior too.

IdentityServer builds the requested claim types from the resources in the authorization request:

1. The client requests a scope or resource.
2. IdentityServer resolves the matching resources. Identity resources supply claims for identity tokens and the `userinfo` endpoint;
   API scopes and API resources supply claims for access tokens.
3. The relevant `UserClaims` collections become `RequestedClaimTypes`.
4. `AddRequestedClaims` adds only matching claims to `IssuedClaims`.

For example, adding a `department` claim to the signed-in user is not enough. The IdentityServer host must define a
resource containing that claim, allow the client to request it, and receive the matching scope in the authorization
request:

```csharp
// Config.cs in the IdentityServer host
public static IEnumerable<IdentityResource> IdentityResources =>
[
    new IdentityResources.OpenId(),
    new IdentityResource(
        name: "department_info",
        userClaims: ["department"],
        displayName: "Your department")
];

public static Client Client => new()
{
    ClientId = "web",
    // ... other client settings
    AllowedScopes = { "openid", "department_info" }
};
```

The client must request `department_info`. The profile service will then see `department` in `RequestedClaimTypes`, and
`AddRequestedClaims` can include it in the appropriate token or `userinfo` endpoint's response.

:::note
When an authorization request produces both an identity token and an access token, IdentityServer keeps the identity
token small by default and makes most identity claims available from the
[`userinfo` endpoint](/identityserver/reference/v8/endpoints/userinfo.md). If a claim is configured correctly but is not in
the identity token, check the `userinfo` endpoint before changing the profile service. See the
[Claims Lifecycle](/identityserver/fundamentals/claims-lifecycle.mdx) page for the full flow.
:::

If a claim is still missing, enable debug logging for `Duende.IdentityServer`. The default profile service logs the
requested claim types and the claim types it issued. Before bypassing `AddRequestedClaims`, check the resource's
`UserClaims`, the client's `AllowedScopes`, and the scopes in the request.

Adding a claim directly to `IssuedClaims` bypasses this filter. Do that only when the claim must be sent regardless of
the requested scopes, and make sure it does not expose data to a client that should not receive it.

#### Always Emit Claims

We generally recommend emitting claims based on the requested claim types, as that respects the scopes and resources
requested by the client and gives the end user an opportunity to consent to this sharing of information. However, if you
have claims that don't need to follow such rules, such as claims that are an integral part of the user's identity and
that are needed in most scenarios, they can be added by directly updating the `context.IssuedClaims` collection. For
example:

```csharp
// SampleProfileService.cs
public class SampleProfileService : DefaultProfileService
{
    public virtual async Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var claims = await GetClaimsAsync(context);
        context.IssuedClaims.AddRange(claims);
    }


    private async Task<Claim> GetClaimsAsync(ProfileDataRequestContext context)
    {
        // Your implementation that retrieves claims goes here
    }
}
```

#### Emit Claims Based On The User Or Client Identity

Finally, you might have claims that are only appropriate for certain users or clients. Your `ProfileService` can add
whatever filtering or logic that you like.

### The Subject Of The ProfileDataRequestContext

When the profile service is invoked to add claims to tokens, the `Subject` property on the `ProfileDataRequestContext`
contains the principal that was issued during user sign-in. Typically, the profile service will source some claims from
the `Subject` and others from databases or other data sources.

When the profile service is called for requests to
the [userinfo endpoint](/identityserver/reference/v8/endpoints/userinfo.md), the `Subject` property will not contain the
principal issued during user sign-in, since userinfo calls don't happen as part of a session. Instead, the `Subject`
property will contain a claims principal populated with the claims in the access token used to authorize the userinfo
call. You can check the caller of the profile service by querying the `Caller` property on the context.

## Client Claims

Client claims are a set of pre-defined claims that are emitted in access tokens. They are defined on a per-client basis,
meaning that each client can have its own unique set of client claims. The following shows an example of a client that
is associated with a certain customer in your system:

```csharp
// Config.cs in the IdentityServer host
var client = new Client
{
    ClientId = "client",

    // rest omitted

    Claims =
    {
        new ClientClaim("customer_id", "123")
    }
};
```

To avoid accidental collision with user claims, client claims are prefixed with `client_`. For example, the above
`ClientClaim` would be emitted as the `client_customer_id` claim type in access tokens. You can change or remove this
prefix by setting the `ClientClaimsPrefix` on the [client definition](/identityserver/reference/v8/models/client.md#token).

:::note
By default, client claims are only sent in the client credentials flow. If you want to enable them for other flows, you
need to set the `AlwaysSendClientClaims` property on the client definition.
:::

### Setting Client Claims Dynamically

If you want to set client claims dynamically, you could either do that at client load time (via a
client [store](/identityserver/data) implementation), or using
a [custom token request validator](/identityserver/tokens/dynamic-validation.md).

## Claim Serialization

Claim values are serialized based on the `ClaimValueType` of the claim. Claims that don't specify a `ClaimValueType` are
serialized as strings. Claims that specify a `ClaimValueType` of `System.Security.Claims.ClaimValueTypes.Integer`,
`System.Security.Claims.ClaimValueTypes.Integer32`, `System.Security.Claims.ClaimValueTypes.Integer64`,
`System.Security.Claims.ClaimValueTypes.Double`, or `System.Security.Claims.ClaimValueTypes.Boolean` are parsed as the
corresponding type, while those that specify `IdentityServerConstants.ClaimValueTypes.Json` are serialized to JSON using
`System.Text.Json`.
