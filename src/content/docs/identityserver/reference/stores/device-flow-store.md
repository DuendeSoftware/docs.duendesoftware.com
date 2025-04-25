---
title: "Device Flow Store"
description: Documentation for the IDeviceFlowStore interface which manages storage of authorization grants for the device flow authentication process.
sidebar:
  label: Device Flow
  order: 43
redirect_from:
  - /identityserver/v5/reference/stores/device_flow_store/
  - /identityserver/v6/reference/stores/device_flow_store/
  - /identityserver/v7/reference/stores/device_flow_store/
---

#### Duende.IdentityServer.Stores.IDeviceFlowStore

Models storage of grants for the device flow.

```cs
/// <summary>
/// Interface for the device flow store
/// </summary>
public interface IDeviceFlowStore
{
    /// <summary>
    /// Stores the device authorization request.
    /// </summary>
    /// <param name="deviceCode">The device code.</param>
    /// <param name="userCode">The user code.</param>
    /// <param name="data">The data.</param>
    /// <returns></returns>
    Task StoreDeviceAuthorizationAsync(string deviceCode, string userCode, DeviceCode data);

    /// <summary>
    /// Finds device authorization by user code.
    /// </summary>
    /// <param name="userCode">The user code.</param>
    /// <returns></returns>
    Task<DeviceCode> FindByUserCodeAsync(string userCode);

    /// <summary>
    /// Finds device authorization by device code.
    /// </summary>
    /// <param name="deviceCode">The device code.</param>
    Task<DeviceCode> FindByDeviceCodeAsync(string deviceCode);

    /// <summary>
    /// Updates device authorization, searching by user code.
    /// </summary>
    /// <param name="userCode">The user code.</param>
    /// <param name="data">The data.</param>
    Task UpdateByUserCodeAsync(string userCode, DeviceCode data);

    /// <summary>
    /// Removes the device authorization, searching by device code.
    /// </summary>
    /// <param name="deviceCode">The device code.</param>
    Task RemoveByDeviceCodeAsync(string deviceCode);
}
```

#### DeviceCode

```cs
/// <summary>
/// Represents data needed for device flow.
/// </summary>
public class DeviceCode
{
    /// <summary>
    /// Gets or sets the creation time.
    /// </summary>
    /// <value>
    /// The creation time.
    /// </value>
    public DateTime CreationTime { get; set; }

    /// <summary>
    /// Gets or sets the lifetime.
    /// </summary>
    /// <value>
    /// The lifetime.
    /// </value>
    public int Lifetime { get; set; }

    /// <summary>
    /// Gets or sets the client identifier.
    /// </summary>
    /// <value>
    /// The client identifier.
    /// </value>
    public string ClientId { get; set; }

    /// <summary>
    /// Gets the description the user assigned to the device being authorized.
    /// </summary>
    /// <value>
    /// The description.
    /// </value>
    public string Description { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether this instance is open identifier.
    /// </summary>
    /// <value>
    ///   <c>true</c> if this instance is open identifier; otherwise, <c>false</c>.
    /// </value>
    public bool IsOpenId { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether this instance is authorized.
    /// </summary>
    /// <value>
    ///   <c>true</c> if this instance is authorized; otherwise, <c>false</c>.
    /// </value>
    public bool IsAuthorized { get; set; }

    /// <summary>
    /// Gets or sets the requested scopes.
    /// </summary>
    /// <value>
    /// The authorized scopes.
    /// </value>
    public IEnumerable<string> RequestedScopes { get; set; }

    /// <summary>
    /// Gets or sets the authorized scopes.
    /// </summary>
    /// <value>
    /// The authorized scopes.
    /// </value>
    public IEnumerable<string> AuthorizedScopes { get; set; }

    /// <summary>
    /// Gets or sets the subject.
    /// </summary>
    /// <value>
    /// The subject.
    /// </value>
    public ClaimsPrincipal Subject { get; set; }

    /// <summary>
    /// Gets or sets the session identifier.
    /// </summary>
    /// <value>
    /// The session identifier.
    /// </value>
    public string SessionId { get; set; }
}
```
