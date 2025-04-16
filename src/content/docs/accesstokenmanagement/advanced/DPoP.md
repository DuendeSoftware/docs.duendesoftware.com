---
title: DPoP
description: DPoP (Demonstrating Proof-of-Possession) is a security mechanism that binds access tokens to specific cryptographic keys to prevent token theft and misuse.
sidebar:
  order: 40
redirect_from:
  - /foss/accesstokenmanagement/advanced/dpop/
---

[DPoP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-dpop) specifies how to bind an asymmetric key stored within a JSON Web Key (JWK) to an access token. This will make the access token bound to the key such that if the access token were to leak, it cannot be used without also having access to the private key of the corresponding JWK.

The "Duende.AccessTokenManagement" library supports DPoP.

## DPoP Key

The main piece that your hosting application needs to concern itself with is how to obtain (and manage) the DPoP key. This key (and signing algorithm) will be either an "RS", "PS", or "ES" style key, and needs to be in the form of a JSON Web Key (or JWK). Consult the specification for more details.

The creation and management of this DPoP key is up to the policy of the client. For example is can be dynamically created when the client starts up, and can be periodically rotated. The main constraint is that it must be stored for as long as the client uses any access tokens (and possibly refresh tokens) that they are bound to, which this library will manage for you.

Creating a JWK in .NET is simple:

```cs
var rsaKey = new RsaSecurityKey(RSA.Create(2048));
var jwkKey = JsonWebKeyConverter.ConvertFromSecurityKey(rsaKey);
jwkKey.Alg = "PS256";
var jwk = JsonSerializer.Serialize(jwkKey);
```

## Key Configuration

Once you have a JWK you wish to use, then it must be configured or made available to this library. That can be done in one of two ways: 

* Configure the key at startup by setting the `DPoPJsonWebKey` property on either the `ClientCredentialsTokenManagementOptions` or `UserTokenManagementOptions` (depending on which of the two styles you are using from this library).
* Implement the `IDPoPKeyStore` interface to produce the key at runtime.

Here's a sample configuring the key in an application using `AddOpenIdConnectAccessTokenManagement` in the startup code:

```cs
services.AddOpenIdConnectAccessTokenManagement(options =>
{
    options.DPoPJsonWebKey = jwk;
});
```

Similarly, for an application using `AddClientCredentialsTokenManagement`, it would look like this:

```cs
services.AddClientCredentialsTokenManagement()
   .AddClient("client_name", options =>
   {
       options.DPoPJsonWebKey = jwk;
   });
```

## Proof Tokens At The Token Server's Token Endpoint

Once the key has been configured for the client, then the library will use it to produce a DPoP proof token when calling the token server (including token renewals if relevant).
There is nothing explicit needed on behalf of the developer using this library.

### `dpop_jkt` At The token Server's Authorize Endpoint

When using DPoP and `AddOpenIdConnectAccessTokenManagement`, this library will also automatically include the `dpop_jkt` parameter to the authorize endpoint.

## Proof Tokens at the API

Once the library has obtained a DPoP bound access token for the client, then if your application is using any of the `HttpClient` client factory helpers (e.g. `AddClientCredentialsHttpClient` or `AddUserAccessTokenHttpClient`) then those outbound HTTP requests will automatically include a DPoP proof token for the associated DPoP access token.

## Considerations

A point to keep in mind when using DPoP and `AddOpenIdConnectAccessTokenManagement` is that the DPoP proof key is created per user session. 
This proof key must be store somewhere, and the `AuthenticationProperties` used by both the OIDC and cookie handlers is what is used to store this key.
This implies that the OIDC `state` parameter will increase in size, as well the resultant cookie that represents the user's session.
The storage of each of these can be customized with the properties on the options `StateDataFormat` and `SessionStore` respectively.
