---
title: "Persisted Grant Service"
description: Documentation for the IPersistedGrantService interface which provides access to a user's grants for managing consent and authorization data.
sidebar:
  label: Persisted Grant
  order: 43
redirect_from:
  - /identityserver/v5/reference/services/persisted_grant_service/
  - /identityserver/v6/reference/services/persisted_grant_service/
  - /identityserver/v7/reference/services/persisted_grant_service/
---

#### Duende.IdentityServer.Services.IPersistedGrantService

Provides access to a user's grants.

```cs
    /// <summary>
    /// Implements persisted grant logic
    /// </summary>
    public interface IPersistedGrantService
    {
        /// <summary>
        /// Gets all grants for a given subject ID.
        /// </summary>
        /// <param name="subjectId">The subject identifier.</param>
        /// <returns></returns>
        Task<IEnumerable<Grant>> GetAllGrantsAsync(string subjectId);

        /// <summary>
        /// Removes all grants for a given subject id, and optionally client id and session id combination.
        /// </summary>
        /// <param name="subjectId">The subject identifier.</param>
        /// <param name="clientId">The client identifier (optional).</param>
        /// <param name="sessionId">The session id (optional).</param>
        /// <returns></returns>
        Task RemoveAllGrantsAsync(string subjectId, string clientId = null, string sessionId = null);
    }
```

### Grant

```cs
    /// <summary>
    /// Models a grant the user has given.
    /// </summary>
    public class Grant
    {
        /// <summary>
        /// Gets or sets the subject identifier.
        /// </summary>
        /// <value>
        /// The subject identifier.
        /// </value>
        public string SubjectId { get; set; }

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
        /// Gets or sets the scopes.
        /// </summary>
        /// <value>
        /// The scopes.
        /// </value>
        public IEnumerable<string> Scopes { get; set; }

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
    }
```
