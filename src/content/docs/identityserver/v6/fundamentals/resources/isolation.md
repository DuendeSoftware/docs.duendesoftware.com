---
title: "Resource Isolation"
date: 2020-09-10T08:22:12+02:00
order: 40
---

:::note
This is an Enterprise Edition feature.
:::

OAuth itself only knows about scopes - the (API) resource concept does not exist from a pure protocol point of view. This means that all the requested scope and audience combination get merged into a single access token. This has a couple of downsides, e.g.

* tokens can become very powerful (and big)
    * if such a token leaks, it allows access to multiple resources
* resources within that single token might have conflicting settings, e.g.
    * user claims of all resources share the same token
    * resource specific processing like signing or encryption algorithms conflict
* without sender-constraints, a resource could potentially re-use (or abuse) a token to call another contained resource directly

To solve this problem [RFC 8707](https://tools.ietf.org/html/rfc8707) adds an additional request parameter for the authorize and token endpoint called *resource*. This allows requesting a token for a specific resource (in other words - making sure the audience claim has a single value only, and all scopes belong to that single resource).

## Using the resource parameter
Let's assume you have the following resource design and that the client is allowed access to all scopes:

```cs
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

If the client would simply request a token for the *read* scope, the resulting access token would contain the audience of both the invoice and the products API and thus be accepted at both APIs.

### Machine to machine scenarios
If the client in addition passes the *resource* parameter specifying the name of the resource where it wants to use the access token, the token engine can *down-scope* the resulting access token to the single resource, e.g.:

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
    "aud": [ "urn:invoice" ],
    "scope": "read",
    "client_id": "client"
}
```

### Interactive applications
The authorize endpoint supports the *resource* parameter as well, e.g.:

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

### Requesting access to multiple resources
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

Which will return an access token for the invoices API and a refresh token. If you want to also retrieve the access token for the products API, you use the refresh token and make another roundtrip to the token endpoint.

```text
POST /token

grant_type=refresh_token&
client_id=client&
client_secret=...&
refresh_token=...&

resource=urn:products
```

The end-result will be that the client has two access tokens - one for each resource and can manage their lifetime via the  refresh token.

## Enforcing resource isolation
All examples so far used the *resource* parameter optionally. If you have API resources, where you want to make sure they are not sharing access tokens with other resources, you can enforce the resource indicator, e.g.:

```cs
var resources = new[]
{
    new ApiResource("urn:invoices")
    {
        Scopes = { "read", "write" },

        RequireResourceIndicator = true
    },

    new ApiResource("urn:products")
    {
        Scopes = { "read", "write" }
    }
};
```