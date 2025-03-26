---
title: "Backchannel Authentication Endpoint"
weight: 9
---

The backchannel authentication endpoint is used by a client to initiate a [CIBA](/identityserver/v7/ui/ciba) request.

Clients must be configured with the *"urn:openid:params:grant-type:ciba"* grant type to use this endpoint.
You can use the *OidcConstants.GrantTypes.Ciba* constant rather than hard coding the value for the CIBA grant type.

### Required parameters

* ***scope***

    one or more registered scopes

:::note
The client id and a client credential is required to authenticate to the endpoint using any valid form of authentication that has been configured for it (much like the token endpoint).
:::

### Exactly one of these values is required

* ***login_hint***
    
    hint for the end user to be authenticated. the value used is implementation specific.

* ***id_token_hint***
    
    a previously issued id_token for the end user to be authenticated

* ***login_hint_token***
    
    a token containing information for the end user to be authenticated. the details are implementation specific.

:::note
To validate these implementation specific values and use them to identity the user that is to be authenticated, you are required to implement the *IBackchannelAuthenticationUserValidator* interface.
:::

### Optional parameters

* ***binding_message***

    identifier or message intended to be displayed on both the consumption device and the authentication device

* ***user_code***

    a secret code, such as a password or pin, that is known only to the user but verifiable by the OP

* ***requested_expiry***

    a positive integer allowing the client to request the expires_in value for the auth_req_id the server will return. if not present, then the optional *CibaLifetime* property on the *Client* is used, and if that is not present, then the *DefaultLifetime* on the *CibaOptions* will be used.

* ***acr_values***
    
    allows passing in additional authentication related information - IdentityServer special cases the following proprietary acr_values:
        
    * ***idp:name_of_idp*** 
        
        bypasses the login/home realm screen and forwards the user directly to the selected identity provider (if allowed per client configuration)
        
    * ***tenant:name_of_tenant*** 
        
        can be used to pass a tenant name to the login UI

* ***resource***

    resource indicator identifying the *ApiResource* for which the access token should be restricted to

* ***request***

    instead of providing all parameters as individual parameters, you can provide all of them as a JWT


```
POST /connect/ciba

    client_id=client1&
    client_secret=secret&
    scope=openid api1&
    login_hint=alice
```

And a successful response will look something like:

```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
    "auth_req_id": "1C266114A1BE42528AD104986C5B9AC1",
    "expires_in": 600,
    "interval": 5
}
```

## .NET client library
You can use the [IdentityModel](https://identitymodel.readthedocs.io) client library to programmatically interact with the protocol endpoint from .NET code.

```cs
using IdentityModel.Client;

var client = new HttpClient();

var cibaResponse = await client.RequestBackchannelAuthenticationAsync(new BackchannelAuthenticationRequest
{
    Address = "https://demo.duendesoftware.com/connect/ciba",
    ClientId = "client1",
    ClientSecret = "secret",
    Scope = "openid api1",
    LoginHint = "alice",
});
```

And with a successful response, it can be used to poll the token endpoint:

```cs
while (true)
{
    var response = await client.RequestBackchannelAuthenticationTokenAsync(new BackchannelAuthenticationTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client1",
        ClientSecret = "secret",
        AuthenticationRequestId = cibaResponse.AuthenticationRequestId
    });

    if (response.IsError)
    {
        if (response.Error == OidcConstants.TokenErrors.AuthorizationPending || response.Error == OidcConstants.TokenErrors.SlowDown)
        {
            await Task.Delay(cibaResponse.Interval.Value * 1000);
        }
        else
        {
            throw new Exception(response.Error);
        }
    }
    else
    {
        // success! use response.IdentityToken, response.AccessToken, and response.RefreshToken (if requested)
    }
}
```
