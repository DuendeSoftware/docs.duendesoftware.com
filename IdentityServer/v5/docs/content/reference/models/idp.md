---
title: "Identity Provider"
date: 2020-09-10T08:22:12+02:00
weight: 35
---

#### Duende.IdentityServer.Models.OidcProvider

The *OidcProvider* models an external OpenID Connect provider for use in the [dynamic providers]({{< ref "/ui/login/dynamicproviders">}}) feature.
Its properties map to the Open ID Connect options class from ASP.NET Core, and those properties include:

* ***Enabled***
    
    Specifies if client is enabled. Defaults to *true*.

* ***Scheme***
    
    Scheme name for the provider.

* ***DisplayName***
    
    Display name for the provider.

* ***Type***
    
    Protocol type of the provider. Defaults to *"oidc"* for the *OidcProvider*.

* ***Authority***
    
    The base address of the OIDC provider. 

* ***ResponseType***
    
    The response type. Defaults to *"id_token"*.

* ***ClientId***
    
    The client id.

* ***ClientSecret***
    
    The client secret. By default this is the plaintext client secret and great consideration should be taken if this value is to be stored as plaintext in the store. It is possible to store this in a protected way and then unprotect when loading from the store either by implementing a custom *IIdentityProviderStore* or registering a custom *IConfigureNamedOptions\<OpenIdConnectOptions>*.

* ***Scope***
    
    Space separated list of scope values.



#### Duende.IdentityServer.Models.IdentityProvider

The *IdentityProvider* is a base class to model arbitrary identity providers, which *OidcProvider* derives from.
This leaves open the possibility for extensions to the dynamic provider feature to support other protocol types (as distinguished by the *Type* property).
