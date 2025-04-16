---
title: "Issuing Tokens based on User Passwords"
description: "A guide to implementing the deprecated password grant type in IdentityServer for legacy applications, covering token requests, client library usage, and custom validation of user credentials."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 30
redirect_from:
  - /identityserver/v5/tokens/password_grant/
  - /identityserver/v6/tokens/password_grant/
  - /identityserver/v7/tokens/password_grant/
---

The `password` grant type is an OAuth 2.0 [protocol flow](https://tools.ietf.org/html/rfc6749#section-4.3) for
authenticating end-users at the token endpoint. It is designed for legacy applications, and it is generally recommended
to use a browser-based flow instead - but in certain situation it is not feasible to change existing applications.

:::note
The `password` grant type is deprecated per [OAuth 2.1](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/).
:::

## Requesting A Token Using Password Grant

First you need to add the `GrantType.Password` to the `AllowedGrantTypes` list of the client you want to use.

Then your client application would provide some means for the end-user to enter their credentials and post them to the
token endpoint:

```text
POST /token HTTP/1.1
Host: demo.duendesoftware.com
Content-Type: application/x-www-form-urlencoded

client_id=client&
client_secret=secret&
grant_type=password&
username=bob&
password=password
```

### .NET Client Library

On .NET you can use the [IdentityModel](https://identitymodel.readthedocs.io/en/latest/) client library
to [request](https://identitymodel.readthedocs.io/en/latest/client/token.html) tokens using the `password` grant type,
e.g.:

```cs
using IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestPasswordTokenAsync(new PasswordTokenRequest
{
    Address = "https://demo.duendesoftware.com/connect/token",

    ClientId = "client",
    ClientSecret = "secret",
    Scope = "api1",

    UserName = "bob",
    Password = "password"
});
```

## Validating The Token Request

Since this flow is not generally recommended, no standard implementation for validating the token request and user
credentials is included.
To add support for it, you need to implement and [register](/identityserver/reference/di#additional-services) an
implementation of the `IResourceOwnerPasswordValidator` interface:

```cs
public interface IResourceOwnerPasswordValidator
{
    /// <summary>
    /// Validates the resource owner password credential
    /// </summary>
    /// <param name="context">The context.</param>
    Task ValidateAsync(ResourceOwnerPasswordValidationContext context);
}
```

The context contains parsed protocol parameters like `UserName` and `Password` and the raw request.

It is the job of the validator to implement the password validation and set the `Result` property on the context
accordingly (see the [Grant Validation Result](/identityserver/reference/models/grant-validation-result/) reference).
