---
title: "Issuing Tokens based on User Passwords"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

The *password* grant type is an OAuth 2.0 [protocol flow](https://tools.ietf.org/html/rfc6749#section-4.3) for authenticating end-users at the token endpoint. It is designed for legacy applications, and it is generally recommended to use a browser-based flow instead - but in certain situation it is not feasible to change existing applications.

{{% notice note %}}
The *password* grant type is deprecated per [OAuth 2.1](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/).
{{% /notice %}}

## Requesting a token using Password grant
First you need to add the *GrantType.Password* to the *AllowedGrantTypes* list of the client you want to use.

Then your client application would provide some means for the end-user to enter their credentials and post them to the token endpoint:

```
POST /token HTTP/1.1
Host: demo.duendesoftware.com
Content-Type: application/x-www-form-urlencoded

client_id=client&
client_secret=secret

grant_type=password&
username=bob&
password=password
```

### .NET client library
On .NET you can use the [IdentityModel](https://identitymodel.readthedocs.io/en/latest/) client library to [request](https://identitymodel.readthedocs.io/en/latest/client/token.html) tokens using the *password* grant type, e.g.:

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

## Validating the token request
Since this flow is not generally recommended, no standard implementation for validating the token request and user credentials is included.
To add support for it you need to to implement and [register]({{< ref "/reference/di#additional-services" >}}) an implementation of the *IResourceOwnerPasswordValidator* interface::

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

The context contains parsed protocol parameters like *UserName* and *Password* as well as the raw request.

It is the job of the validator to implement the password validation and set the *Result* property on the context accordingly (see the [Grant Validation Result]({{< ref "/reference/models/grant_validation_result" >}}) reference).
