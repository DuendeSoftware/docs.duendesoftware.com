---
title: "Signed Authorize Requests"
description: "JWT Secured Authorization Request (JAR) is a security enhancement that allows authorization parameters to be packaged in signed JWTs, providing tamperproof requests and front-channel client authentication in IdentityServer."
date: 2024-01-20
sidebar:
  label: "Signed Requests"
  order: 150
redirect_from:
  - /identityserver/v5/tokens/jar/
  - /identityserver/v6/tokens/jar/
  - /identityserver/v7/tokens/jar/
---

Instead of providing the parameters for an authorize request as individual query string key/value pairs, you can package them up in signed JWTs.
This makes the parameters tamperproof and you can authenticate the client already on the front-channel.

:::note
See [here](/identityserver/samples/basics.md#mvc-client-with-jar-and-jwt-based-authentication) for a sample for using signed authorize requests (and JWT-based authentication) in ASP.NET Core.
:::

You can either transmit them by value or by reference to the authorize endpoint - see the [spec](https://openid.net/specs/openid-connect-core-1_0.html#jwtrequests) for more details.

Duende IdentityServer requires the request JWTs to be signed. We support X509 certificates and JSON web keys, e.g.:

```cs
var client = new Client
{
    ClientId = "foo",

    // set this to true to accept signed requests only
    RequireRequestObject = true,

    ClientSecrets = 
    {
        new Secret
        {
            // X509 cert base64-encoded
            Type = IdentityServerConstants.SecretTypes.X509CertificateBase64,
            Value = Convert.ToBase64String(cert.Export(X509ContentType.Cert))
        },
        new Secret
        {
            // RSA key as JWK
            Type = IdentityServerConstants.SecretTypes.JsonWebKey,
            Value = "{'e':'AQAB','kid':'...','kty':'RSA','n':'...'}"
        }
    }
}
```

## Passing Request JWTs By Reference
If the `request_uri` parameter is used, IdentityServer will make an outgoing HTTP call to fetch the JWT from the specified URL.

You can customize the HTTP client used for this outgoing connection, e.g. to add caching or retry logic (e.g. via the Polly library):

```cs
// Program.cs
idsvrBuilder.AddJwtRequestUriHttpClient(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
})
    .AddTransientHttpErrorPolicy(policy => policy.WaitAndRetryAsync(new[]
    {
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(2),
        TimeSpan.FromSeconds(3)
    }));
```

:::note
Request URI processing is disabled by default. Enable on the [Endpoints](/identityserver/reference/options.md#endpoints) on the `IdentityServerOptions`. Also see the security considerations from the JAR [specification](https://tools.ietf.org/html/draft-ietf-oauth-jwsreq-23#section-10.4).
:::

## Accessing The Request Object Data
You can access the validated data from the request object in two ways:

* Wherever you have access to the `ValidatedAuthorizeRequest`, the `RequestObjectValues` dictionary holds the values.
* In the UI code you can call `IIdentityServerInteractionService.GetAuthorizationContextAsync`, the resulting [AuthorizationRequest](/identityserver/reference/services/interaction-service.md#authorizationrequest) object contains the `RequestObjectValues` dictionary as well.
