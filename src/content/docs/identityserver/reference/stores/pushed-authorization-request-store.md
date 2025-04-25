---
title: "Pushed Authorization Request Store"
description: Interface for managing pushed authorization requests storage in OAuth PAR flow.
sidebar:
  label: Pushed Authorization Request
  order: 110
redirect_from:
  - /identityserver/v5/reference/stores/pushed_authorization_request_store/
  - /identityserver/v6/reference/stores/pushed_authorization_request_store/
  - /identityserver/v7/reference/stores/pushed_authorization_request_store/
---

The pushed authorization request store is responsible for creating, retrieving, and
consuming pushed authorization requests.

#### Duende.IdentityServer.Stores.IPushedAuthorizationRequestStore

```cs
/// <summary>
/// The interface for a service that stores pushed authorization requests.
/// </summary>
public interface IPushedAuthorizationRequestStore
{
    /// <summary>
    /// Stores the pushed authorization request.
    /// </summary>
    /// <param name="pushedAuthorizationRequest">The request.</param>
    /// <returns></returns>
    Task StoreAsync(PushedAuthorizationRequest pushedAuthorizationRequest);

    /// <summary>
    /// Consumes the pushed authorization request, indicating that it should not
    /// be used again. Repeated use could indicate some form of replay attack,
    /// but also could indicate that an end user refreshed their browser or
    /// otherwise retried a request that consumed the pushed authorization
    /// request.
    /// </summary>
    /// <param name="referenceValueHash">The hash of the reference value of the
    /// pushed authorization request. The reference value is the identifier
    /// within the request_uri parameter.</param>
    /// <returns></returns>
    Task ConsumeByHashAsync(string referenceValueHash);

    /// <summary>
    /// Gets the pushed authorization request.
    /// </summary>
    /// <param name="referenceValueHash">The hash of the reference value of the
    /// pushed authorization request. The reference value is the identifier
    /// within the request_uri parameter.</param>
    /// <returns>The pushed authorization request, or null if the request does
    /// not exist or was previously consumed.
    /// </returns>
    Task<PushedAuthorizationRequest?> GetByHashAsync(string referenceValueHash);
}
```

#### Duende.IdentityServer.Models.PushedAuthorizationRequest

```cs
/// <summary>
/// Represents a persisted Pushed Authorization Request.
/// </summary>
public class PushedAuthorizationRequest
{
    /// <summary>
    /// The hash of the identifier within this pushed request's request_uri
    /// value. Request URIs that IdentityServer produces take the form
    /// urn:ietf:params:oauth:request_uri:{ReferenceValue}. 
    /// </summary>
    public string ReferenceValueHash { get; set; }

    /// <summary>
    /// The UTC time at which this pushed request will expire. The Pushed
    /// request will be used throughout the authentication process, beginning
    /// when it is passed to the authorization endpoint by the client, and then
    /// subsequently after user interaction, such as login and/or consent occur.
    /// If the expiration time is exceeded before a response to the client can
    /// be produced, IdentityServer will raise an error, and the user will be
    /// redirected to the IdentityServer error page. 
    /// </summary>

    public DateTime ExpiresAtUtc { get; set; }

    /// <summary>
    /// The data protected content of the pushed authorization request.  
    /// </summary>
    public string Parameters { get; set; }
}
```
