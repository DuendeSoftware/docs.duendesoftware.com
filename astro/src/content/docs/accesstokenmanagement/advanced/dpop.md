---
title: Demonstrating Proof-of-Possession (DPoP)
description: Demonstrating Proof-of-Possession is a security mechanism that binds access tokens to specific cryptographic keys to prevent token theft and misuse.
sidebar:
  label: DPoP
  order: 40
redirect_from:
  - /foss/accesstokenmanagement/advanced/dpop/
---

[DPoP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-dpop) specifies how to bind an asymmetric key stored within a JSON Web Key (JWK) to an access token. 
This will make the access token bound to the key such that if the access token were to leak, it cannot be used without also having access to the private key of the corresponding JWK.

The Duende.AccessTokenManagement library supports DPoP.

## DPoP Key

The main piece that your hosting application needs to concern itself with is how to get (and manage) the DPoP key. This key (and signing algorithm) will be either an "RS", "PS", or "ES" style key, and needs to be in the form of a JSON Web Key (or JWK). Consult the specification for more details.

The creation and management of this DPoP key is up to the policy of the client. For example is can be dynamically created when the client starts up, and can be periodically rotated. The main constraint is that it must be stored for as long as the client uses any access tokens (and possibly refresh tokens) that they are bound to, which this library will manage for you.

Creating a JWK in .NET is simple:

```csharp
// Program.cs
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

var rsaKey = new RsaSecurityKey(RSA.Create(2048));
var jwkKey = JsonWebKeyConverter.ConvertFromSecurityKey(rsaKey);
jwkKey.Alg = "PS256";
var jwk = JsonSerializer.Serialize(jwkKey);

Console.WriteLine(jwk);
```

## Key Configuration

Once you have a JWK you wish to use, then it must be configured or made available to this library. That can be done in one of two ways: 

* Configure the key at startup by setting the `DPoPJsonWebKey` property on either the `ClientCredentialsTokenManagementOptions` or `UserTokenManagementOptions` (depending on which of the two styles you are using from this library).
* Implement the `IDPoPKeyStore` interface to produce the key at runtime.

Here's a sample configuring the key in an application using `AddOpenIdConnectAccessTokenManagement` in the startup code:

```csharp
// Program.cs
services.AddOpenIdConnectAccessTokenManagement(options =>
{
    options.DPoPJsonWebKey = jwk;
});
```

Similarly, for an application using `AddClientCredentialsTokenManagement`, it would look like this:

```csharp
// Program.cs
services.AddClientCredentialsTokenManagement()
   .AddClient("client_name", options =>
   {
       options.DPoPJsonWebKey = jwk;
   });
```

## Proof Tokens At The Token Server's Token Endpoint

Once the key has been configured for the client, then the library will use it to produce a DPoP proof token when calling the token server (including token renewals if relevant).
There is nothing explicit needed on behalf of the developer using this library.

### `dpop_jkt` At The Token Server's Authorize Endpoint

When using DPoP and `AddOpenIdConnectAccessTokenManagement`, this library will also automatically include the `dpop_jkt` parameter to the authorize endpoint.

## Proof Tokens At The API

Once the library has gotten a DPoP bound access token for the client, then if your application is using any of the `HttpClient` client factory helpers (e.g. `AddClientCredentialsHttpClient` or `AddUserAccessTokenHttpClient`) then those outbound HTTP requests will automatically include a DPoP proof token for the associated DPoP access token.

## Combining DPoP With Custom OpenID Connect Events

To support DPoP with `AddOpenIdConnectAccessTokenManagement`, the library registers an `IConfigureNamedOptions<OpenIdConnectOptions>`
that hooks into the event handlers of the OpenID Connect authentication handler:

| Event                          | Purpose                                                                                           |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `OnRedirectToIdentityProvider` | Adds the `dpop_jkt` parameter and stores the DPoP key in the authentication properties            |
| `OnAuthorizationCodeReceived`  | Makes the DPoP key available for the code exchange, and adds the client assertion (if configured) |
| `OnTokenValidated`             | Reserved for DPoP key handling                                                                    |
| `OnPushAuthorization`          | Adds the client assertion to the pushed authorization request (.NET 9+)                           |

The library wraps any handler that is already configured: your handler is invoked first, followed by the library's logic.
Your own event handlers, for example to use [client assertions](/accesstokenmanagement/advanced/client-assertions.mdx)
(`private_key_jwt`) or signed authorization requests (JAR), keep working as long as they don't remove the library's handlers:

* **Wrap existing handlers instead of replacing them.** If you assign an event handler (or a new `OpenIdConnectEvents` instance)
  after the library has configured its handlers, for example from an `IPostConfigureOptions<OpenIdConnectOptions>`, the DPoP
  handlers are discarded. Capture the existing handler and invoke it from yours.
* **Don't use `OpenIdConnectOptions.EventsType`.** When `EventsType` is set, ASP.NET Core resolves that type at runtime and
  uses it *instead of* `OpenIdConnectOptions.Events`, which silently removes all handlers registered by the library. Assign
  delegates to `options.Events` instead.

When these handlers are removed, sign-in still succeeds, but the `dpop_jkt` parameter is no longer sent and the authorization
code is not exchanged using the DPoP key.

### Example: Client Assertions And JAR

The following example signs the authorization request (JAR) and, when using pushed authorization requests (PAR), wraps the
event handlers registered by Duende.AccessTokenManagement. Because it is registered as an `IPostConfigureOptions`, it runs
after the library's configuration, so the ordering of the wrapped handlers can be controlled explicitly:

```csharp
// ConfigureJar.cs
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

public class ConfigureJar(IRequestObjectSigner signer) : IPostConfigureOptions<OpenIdConnectOptions>
{
    public void PostConfigure(string? name, OpenIdConnectOptions options)
    {
        if (name != "oidc") return;

        // Without PAR: let the library add dpop_jkt first, then sign all parameters
        var redirect = options.Events.OnRedirectToIdentityProvider;
        options.Events.OnRedirectToIdentityProvider = async context =>
        {
            await redirect(context);

            if (options.PushedAuthorizationBehavior != PushedAuthorizationBehavior.Disable)
            {
                // parameters are signed in OnPushAuthorization instead
                return;
            }

            SignRequest(context.ProtocolMessage, keepRedirectUri: true);
        };

        // With PAR (.NET 9+): sign all parameters (including dpop_jkt) first,
        // then let the library add the client assertion
        var push = options.Events.OnPushAuthorization;
        options.Events.OnPushAuthorization = async context =>
        {
            SignRequest(context.ProtocolMessage, keepRedirectUri: false);

            await push(context);
        };
    }

    private void SignRequest(OpenIdConnectMessage message, bool keepRedirectUri)
    {
        var request = signer.Sign(message); // creates a signed JWT containing all parameters
        var clientId = message.ClientId;
        var redirectUri = message.RedirectUri;

        message.Parameters.Clear();
        message.ClientId = clientId;
        if (keepRedirectUri)
        {
            message.RedirectUri = redirectUri;
        }
        message.SetParameter("request", request);
    }
}
```

Register `ConfigureJar` together with access token management and your `IClientAssertionService`:

```csharp
// Program.cs
builder.Services.AddOpenIdConnectAccessTokenManagement(options =>
{
    options.DPoPJsonWebKey = jwk;
});
builder.Services.AddTransient<IClientAssertionService, ClientAssertionService>();
builder.Services.ConfigureOptions<ConfigureJar>();
```

The client assertions for the code exchange and pushed authorization request are added by the library using your
`IClientAssertionService`. See [Client Assertions](/accesstokenmanagement/advanced/client-assertions.mdx#client-assertions-with-openid-connect).

## Considerations

A point to keep in mind when using DPoP and `AddOpenIdConnectAccessTokenManagement` is that the DPoP proof key is created per user session. 
This proof key must be store somewhere, and the `AuthenticationProperties` used by both the OIDC and cookie handlers is what is used to store this key.
This implies that the OIDC `state` parameter will increase in size, as well the resultant cookie that represents the user's session.
The storage for each of these can be customized with the properties on the options `StateDataFormat` and `SessionStore` respectively.
