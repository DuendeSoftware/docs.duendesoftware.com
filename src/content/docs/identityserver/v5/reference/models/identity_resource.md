---
title: "Identity Resource"
date: 2020-09-10T08:22:12+02:00
order: 20
---

#### Duende.IdentityServer.Models.IdentityResource

This class models an identity resource.

```cs
public static readonly IEnumerable<IdentityResource> IdentityResources =
    new[]
    {
        // some standard scopes from the OIDC spec
        new IdentityResources.OpenId(),
        new IdentityResources.Profile(),
        new IdentityResources.Email(),

        // custom identity resource with some associated claims
        new IdentityResource("custom.profile", 
            userClaims: new[] { JwtClaimTypes.Name, JwtClaimTypes.Email, "location", JwtClaimTypes.Address })
    };
```

* ***Enabled***

    Indicates if this resource is enabled and can be requested. Defaults to true.

* ***Name***
    
    The unique name of the identity resource. This is the value a client will use for the scope parameter in the authorize request.

* ***DisplayName***
    
    This value will be used e.g. on the consent screen.

* ***Description***
    
    This value will be used e.g. on the consent screen.

* ***Required***
    
    Specifies whether the user can de-select the scope on the consent screen (if the consent screen wants to implement such a feature). 
    Defaults to false.

* ***Emphasize***
    
    Specifies whether the consent screen will emphasize this scope (if the consent screen wants to implement such a feature). Use this setting for sensitive or important scopes. Defaults to false.

* ***ShowInDiscoveryDocument***
    
    Specifies whether this scope is shown in the discovery document. Defaults to *true*.

* ***UserClaims***

    List of associated user claim types that should be included in the identity token.