---
title: Dynamic Client Registration
sidebar:
  order: 6
  label: Dynamic Client Registration
---

The client library for [OpenID Connect Dynamic Client
Registration](https://openid.net/specs/openid-connect-registration-1_0.html)
is provided as an extension method for *HttpClient*.

The following code sends a registration request:

```csharp
var client = new HttpClient();

var response = await client.RegisterClientAsync(new DynamicClientRegistrationRequest
{
    Address = Endpoint,
    Document = new DynamicClientRegistrationDocument
    {
        RedirectUris = { redirectUri },
        ApplicationType = "native"
    }
});
```

:::note
The *DynamicClientRegistrationDocument* class has strongly typed
properties for all standard registration parameters as defines by the
specification. If you want to add custom parameters, it is recommended
to derive from this class and add your own properties.
:::

The response is of type *RegistrationResponse* and has properties for
the standard response parameters. You also have access to the raw
response and to a parsed JSON document (via the *Raw* and *Json*
properties).

Before using the response, you should always check the *IsError*
property to make sure the request was successful:

```csharp
if (response.IsError) throw new Exception(response.Error);

var clientId = response.ClientId;
var secret = response.ClientSecret;
```
