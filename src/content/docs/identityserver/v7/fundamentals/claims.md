---
title: "Claims"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 45
---

IdentityServer emits claims about users and clients into tokens. You are in full control of which claims you want to
emit, in which situations you want to emit those claims, and where to retrieve those claims from.

## User claims

User claims can be emitted in both identity and access tokens and in
the [userinfo endpoint](/identityserver/v7/reference/endpoints/userinfo). The central extensibility point to implement
to emit claims is called the [profile service](/identityserver/v7/reference/services/profile_service). The profile
service is responsible for both gathering claim data and deciding which claims should be emitted.

Whenever IdentityServer needs the claims for a user, it invokes the registered profile service with
a [context](/identityserver/v7/reference/services/profile_service#duendeidentityservermodelsprofiledatarequestcontext)
that presents detailed information about the current request, including

* the client that is making the request
* the identity of the user
* the type of the request (access token, id token, or userinfo)
* the requested claim types, which are the claims types associated with requested scopes and resources

### Strategies for Emitting Claims

You can use different strategies to determine which claims to emit based on the information in the profile context.

* emit claims based on the requested claim types
* emit claims based on user or client identity
* always emit certain claims

#### Emit claims based on the client's request

You can filter the claims you emit to only include the claim types requested by the client. If your client requires
consent, this will also give end users the opportunity to approve or deny sharing those claims with the client.

Clients can request claims in several ways:

- Requesting an [IdentityResource](/identityserver/v7/fundamentals/resources/identity) by including the scope parameter
  for the `IdentityResource` requests the claims associated with the `IdentityResource` in its `UserClaims` collection.
- Requesting an [ApiScope](/identityserver/v7/fundamentals/resources/api_scopes) by including the scope parameter for
  the `ApiScope` requests the claims associated with the `ApiScope` in its `UserClaims` collection.
- Requesting an [ApiResource](/identityserver/v7/fundamentals/resources/api_resources) by including the resource
  indicator parameter for the `ApiResource` requests the claims associated with the `ApiResource` in its `UserClaims`
  collection.

The `RequestedClaimTypes` property of the `ProfileDataRequestContext` contains the collection of claims requested by the
client.

If your profile service extends the `DefaultProfileService`, you can use its `AddRequestedClaims` method to add only
requested and approved claims. The intent is that your profile service can retrieve claim data and then filter that
claim data based on what was requested by the client. For example:

```cs
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

#### Always emit claims

We generally recommend emitting claims based on the requested claim types, as that respects the scopes and resources
requested by the client and gives the end user an opportunity to consent to this sharing of information. However, if you
have claims that don't need to follow such rules, such as claims that are an integral part of the user's identity and
that are needed in most scenarios, they can be added by directly updating the `context.IssuedClaims` collection. For
example:

```cs
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

#### Emit claims based on the user or client identity

Finally, you might have claims that are only appropriate for certain users or clients. Your `ProfileService` can add
whatever filtering or logic that you like.

### The Subject of the ProfileDataRequestContext

When the profile service is invoked to add claims to tokens, the `Subject` property on the `ProfileDataRequestContext`
contains the principal that was issued during user sign-in. Typically, the profile service will source some claims from
the `Subject` and others from databases or other data sources.

When the profile service is called for requests to
the [userinfo endpoint](/identityserver/v7/reference/endpoints/userinfo), the `Subject` property will not contain the
principal issued during user sign-in, since userinfo calls don't happen as part of a session. Instead, the `Subject`
property will contain a claims principal populated with the claims in the access token used to authorize the userinfo
call. You can check the caller of the profile service by querying the `Caller` property on the context.

## Client claims

Client claims are a set of pre-defined claims that are emitted in access tokens. They are defined on a per-client basis,
meaning that each client can have its own unique set of client claims. The following shows an example of a client that
is associated with a certain customer in your system:

```cs
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
prefix by setting the `ClientClaimsPrefix` on the [client definition](/identityserver/v7/reference/models/client#token).

:::note
By default, client claims are only sent in the client credentials flow. If you want to enable them for other flows, you
need to set the `AlwaysSendClientClaims` property on the client definition.
:::

### Setting client claims dynamically

If you want to set client claims dynamically, you could either do that at client load time (via a
client [store](/identityserver/v7/data) implementation), or using
a [custom token request validator](/identityserver/v7/tokens/dynamic_validation).

## Claim Serialization

Claim values are serialized based on the `ClaimValueType` of the claim. Claims that don't specify a ClaimValueType are
simply serialized as strings. Claims that specify a ClaimValueType of `System.Security.Claims.ClaimValueTypes.Integer`,
`System.Security.Claims.ClaimValueTypes.Integer32`, `System.Security.Claims.ClaimValueTypes.Integer64`,
`System.Security.Claims.ClaimValueTypes.Double`, or `System.Security.Claims.ClaimValueTypes.Boolean` are parsed as the
corresponding type, while those that specify `IdentityServerConstants.ClaimValueTypes.Json` are serialized to JSON using
`System.Text.Json`.
