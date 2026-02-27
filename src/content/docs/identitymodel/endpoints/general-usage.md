---
title: General Usage
description: Overview of IdentityModel client libraries common design patterns and usage for OpenID Connect and OAuth 2.0 endpoint interactions.
sidebar:
  order: 1
  label: General
redirect_from:
  - /foss/identitymodel/endpoints/general_usage/
---


IdentityModel contains client libraries for many interactions with
endpoints defined in OpenID Connect and OAuth 2.0. All of these
libraries have a common design, let's examine the various layers using
the client for the token endpoint.

## Request and response objects


All protocol request are modeled as request objects and have a common
base class called `ProtocolRequest` which has properties to set the
endpoint address, client ID, client secret, client assertion, and the
details of how client secrets are transmitted (e.g. authorization header
vs POST body). `ProtocolRequest` derives from `HttpRequestMessage` and
thus also allows setting custom headers etc.

The following code snippet creates a request for a client credentials
grant type:

```csharp
var request = new ClientCredentialsTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",
    ClientId = "client",
    ClientSecret = "secret"
};
```

While in theory you could now call `Prepare` (which internally sets the
headers, body and address) and send the request via a plain
`HttpClient`, typically there are more parameters with special semantics
and encoding required. That's why we provide extension methods to do
the low level work.

Equally, a protocol response has a corresponding `ProtocolResponse`
implementation that parses the status codes and response content. The
following code snippet would parse the raw HTTP response from a token
endpoint and turn it into a `TokenResponse` object:

```csharp
var tokenResponse = await ProtocolResponse
    .FromHttpResponseAsync<TokenResponse>(httpResponse);
```

Again these steps are automated using the extension methods. So let's
have a look at an example next.

## Extension methods

For each protocol interaction, an extension method for
`HttpMessageInvoker` (that's the base class of `HttpClient`) exists.
The extension methods expect a request object and return a response
object.

It is your responsibility to set up and manage the lifetime of the
`HttpClient`, e.g. manually:

```csharp
var client = new HttpClient();

var response = await client.RequestClientCredentialsTokenAsync(
    new ClientCredentialsTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client",
        ClientSecret = "secret"
    });
```

You might want to use other techniques to obtain an `HttpClient`, e.g.
via the HTTP client factory:

```csharp
var client = HttpClientFactory.CreateClient("my_named_token_client");

var response = await client.RequestClientCredentialsTokenAsync(
    new ClientCredentialsTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client",
        ClientSecret = "secret"
    });
```

All other endpoint client follow the same design.

:::note
Some client libraries also include a stateful client object (e.g.
`TokenClient` and `IntrospectionClient`). See the corresponding section
to find out more.
:::

## Client Credential Style

:::note
We recommend only changing the Client Credential Style if you're experiencing
HTTP Basic authentication encoding issues.
:::


Any request type implementing `ProtocolRequest` has the ability to configure
the client credential style, which specifies how the client will transmit the client ID and secret.
`ClientCredentialStyle` options include `PostBody` and the default value of `AuthorizationHeader`.

```csharp
var client = HttpClientFactory.CreateClient("my_named_token_client");

var response = await client.RequestClientCredentialsTokenAsync(
    new ClientCredentialsTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client",
        ClientSecret = "secret",
        // set the client credential style
        ClientCredentialStyle = ClientCredentialStyle.AuthorizationHeader
    });
```

For interoperability between OAuth implementations, we allow you to choose either approach, depending on which
specification version you are targeting. When using IdentityServer, both header and body approaches
are supported and _"it just works"_.

[RFC 6749](https://datatracker.ietf.org/doc/rfc6749/), the original OAuth spec, says that support for the basic auth header is mandatory, 
and that the POST body is optional. OAuth 2.1 reverses this: now the body is mandatory and the header is optional.

In the previous OAuth specification version, the header caused bugs and interoperability problems. To follow
both RFC 6749 and RFC 2617 (which is where basic auth headers are specified), you have to form url encode the client id and client secret, 
concatenate them both with a colon in between, and then base64 encode the final value. To try to avoid that complex process,
OAuth 2.1 now prefers the POST body mechanism.


References:

- [RFC 6749](https://datatracker.ietf.org/doc/rfc6749/) section 2.3.1
- [RFC 2617 section 2](https://www.rfc-editor.org/rfc/rfc2617#section-2)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/)

Here is a complete list of `ProtocolRequest` implementors that expose the `ClientCredentialStyle` option:

- `Duende.IdentityModel.Client.AuthorizationCodeTokenRequest`
- `Duende.IdentityModel.Client.BackchannelAuthenticationRequest`
- `Duende.IdentityModel.Client.BackchannelAuthenticationTokenRequest`
- `Duende.IdentityModel.Client.ClientCredentialsTokenRequest`
- `Duende.IdentityModel.Client.DeviceAuthorizationRequest`
- `Duende.IdentityModel.Client.DeviceTokenRequest`
- `Duende.IdentityModel.Client.DiscoveryDocumentRequest`
- `Duende.IdentityModel.Client.DynamicClientRegistrationRequest`
- `Duende.IdentityModel.Client.JsonWebKeySetRequest`
- `Duende.IdentityModel.Client.PasswordTokenRequest`
- `Duende.IdentityModel.Client.PushedAuthorizationRequest`
- `Duende.IdentityModel.Client.RefreshTokenRequest`
- `Duende.IdentityModel.Client.TokenExchangeTokenRequest`
- `Duende.IdentityModel.Client.TokenIntrospectionRequest`
- `Duende.IdentityModel.Client.TokenRequest`
- `Duende.IdentityModel.Client.TokenRevocationRequest`
- `Duende.IdentityModel.Client.UserInfoRequest`