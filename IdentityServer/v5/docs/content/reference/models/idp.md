---
title: "Identity Provider"
date: 2020-09-10T08:22:12+02:00
weight: 35
---

#### Duende.IdentityServer.Models.IdentityProvider

The *IdentityProvider* is intended to be a base class to model arbitrary identity providers.

```cs
    /// <summary>
    /// Models general storage for an external authentication provider/handler scheme
    /// </summary>
    public class IdentityProvider
    {
        /// <summary>
        /// Scheme name for the provider.
        /// </summary>
        public string Scheme { get; set; }

        /// <summary>
        /// Display name for the provider.
        /// </summary>
        public string DisplayName { get; set; }

        /// <summary>
        /// Flag that indicates if the provider should be used.
        /// </summary>
        public bool Enabled { get; set; } = true;

        /// <summary>
        /// Protocol type of the provider.
        /// </summary>
        public string Type { get; set; }
    }
```

#### OidcProvider model

The default implementation included in *Duende IdentityServer* will return a derived class for OpenID Connect providers, via the *OidcProvider* class. Notice the *Type* property is set to a fixed value of *"oidc"* to indicate the protocol type.

```cs
    /// <summary>
    /// Models an OIDC identity provider
    /// </summary>
    public class OidcProvider : IdentityProvider
    {
        /// <summary>
        /// Ctor
        /// </summary>
        public OidcProvider()
        {
            Type = "oidc";
        }

        /// <summary>
        /// The base address of the OIDC provider
        /// </summary>
        public string Authority { get; set; }
        /// <summary>
        /// The response type
        /// </summary>
        public string ResponseType { get; set; } = "id_token";
        /// <summary>
        /// The client id
        /// </summary>
        public string ClientId { get; set; }
        /// <summary>
        /// The client secret
        /// </summary>
        public string ClientSecret { get; set; }
        /// <summary>
        /// Space separated list of scope values.
        /// </summary>
        public string Scope { get; set; } = "openid";
    }
```
