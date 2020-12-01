---
title: "Signed Authorize Requests"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

TODO add content from training 

Instead of providing the parameters for an authorize request as individual query string key/value pairs, you can package them up in signed JWTs.
This makes the parameters tamper proof and you can authenticate the client already on the front-channel.

{{% notice note %}}
See [here]({{< param samples_base >}}//Basics/MvcClientJarJwt) for a sample for using signed authorize requests (and JWT-based authentication) in ASP.NET Core.
{{% /notice %}}

TODO: add language about OIDC vs JAR

You can either transmit them by value or by reference to the authorize endpoint - see the `spec <https://openid.net/specs/openid-connect-core-1_0.html#JWTRequests>`_ for more details.

Duende IdentityServer requires the request JWTs to be signed. We support X509 certificates and JSON web keys, e.g.::

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

## Passing request JWTs by reference
If the *request_uri* parameter is used, IdentityServer will make an outgoing HTTP call to fetch the JWT from the specified URL.

You can customize the HTTP client used for this outgoing connection, e.g. to add caching or retry logic (e.g. via the Polly library)::

```cs
builder.AddJwtRequestUriHttpClient(client =>
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

{{% notice note %}}
Request URI processing is disabled by default. Enable on the :ref:`IdentityServer Options <refOptions>` under ``Endpoints``. Also see the security considerations from the JAR `specification <https://tools.ietf.org/html/draft-ietf-oauth-jwsreq-23#section-10.4>`_.
{{% /notice %}}

## Accessing the request object data
You can access the validated data from the request object in two ways

* wherever you have access to the ``ValidatedAuthorizeRequest``, the ``RequestObjectValues`` dictionary holds the values
* in the UI code you can call ``IIdentityServerInteractionService.GetAuthorizationContextAsync``, the resulting ``AuthorizationRequest`` object contains the ``RequestObjectValues`` dictionary as well
