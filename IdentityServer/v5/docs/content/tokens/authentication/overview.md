---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

Confidential and credentialed clients need to authenticate with your IdentityServer before they can request tokens.

Duende IdentityServer has built-in support for various client credential types and authentication methods, and an extensible infrastructure to customize the authentication system.

{{% notice note %}}
All information in this section also applies to [API secrets]({{< ref "/reference/api_resource" >}}) for introspection.
{{% /notice %}}

## Assigning secrets
A client secret is abstracted by the *Secret* class. It provides properties for setting the value and type as well as a description and expiration date.

```cs
var secret = new Secret
{
    Value = "foo",
    Type = "bar",

    Description = "my custom secret",
    Expiration = new DateTime(2021,12,31)
}
```

You can assign multiple secrets to a client to enable roll-over scenarios, e.g.:

```cs
var primary = new Secret("foo");
var secondary = new Secret("bar");

client.ClientSecrets = new[] { primary, secondary };
```

## Secret parsing
During request processing, the secret must be somehow extracted from the incoming request. The various specs describe a couple of options, e.g. as part of the authorization header or the body payload.

It is the job of implementations of the *ISecretParser* interface to accomplish this.

```cs
public interface ISecretParser
{
    /// <summary>
    /// Tries to find a secret on the context that can be used for authentication
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <returns>A parsed secret</returns>
    Task<ParsedSecret> ParseAsync(HttpContext context);

    /// <summary>
    /// Returns the authentication method name that this parser implements
    /// </summary>
    /// <value>The authentication method.</value>
    string AuthenticationMethod { get; }
}
```

You can add secret parsers by calling the *AddSecretParser()* DI extension method.

The following secret parsers are part of Duende IdentityServer:

* ***Duende.IdentityServer.Validation.BasicAuthenticationSecretParser***

    parses an OAuth basic authentication formatted *Authorization* header.
    Enabled by default.

* ***Duende.IdentityServer.Validation.PostBodySecretParser***

    Parses from the *client_id* and *client_secret* body fields.
    Enabled by default.

* ***Duende.IdentityServer.Validation.JwtBearerClientAssertionSecretParser***

    Parses a JWT on the *client_assertion* body field.
    Can be enabled by calling the *AddJwtBearerClientAuthentication* DI extension method.

* ***Duende.IdentityServer.Validation.MutualTlsSecretParser***

    Parses the *client_id* body field and TLS client certificate.
    Can be enabled by calling the *AddMutualTlsSecretValidators* DI extension method.


## Secret validation
It is the job of implementations of the *ISecretValidator* interface to validate the extracted credentials.

```cs
public interface ISecretValidator
{
    /// <summary>Validates a secret</summary>
    /// <param name="secrets">The stored secrets.</param>
    /// <param name="parsedSecret">The received secret.</param>
    /// <returns>A validation result</returns>
    Task<SecretValidationResult> ValidateAsync(
      IEnumerable<Secret> secrets,
      ParsedSecret parsedSecret);
}
```
You can add secret parsers by calling the *AddSecretValidator()* DI extension method.

The following secret validators are part of Duende IdentityServer:

* ***Duende.IdentityServer.Validation.HashedSharedSecretValidator***

    Validates shared secrets that are stored hashed.
    Enabled by default.

* ***Duende.IdentityServer.Validation.PlainTextSharedSecretValidator***

    Validates shared secrets that are stored in plaintext.

* ***Duende.IdentityServer.Validation.PrivateKeyJwtSecretValidator***

    Validates JWTs that are signed with either X.509 certificates or keys wrapped in a JWK.
    Can be enabled by calling the *AddJwtBearerClientAuthentication* DI extension method.

* ***Duende.IdentityServer.Validation.X509ThumbprintSecretValidator***

    Validates X.509 client certificates based on a thumbprint.
    Can be enabled by calling the *AddMutualTlsSecretValidators* DI extension method.

* ***Duende.IdentityServer.Validation.X509NameSecretValidator***

    Validates X.509 client certificates based on a common name.
    Can be enabled by calling the *AddMutualTlsSecretValidators* DI extension method.