---
title: "Signing Key Store"
description: Documentation for the ISigningKeyStore interface which manages the storage, retrieval, and deletion of cryptographic keys used for signing tokens.
sidebar:
  label: Signing Key
  order: 90
redirect_from:
  - /identityserver/v7/reference/stores/signing_key_store/
---

#### Duende.IdentityServer.Stores.ISigningKeyStore

Used to dynamically load client configuration.

```csharp
/// <summary>
/// Interface to model storage of serialized keys.
/// </summary>
public interface ISigningKeyStore
{
    /// <summary>
    /// Returns all the keys in storage.
    /// </summary>
    /// <param name="ct">The cancellation token.</param>
    /// <returns></returns>
    Task<IEnumerable<SerializedKey>> LoadKeysAsync(CancellationToken ct);

    /// <summary>
    /// Persists new key in storage.
    /// </summary>
    /// <param name="key"></param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns></returns>
    Task StoreKeyAsync(SerializedKey key, CancellationToken ct);

    /// <summary>
    /// Deletes key from storage.
    /// </summary>
    /// <param name="id"></param>
    /// <param name="ct">The cancellation token.</param>
    /// <returns></returns>
    Task DeleteKeyAsync(string id, CancellationToken ct);
}
```

#### SerializedKey

```csharp
/// <summary>
/// Serialized key.
/// </summary>
public class SerializedKey
{
    /// <summary>
    /// Version number of serialized key.
    /// </summary>
    public int Version { get; set; }

    /// <summary>
    /// Key identifier.
    /// </summary>
    public string Id { get; set; }

    /// <summary>
    /// Date key was created.
    /// </summary>
    public DateTime Created { get; set; }

    /// <summary>
    /// The algorithm.
    /// </summary>
    public string Algorithm { get; set; }

    /// <summary>
    /// Contains X509 certificate.
    /// </summary>
    public bool IsX509Certificate { get; set; }

    /// <summary>
    /// Serialized data for key.
    /// </summary>
    public string Data { get; set; }

    /// <summary>
    /// Indicates if data is protected.
    /// </summary>
    public bool DataProtected { get; set; }
}
```

:::note
The `Data` property contains a copy of all the values (and more) and is considered authoritative by IdentityServer,
thus most of the other property values are considered informational and read-only.
:::
