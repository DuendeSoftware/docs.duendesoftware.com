---
title: "Claims"
date: 2020-09-10T08:22:12+02:00
weight: 45
---

IdentityServer emits claims about users and clients into tokens. You are in full control of which claims you want to emit, in which situations you want to emit those claims, and where to retrieve those claims from.

## User claims
User claims can be put in both identity and access tokens. The central extensibility point to implement for emitting claims is called the [profile service]({{< ref "/reference/services/profile_service" >}}).

Whenever IdentityServer creates tokens for a user, it invokes the registered profile service with a [context]({{< ref "/reference/services/profile_service#duendeidentityservermodelsprofiledatarequestcontext" >}}) that presents detailed information about the current token request, including

* the identity of the client who is requesting the token
* the identity of the user
* what type of token is requested
* the requested claim types according to the definition of the requested resources

You can use different strategies to determine which claims you want to emit based on that information

* always emit certain claims (because they are an integral part of the user identity and needed in scenarios)
* emit claims based on user or client identity
* emit claims based on the requested resources

{{% notice note %}}
Generally speaking, we recommend using the [resource definitions]({{< ref "/fundamentals/resources" >}}) to associate user claims with resources. In that case your profile service receives an aggregated list of requested claim types based on the requested resources. The implementation is then as simple as returning the corresponding claim values back to the runtime.
{{% /notice %}}

Here's a sample implementation of a profile service:

```cs
public class SampleProfileService : IProfileService
{
    // this method adds claims that should go into the token to context.IssuedClaims
    public virtual Task GetProfileDataAsync(ProfileDataRequestContext context)
    {
        var requestedClaimTypes = context.RequestedClaimTypes;
        var user = context.Subject;

        // your implementation to retrieve the requested information
        var claims = GetRequestedClaims(user, requestedClaimsTypes);
        context.IssuedClaims.AddRange(claims);

        return Task.CompletedTask;
    }

    // this method allows to check if the user is still "enabled" per token request
    public virtual Task IsActiveAsync(IsActiveContext context)
    {
        context.IsActive = true;
        return Task.CompletedTask;
    }
}
```

The *Subject* property on the *ProfileDataRequestContext* contains the principal that was issued during user sign-in. Typically, the profile service will source some claims from the *Subject* and others from databases or other data sources.

{{% notice note %}}
The profile service also gets called for requests to the [userinfo endpoint]({{< ref "/reference/endpoints/userinfo" >}}). In that case, the *Subject* property will not contain the principal issued during user sign-in, since userinfo calls don't happen as part of a session. Instead, the *Subject* property will contain a claims principal populated with the claims in the access token used to authorize the userinfo call. You can check the caller of the profile service by querying the *Caller* property on the context.
{{% /notice %}}

## Claim Serialization
Claim values are serialized based on the ClaimValueType of the claim. Claims that don't specify a ClaimValueType are simply serialized as strings. Claims that specify a ClaimValueType of *System.Security.Claims.ClaimValueTypes.Integer*, *System.Security.Claims.ClaimValueTypes.Integer32*, *System.Security.Claims.ClaimValueTypes.Integer64*, *System.Security.Claims.ClaimValueTypes.Double*, or *System.Security.Claims.ClaimValueTypes.Boolean* are parsed as the corresponding type, while those that specify *IdentityServerConstants.ClaimValueTypes.Json* are serialized to JSON using *System.Text.Json*.

## Client claims
Client claims are typically statically defined claims that get emitted into access tokens. The following shows an example of a client that is associated with a certain customer in your system:

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

All client claims will be by default prefixed with *client* to avoid accidental collision with user claims, e.g. the above claim would show up as *client_customer_id* in access tokens. You can change (or remove) that prefix by setting the *ClientClaimsPrefix* on the [client definition]({{< ref "/reference/models/client#token" >}}). 

{{% notice note %}}
By default, client claims are only sent in the client credentials flow. If you want to enable them for other flows, you need to set the *AlwaysSendClientClaims* property on the client definition.
{{% /notice %}}

### Setting client claims dynamically
If you want to set client claims dynamically, you could either do that at client load time (via a client [store]({{< ref "/data" >}}) implementation), or using a [custom token request validator]({{< ref "/tokens/dynamic_validation" >}}).
