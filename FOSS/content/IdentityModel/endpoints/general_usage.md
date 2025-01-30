+++
title = "General Usage"
weight = 10
+++

IdentityModel contains client libraries for many interactions with
endpoints defined in OpenID Connect and OAuth 2.0. All of these
libraries have a common design, let\'s examine the various layers using
the client for the token endpoint.

Request and response objects
----------------------------

All protocol request are modelled as request objects and have a common
base class called *ProtocolRequest* which has properties to set the
endpoint address, client ID, client secret, client assertion, and the
details of how client secrets are transmitted (e.g. authorization header
vs POST body). *ProtocolRequest* derives from *HttpRequestMessage* and
thus also allows setting custom headers etc.

The following code snippet creates a request for a client credentials
grant type:

```cs
var request = new ClientCredentialsTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",
    ClientId = "client",
    ClientSecret = "secret"
};
```

While in theory you could now call *Prepare* (which internally sets the
headers, body and address) and send the request via a plain
*HttpClient*, typically there are more parameters with special semantics
and encoding required. That\'s why we provide extension methods to do
the low level work.

Equally, a protocol response has a corresponding *ProtocolResponse*
implementation that parses the status codes and response content. The
following code snippet would parse the raw HTTP response from a token
endpoint and turn it into a *TokenResponse* object:

```cs
var tokenResponse = await ProtocolResponse
    .FromHttpResponseAsync<TokenResponse>(httpResponse);
```

Again these steps are automated using the extension methods. So let\'s
have a look at an example next.

Extension methods
-----------------

For each protocol interaction, an extension method for
*HttpMessageInvoker* (that's the base class of *HttpClient*) exists.
The extension methods expect a request object and return a response
object.

It is your responsibility to setup and manage the lifetime of the
*HttpClient*, e.g. manually:

```cs
var client = new HttpClient();

var response = await client.RequestClientCredentialsTokenAsync(
    new ClientCredentialsTokenRequest
    {
        Address = "https://demo.duendesoftware.com/connect/token",
        ClientId = "client",
        ClientSecret = "secret"
    });
```

You might want to use other techniques to obtain an *HttpClient*, e.g.
via the HTTP client factory:

```cs
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

{{% notice note %}}
Some client libraries also include a stateful client object (e.g.
*TokenClient* and *IntrospectionClient*). See the corresponding section
to find out more.
{{% /notice %}}

Client Credential Style
------------------------

Any request type implementing *ProtocolRequest* has the ability to configure
the client credential style, which specifies how the client will transmit the client ID and secret.
*ClientCredentialStyle* options include *PostBody* and the default value of *AuthorizationHeader*.

```cs
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

While both options are functionally equivalent, both have their advantages and disadvantages.
Headers are more commonly used but using the *PostBody* option allows for larger payloads and avoiding potential
data loss due to intermediary parties such as proxies. Some proxies are known to strip and transform headers
that could cause requests to become malformed before reaching the target destination.

Here is a complete list of *ProtocolRequest* implementors that expose the *ClientCredentialStyle* option:

- *Duende.IdentityModel.Client.AuthorizationCodeTokenRequest*
- *Duende.IdentityModel.Client.BackchannelAuthenticationRequest*
- *Duende.IdentityModel.Client.BackchannelAuthenticationTokenRequest*
- *Duende.IdentityModel.Client.ClientCredentialsTokenRequest*
- *Duende.IdentityModel.Client.DeviceAuthorizationRequest*
- *Duende.IdentityModel.Client.DeviceTokenRequest*
- *Duende.IdentityModel.Client.DiscoveryDocumentRequest*
- *Duende.IdentityModel.Client.DynamicClientRegistrationRequest*
- *Duende.IdentityModel.Client.JsonWebKeySetRequest*
- *Duende.IdentityModel.Client.PasswordTokenRequest*
- *Duende.IdentityModel.Client.PushedAuthorizationRequest*
- *Duende.IdentityModel.Client.RefreshTokenRequest*
- *Duende.IdentityModel.Client.TokenExchangeTokenRequest*
- *Duende.IdentityModel.Client.TokenIntrospectionRequest*
- *Duende.IdentityModel.Client.TokenRequest*
- *Duende.IdentityModel.Client.TokenRevocationRequest*
- *Duende.IdentityModel.Client.UserInfoRequest*