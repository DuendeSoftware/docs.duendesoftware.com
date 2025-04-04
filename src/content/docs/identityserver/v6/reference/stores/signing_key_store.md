---
title: "Signing Key Store"
order: 90
---

#### Duende.IdentityServer.Stores.ISigningKeyStore

Used to dynamically load client configuration.

```cs
    /// <summary>
    /// Interface to model storage of serialized keys.
    /// </summary>
    public interface ISigningKeyStore
    {
        /// <summary>
        /// Returns all the keys in storage.
        /// </summary>
        /// <returns></returns>
        Task<IEnumerable<SerializedKey>> LoadKeysAsync();

        /// <summary>
        /// Persists new key in storage.
        /// </summary>
        /// <param name="key"></param>
        /// <returns></returns>
        Task StoreKeyAsync(SerializedKey key);

        /// <summary>
        /// Deletes key from storage.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        Task DeleteKeyAsync(string id);
    }
```

#### SerializedKey

```cs
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
The *Data* property contains a copy of all the values (and more) and is considered authoritative by IdentityServer, thus most of the other property values are considered informational and read-only.
:::
