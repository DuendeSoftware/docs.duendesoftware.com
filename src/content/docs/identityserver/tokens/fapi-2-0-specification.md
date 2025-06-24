---
title: FAPI 2.0
description: Overview of the FAPI 2.0 implementation in Duende IdentityServer 7.3+ 
sidebar:
  label: FAPI 2.0
  badge:
    text: v7.3
    variant: tip
---

<span data-shb-badge data-shb-badge-variant="default">Added in 7.3</span>

The [FAPI 2.0 Security Profile](https://openid.net/specs/fapi-security-profile-2_0-final.html) is an API security profile based on the OAuth 2.0 Authorization Framework. Its goal is to protect APIs in high-value scenarios and is a set of OAuth Security best current practice (BCP) recommendations. These high-value scenarios include assets typically deployed in the fields of e-health and e-government, which may provide consumers with sensitive data and mission-critical functionality.

Duende IdentityServer implements the FAPI 2.0 BCP features so you can build, deploy, and maintain a FAPI 2.0 Security profile as part of your overall security posture. Let's discuss those features and how to enable them.

## FAPI 2.0 Required Features

To be considered a FAPI 2.0 compliant implementation, your implementation must enable features that provide a heightened security level for your applications. The list of requirements can be found in the specification, but are listed here as well: 

### Authorization Servers

When customizing IdentityServer for FAPI 2.0 compliance, follow the rules listed below.

1. Distribute discovery metadata (such as the authorization endpoint) via the metadata document.
2. Reject requests using the resource owner password credentials grant.
3. Only support confidential clients.
4. Only issue sender-constrained access tokens.
5. Use one of the following methods for sender-constrained access tokens: MTLS and DPoP.
6. Authenticate clients using one of the methods of mTLS or `private_key_jwt`. 
7. Shall not expose open redirectors.
8. Only accept the issuer identifier value as a string in the `aud` claim received in client authentication assertions.
9. Do not use refresh token rotation except in extraordinary circumstances.
10. If using DPoP, use the server-provided nonce mechanism.
11. Issue authorization codes with a maximum lifetime of 60 seconds.
12. If using DPoP, shall support "Authorization Code Binding to DPoP Key".
13. To accommodate clock offsets, shall accept JWTs with an `iat` or `nbf` timestamp between 0 and 10 seconds in the future, but reject JWTs with an `iat` or `nbf` timestamp greater than 60 seconds in the future. 
14. Restrict the privileges associated with an access token to the minimum required for the particular application or use case.

Luckily, many of these rules are enabled by default and do not require any code changes. Let's look at setting up your instance of IdentityServer for FAPI 2.0 compliance.

```csharp
builder.Services.AddIdentityServer(opt =>
{
    if (builder.Environment.IsProduction())
    {
        opt.KeyManagement.KeyPath = "/tmp/keys";
    }
    opt.KeyManagement.SigningAlgorithms.Add(new SigningAlgorithmOptions(SecurityAlgorithms.RsaSsaPssSha256));

    opt.DPoP.SupportedDPoPSigningAlgorithms = [
        SecurityAlgorithms.RsaSsaPssSha256,
        SecurityAlgorithms.RsaSsaPssSha384,
        SecurityAlgorithms.RsaSsaPssSha512,

        SecurityAlgorithms.EcdsaSha256,
        SecurityAlgorithms.EcdsaSha384,
        SecurityAlgorithms.EcdsaSha512
    ];
    opt.SupportedClientAssertionSigningAlgorithms = [
        SecurityAlgorithms.RsaSsaPssSha256,
        SecurityAlgorithms.RsaSsaPssSha384,
        SecurityAlgorithms.RsaSsaPssSha512,

        SecurityAlgorithms.EcdsaSha256,
        SecurityAlgorithms.EcdsaSha384,
        SecurityAlgorithms.EcdsaSha512
    ];
    opt.SupportedRequestObjectSigningAlgorithms = [
        SecurityAlgorithms.RsaSsaPssSha256,
        SecurityAlgorithms.RsaSsaPssSha384,
        SecurityAlgorithms.RsaSsaPssSha512,

        SecurityAlgorithms.EcdsaSha256,
        SecurityAlgorithms.EcdsaSha384,
        SecurityAlgorithms.EcdsaSha512
    ];
    opt.JwtValidationClockSkew = TimeSpan.FromSeconds(10);

})
```

The general configuration for IdentityServer includes two notable changes from what you may see in a typical authorization server implementation.

1. Explicit setting of signing algorithms for JWTs and DPoP to meet FAPI 2.0 compliance, including adding the information to the discovery document.
2. Setting the `JwtValidationClockSkew` to meet the time requirements of FAPI 2.0.

That's it for the server. Next, let's examine how to configure the clients to meet FAPI 2.0 specifications.

### Client Configuration

Clients must also follow strict recommendations to be considered FAPI 2.0 compliant.

1. Support sender-constrained access tokens using one or both methods: mTLS and DPoP.
2. Support client authentication using one or both methods: mTLS and `private_key_jwt`.
3. Send access tokens in the HTTP header
4. Do not expose open redirectors
5. If using `private_key_jwt`, shall use the authorization server's issuer identifier value in the `aud` claim in client authentication assertions. The issuer identifier value shall be sent as a string, not as an array item.
6. Shall support refresh tokens and their rotation;
7. If using MTLS client authentication or MTLS sender-constrained access tokens,`mtls_endpoint_aliases` metadata should be supported.
8. If using DPoP, shall support the server-provided nonce mechanism.
9. Only use authorization server metadata (such as the authorization endpoint) retrieved from the metadata document.
10. Ensure that the issuer URL used to retrieve the authorization server metadata is obtained from an authoritative source and using a secure channel, such that an attacker cannot modify it.
11. Ensure that this issuer URL and the issuer value in the obtained metadata match.
12. Initiate an authorization process only with the end-user's explicit or implicit consent and protect initiation of an authorization process against cross-site request forgery, thereby enabling the end-user to be aware of the context in which a flow was started; and
13. Request authorization with the least privileges necessary for the specific application or use case.

On the client side of your security implementation, a client configuration must also follow these rules:

1. Use the authorization code grant.
2. Use pushed authorization requests.
3. Use PKCE with S256 as the code challenge method.
4. Generate the PKCE challenge for each authorization request and securely bind the challenge to the client and the user agent in which the flow was started.
5. Check the `iss` parameter in the authorization response to prevent mix-up attacks.
6. Only send `client_id` and `request_uri` request parameters to the authorization endpoint (all other authorization request parameters are sent in the pushed authorization request).
7. If using OIDC, nonce parameter values should be no longer than 64 characters.

Again, many of these requirements are already enabled by default as part of IdentityServer. Still, you must change your configuration to enable some requirements explicitly on your client configurations. Let's look at a client that meets FAPI 2.0 compliance.

```csharp
new Client
{
    ClientId = "client1",
    // 1. set the client secret to use a private key JWT
    ClientSecrets = [
        new Secret
        {
            Type = IdentityServerConstants.SecretTypes.JsonWebKey,
            Value =
            """
            <JWT Key goes here>
            """
        }
     ],

    AllowedGrantTypes = GrantTypes.Code,
    // 2. explicit redirect URIs for this client
    RedirectUris = [
        "https://example.com/test/a/duende-fapi2/callback",
        "https://example.com/test/a/duende-fapi2/callback?dummy1=lorem&dummy2=ipsum"
    ],

    AllowOfflineAccess = true,
    AllowedScopes = [ "openid", "profile", "api" ],
    // 3. Require DPoP
    RequireDPoP = true,
    // 4. Require Pushed Authorization Requests (PAR)
    RequirePushedAuthorization = true
},
```

Let's review the four elements that turn a client into a FAPI 2.0-compliant client.

1. Using a private key JWT as a secret.
2. Adding explicit redirect URIs to ensure redirects are for trusted targets.
3. Enable DPoP security for the client.
4. Enable Pushed Authorization Requests

That's it. You now have a FAPI 2.0-compliant client.

Now that our authorization server's client configuration is FAPI 2.0 compliant, we'll need our clients to comply with the requirements.

```csharp
builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.Authority = configuration.Authority;
        options.TokenValidationParameters.ValidateAudience = false;
        options.MapInboundClaims = false;

        options.TokenValidationParameters.ValidTypes = ["at+jwt"];
    });
    
builder.Services.ConfigureDPoPTokensForScheme(JwtBearerDefaults.AuthenticationScheme,
    dpopOptions =>
    {
        dpopOptions.ProofTokenValidationParameters.ValidAlgorithms =
        [
            SecurityAlgorithms.RsaSsaPssSha256,
            SecurityAlgorithms.RsaSsaPssSha384,
            SecurityAlgorithms.RsaSsaPssSha512,

            SecurityAlgorithms.EcdsaSha256,
            SecurityAlgorithms.EcdsaSha384,
            SecurityAlgorithms.EcdsaSha512
        ];
    }
    );
```

You are now FAPI 2.0 compliant and ready to secure your high-value assets with Duende IdentityServer.

## Private Key JWT vs. MTLS

While the FAPI 2.0 allows for choice in securing communication between the authorization server and clients, we recommend that developers implementing FAPI 2.0 start with private key JWTs before choosing mTLS. Both are supported with Duende IdentityServer, but [implementing mTLS](/identityserver/tokens/client-authentication.md#mutual-tls-client-certificates) is relatively challenging to maintain in a production environment. You are responsible for your deployment and production environments, so you are ultimately best suited to decide which option to move forward with.
