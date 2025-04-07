---
title: "Profile Service"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 40
redirect_from:
  - /identityserver/v5/reference/services/
  - /identityserver/v6/reference/services/
  - /identityserver/v7/reference/services/
  - /identityserver/v5/reference/services/profile_service/
  - /identityserver/v6/reference/services/profile_service/
  - /identityserver/v7/reference/services/profile_service/
---

#### Duende.IdentityServer.Services.IProfileService

Encapsulates retrieval of user claims from a data source of your choice.
See [here](/identityserver/v7/samples/ui#custom-profile-service) for a sample.

```cs
/// <summary>
/// This interface allows IdentityServer to connect to your user and profile store.
/// </summary>
public interface IProfileService
{
    /// <summary>
    /// This method is called whenever claims about the user are requested (e.g. during token creation or via the userinfo endpoint)
    /// </summary>
    /// <param name="context">The context.</param>
    /// <returns></returns>
    Task GetProfileDataAsync(ProfileDataRequestContext context);

    /// <summary>
    /// This method gets called whenever identity server needs to determine if the user is valid or active (e.g. if the user's account has been deactivated since they logged in).
    /// (e.g. during token issuance or validation).
    /// </summary>
    /// <param name="context">The context.</param>
    /// <returns></returns>
    Task IsActiveAsync(IsActiveContext context);
}
```

* **`GetProfileDataAsync`**

  The API that is expected to load claims for a user. It is passed an instance of `ProfileDataRequestContext`.

* **`IsActiveAsync`**

  The API that is expected to indicate if a user is currently allowed to obtain tokens. It is passed an instance of
  `IsActiveContext`.

#### Duende.IdentityServer.Models.ProfileDataRequestContext

Models the request for user claims and is the vehicle to return those claims. It contains these properties:

* **`Subject`**

  The `ClaimsPrincipal` modeling the user associated with this request for profile data. When the profile service is
  invoked for tokens, the `Subject` property will contain the user's principal. Which claims are contained in the
  principal depends on the following:

    - When the [server side sessions feature](/identityserver/v7/ui/server_side_sessions) is enabled _Subject_ will always contain
      the claims stored in the server side session.
    - When that is not the case, it depends on the caller context:
        - If the _ProfileService_ is called in the context of a grant (e.g. exchanging a code for a token), the claims
          associated with that grant in the grant store will be used. When grants are stored, by default a snapshot of
          the logged-in user's claims are captured with the grant.
        - If there's no grant context (e.g. when the user info endpoint is called) the claims in the access token will
          be used.

* **`Client`**

  The `Client` for which the claims are being requested.

* **`RequestedClaimTypes`**

  The collection of claim types being requested. This data is source from the requested scopes and their associated
  claim types.

* **`Caller`**

  An identifier for the context in which the claims are being requested (e.g. an identity token, an access token, or the
  user info endpoint). The `IdentityServerConstants.ProfileDataCallers` class contains the different constant values.

* **`IssuedClaims`**

  The list of claims that will be returned. This is expected to be populated by the custom `IProfileService`
  implementation.

* **`AddRequestedClaims`**

  Extension method on the `ProfileDataRequestContext` to populate the `IssuedClaims`, but first filters the claims based
  on `RequestedClaimTypes`.

#### Duende.IdentityServer.Models.IsActiveContext

Models the request to determine if the user is currently allowed to obtain tokens. It contains these properties:

* **`Subject`**

  The `ClaimsPrincipal` modeling the user.

* **`Client`**

  The `Client` for which the claims are being requested.

* **`Caller`**

  An identifier for the context in which the claims are being requested (e.g. an identity token, an access token, or the
  user info endpoint). The constant `IdentityServerConstants.ProfileIsActiveCallers` contains the different constant
  values.

* **`IsActive`**

  The flag indicating if the user is allowed to obtain tokens. This is expected to be assigned by the custom
  `IProfileService` implementation.
