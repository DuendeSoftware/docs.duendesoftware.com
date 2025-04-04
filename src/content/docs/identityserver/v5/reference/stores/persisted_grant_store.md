---
title: "Persisted Grant Store"
order: 42
---

#### Duende.IdentityServer.Stores.IPersistedGrantStore

Models storage of persisted grants.

```cs
    /// <summary>
    /// Interface for persisting any type of grant.
    /// </summary>
    public interface IPersistedGrantStore
    {
        /// <summary>
        /// Stores the grant.
        /// </summary>
        /// <param name="grant">The grant.</param>
        /// <returns></returns>
        Task StoreAsync(PersistedGrant grant);

        /// <summary>
        /// Gets the grant.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <returns></returns>
        Task<PersistedGrant> GetAsync(string key);

        /// <summary>
        /// Gets all grants based on the filter.
        /// </summary>
        /// <param name="filter">The filter.</param>
        /// <returns></returns>
        Task<IEnumerable<PersistedGrant>> GetAllAsync(PersistedGrantFilter filter);

        /// <summary>
        /// Removes the grant by key.
        /// </summary>
        /// <param name="key">The key.</param>
        /// <returns></returns>
        Task RemoveAsync(string key);

        /// <summary>
        /// Removes all grants based on the filter.
        /// </summary>
        /// <param name="filter">The filter.</param>
        /// <returns></returns>
        Task RemoveAllAsync(PersistedGrantFilter filter);
    }
```

#### PersistedGrant

Models persistence of authorization codes, reference and refresh tokens, and user consents.

```cs
    /// <summary>
    /// A model for a persisted grant
    /// </summary>
    public class PersistedGrant
    {
        /// <summary>
        /// Gets or sets the key.
        /// </summary>
        /// <value>
        /// The key.
        /// </value>
        public string Key { get; set; }

        /// <summary>
        /// Gets the type.
        /// </summary>
        /// <value>
        /// The type.
        /// </value>
        public string Type { get; set; }

        /// <summary>
        /// Gets the subject identifier.
        /// </summary>
        /// <value>
        /// The subject identifier.
        /// </value>
        public string SubjectId { get; set; }

        /// <summary>
        /// Gets the session identifier.
        /// </summary>
        /// <value>
        /// The session identifier.
        /// </value>
        public string SessionId { get; set; }
        
        /// <summary>
        /// Gets the client identifier.
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
        /// Gets or sets the creation time.
        /// </summary>
        /// <value>
        /// The creation time.
        /// </value>
        public DateTime CreationTime { get; set; }

        /// <summary>
        /// Gets or sets the expiration.
        /// </summary>
        /// <value>
        /// The expiration.
        /// </value>
        public DateTime? Expiration { get; set; }
        
        /// <summary>
        /// Gets or sets the consumed time.
        /// </summary>
        /// <value>
        /// The consumed time.
        /// </value>
        public DateTime? ConsumedTime { get; set; }

        /// <summary>
        /// Gets or sets the data.
        /// </summary>
        /// <value>
        /// The data.
        /// </value>
        public string Data { get; set; }
    }
```

:::note
The *Data* property contains a copy of all the values (and more) and is considered authoritative by IdentityServer, thus most of the other property values are considered informational and read-only.
:::


#### PersistedGrantFilter

```cs
    /// <summary>
    /// Represents a filter used when accessing the persisted grants store. 
    /// Setting multiple properties is interpreted as a logical 'AND' to further filter the query.
    /// At least one value must be supplied.
    /// </summary>
    public class PersistedGrantFilter
    {
        /// <summary>
        /// Subject id of the user.
        /// </summary>
        public string SubjectId { get; set; }
        
        /// <summary>
        /// Session id used for the grant.
        /// </summary>
        public string SessionId { get; set; }
        
        /// <summary>
        /// Client id the grant was issued to.
        /// </summary>
        public string ClientId { get; set; }
        
        /// <summary>
        /// The type of grant.
        /// </summary>
        public string Type { get; set; }
    }
```