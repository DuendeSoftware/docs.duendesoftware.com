---
title: "Resource Isolation"
description: Learn about isolating OAuth resources and using the resource parameter to control access token scope and audience
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 40
redirect_from:
  - /identityserver/v5/fundamentals/resources/isolation/
  - /identityserver/v6/fundamentals/resources/isolation/
  - /identityserver/v7/fundamentals/resources/isolation/
---

:::note
This is an Enterprise Edition feature.
:::

OAuth itself only knows about scopes - the (API) resource concept does not exist from a pure protocol point of view.
This means that all the requested scope and audience combination get merged into a single access token.

This has a couple of downsides:

* Tokens can become very powerful (and large)
  * If such a token leaks, it allows access to multiple resources
* Resources within that single token might have conflicting settings, e.g.
  * User claims of all resources share the same token
  * Resource-specific processing like signing or encryption algorithms conflict
* Without sender-constraints, a resource could potentially re-use (or abuse) a token to call another contained resource directly

### Audience Ambiguity

In a system with multiple APIs (e.g., Shipping, Invoicing and Inventory APIs), a single token often lists all of them as valid audiences.

```json
{
  "iss": "https://demo.duendesoftware.com",
  "aud": ["invoice_api", "shipping_api", "inventory_api"],
  "scope": ["invoice.read", "shipping.write", "inventory.read"]
}
```

This violates the Principle of Least Privilege. If this token is leaked from the Inventory API, it can be used to call the Invoice API.

To solve this problem [RFC 8707](https://tools.ietf.org/html/rfc8707) adds another request parameter for the authorize and token endpoint called `resource`.
This allows requesting a token for a specific resource (in other words - making sure the audience claim has a single
value only, and all scopes belong to that single resource).

## Using The Resource Parameter

Let's assume you have the following resource design and that the client is allowed access to all scopes:

```csharp title="ApiResources.cs"
var resources = new[]
{
    new ApiResource("urn:invoices")
    {
        Scopes = { "read", "write" }
    },

    new ApiResource("urn:products")
    {
        Scopes = { "read", "write" }
    }
};
```

If the client would request a token for the `read` scope, the resulting access token would contain the audience of both
the invoice and the products API and thus be accepted at both APIs.

### Machine to Machine Scenarios

If the client in addition passes the `resource` parameter specifying the name of the resource where it wants to use
the access token, the token engine can `down-scope` the resulting access token to the single resource, e.g.:

```text
POST /token

grant_type=client_credentials&
client_id=client&
client_secret=...&

scope=read&
resource=urn:invoices
```

Thus resulting in an access token like this (some details omitted):

```json
{
  "aud": ["urn:invoice"],
  "scope": "read",
  "client_id": "client"
}
```

### Interactive Applications

The authorize endpoint supports the `resource` parameter as well, e.g.:

```text
GET /authorize?client_id=client&response_type=code&scope=read&resource=urn:invoices
```

Once the front-channel operations are done, the resulting code can be redeemed by passing the resource name on the token endpoint:

```text
POST /token

grant_type=authorization_code&
client_id=client&
client_secret=...&
authorization_code=...&
redirect_uri=...&

resource=urn:invoices
```

### Requesting Access To Multiple Resources

It is also possible to request access to multiple resources. This will result in multiple access tokens - one for each request resource.

```text
GET /authorize?client_id=client&response_type=code&scope=read offline_access&resource=urn:invoices&resource=urn:products
```

When you redeem the code, you need to specify for which resource you want to have an access token, e.g.:

```text
POST /token

grant_type=authorization_code&
client_id=client&
client_secret=...&
authorization_code=...&
redirect_uri=...&

resource=urn:invoices
```

This will return an access token for the invoices API and a refresh token. If you want to also retrieve the access token
for the products API, you use the refresh token and make another roundtrip to the token endpoint.

```text
POST /token

grant_type=refresh_token&
client_id=client&
client_secret=...&
refresh_token=...&

resource=urn:products
```

The end-result will be that the client has two access tokens - one for each resource and can manage their lifetime via the refresh token.

## Enforcing Resource Isolation

All examples so far used the `resource` parameter optionally. If you have API resources, where you want to make sure
they are not sharing access tokens with other resources, you can enforce the resource indicator, e.g.:

```csharp title="ApiResources.cs" {6,12}
var resources = new[]
{
    new ApiResource("urn:invoices")
    {
        Scopes = { "read", "write" },
        RequireResourceIndicator = true
    },

    new ApiResource("urn:products")
    {
        Scopes = { "read", "write" },
        RequireResourceIndicator = true
    }
};
```

The `RequireResourceIndicator` property **does not** mean that clients are forced to send the `resource` parameter when
they request scopes associated with the API resource. You can still request those scopes without setting the `resource`
parameter (or including the resource), and IdentityServer will issue a token as long as the client is allowed to request
the scopes.

Instead, `RequireResourceIndicator` controls **when** the resource's URI is included in the **audience claim** (`aud`)
of the issued access token.

* When `RequireResourceIndicator` is `false` (the default):
  IdentityServer **automatically includes** the API's resource URI in the token's audience if any of the resource's scopes
  are requested, even if the `resource` parameter was not sent in the request or didn't contain the resource URI.
* When `RequireResourceIndicator` is `true`:
  The API's resource URI will **only** be included in the audience **if the client explicitly includes the resource URI**
  via the `resource` parameter when requesting the token.

## .NET Client Implementation

While the examples above show the underlying HTTP protocol, .NET clients can use the Duende libraries to handle resource indicators easily.

### Machine-to-Machine (Worker)

When using `Duende.IdentityModel` for client credentials, you can pass the `resource` parameter using the `Parameters` dictionary:

```csharp
using Duende.IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestClientCredentialsTokenAsync(new ClientCredentialsTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",
    ClientId = "invoice_worker",
    ClientSecret = "secret",

    // The scope defines the permission
    Scope = "invoice.read",

    // The parameter defines the target (RFC 8707)
    Parameters = { { "resource", "urn:invoices" } }
});
```

### ASP.NET Core

For interactive applications using the standard OpenID Connect handler, use the `Resource` property on `OpenIdConnectOptions`:

```csharp
.AddOpenIdConnect(options =>
{
    options.Authority = "https://demo.duendesoftware.com";
    options.ClientId = "interactive_app";

    options.Scope.Add("invoice.read");

    // Explicitly set the target resource here
    options.Resource = "urn:invoices";

    options.ResponseType = "code";
    options.SaveTokens = true;
});
```

Note that while the RFC allows multiple `resource` parameters, the Microsoft OpenID Connect handler only supports a single resource value here.

For dynamic scenarios (e.g. multi-tenant), you can set the resource parameter in the `OnRedirectToIdentityProvider` event:

```csharp
options.Events.OnRedirectToIdentityProvider = context =>
{
    var tenantSpecificResource = DetermineResource(context);

    // Overwrite or set the 'resource' parameter
    context.ProtocolMessage.SetParameter("resource", tenantSpecificResource);

    return Task.CompletedTask;
};
```
