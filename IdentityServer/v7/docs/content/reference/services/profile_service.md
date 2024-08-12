---
title: "Profile Service"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

#### Duende.IdentityServer.Services.IProfileService

Encapsulates retrieval of user claims from a data source of your choice. See [here]({{< ref "/samples/ui#custom-profile-service" >}}) for a sample.

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

- **_GetProfileDataAsync_**

  The API that is expected to load claims for a user. It is passed an instance of _ProfileDataRequestContext_.

- **_IsActiveAsync_**
  The API that is expected to indicate if a user is currently allowed to obtain tokens. It is passed an instance of _IsActiveContext_.

#### Duende.IdentityServer.Models.ProfileDataRequestContext

Models the request for user claims and is the vehicle to return those claims. It contains these properties:

- **_Subject_**

  The _ClaimsPrincipal_ modeling the user associated with this request for profile data. When the profile service is invoked for tokens, the _Subject_ property will contain the principal that was issued during user sign-in. When the profile service is called for requests to the [userinfo endpoint]({{< ref "/reference/endpoints/userinfo" >}}), the _Subject_ property will contain a claims principal populated with the claims in the access token used to authorize the userinfo call.

  When the [server-side sessions feature]({{< ref "ui/server_side_sessions/" >}}) is enabled _Subject_ will always contain the claims in the session.

- **_Client_**

  The _Client_ for which the claims are being requested.

- **_RequestedClaimTypes_**

  The collection of claim types being requested. This data is source from the requested scopes and their associated claim types.

- **_Caller_**

  An identifier for the context in which the claims are being requested (e.g. an identity token, an access token, or the user info endpoint). The _IdentityServerConstants.ProfileDataCallers_ class contains the different constant values.

- **_IssuedClaims_**

  The list of claims that will be returned. This is expected to be populated by the custom _IProfileService_ implementation.

- **_AddRequestedClaims_**

  Extension method on the _ProfileDataRequestContext_ to populate the _IssuedClaims_, but first filters the claims based on _RequestedClaimTypes_.

#### Duende.IdentityServer.Models.IsActiveContext

Models the request to determine if the user is currently allowed to obtain tokens. It contains these properties:

- **_Subject_**

  The _ClaimsPrincipal_ modeling the user.

- **_Client_**

  The _Client_ for which the claims are being requested.

- **_Caller_**

  An identifier for the context in which the claims are being requested (e.g. an identity token, an access token, or the user info endpoint. The constant _IdentityServerConstants.ProfileIsActiveCallers_ contains the different constant values.

- **_IsActive_**
  The flag indicating if the user is allowed to obtain tokens. This is expected to be assigned by the custom _IProfileService_ implementation.
