---
title: "Password Grant"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

The *password* grant type is an OAuth 2.0 protocol flow for authenticating end-users at the token endpoint. It is designed for legacy applications (and will be removed in OAuth 2.1). It is generally recommended to use *authorization code* flow and the browser instead - but in certain situation it is not feasible to change existing applications.

## Requesting a token using Password grant
First you need to add the *GrantType.Password* to the *AllowedGrantTypes* list of the client you want to use.

 Per [specification](https://tools.ietf.org/html/rfc6749#section-4.3) you post the user name & password to the token endpoint, to receive the typical token response:

```
POST /token HTTP/1.1
Host: demo.duendesoftware.com
Content-Type: application/x-www-form-urlencoded

client_id=client&
client_secret=secret

grant_type=password&
username=johndoe&
password=A3ddj3w
```

### .NET client library
On .NET you can use the [IdentityModel](https://identitymodel.readthedocs.io/en/latest/) client library to [request](https://identitymodel.readthedocs.io/en/latest/client/token.html) tokens, e.g.:

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
    Password = "bob"
});
```

## Validating the token request
By default, handling *password* grant requests is not supported. To add support for it you need to to implement and register an implementation of the *IResourceOwnerPasswordValidator* interface::

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

On the context you will find already parsed protocol parameters like *UserName* and *Password*, but also the raw request if you want to look at other input data.

Your job is then to implement the password validation and set the *Result* on the context accordingly (see the [grant validation result]({{< ref "/reference/grant_validation_result" >}}) reference).