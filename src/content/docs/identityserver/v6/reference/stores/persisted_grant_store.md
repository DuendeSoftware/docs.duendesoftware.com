---
title: "Persisted Grant Store"
order: 42
---

The *IPersistedGrantStore* interface is the contract for a service that stores,
retrieves, and deletes _persisted grants_. A _grant_ is a somewhat abstract
concept that is used in various protocol flows and represents that a resource
owner has given authorization of some kind. Grants that require server side
state in IdentityServer are the _persisted grants_ stored by the
*IPersistedGrantStore*. 

The *IPersistedGrantStore* is abstracted to allow for storage of several grant
types, including authorization codes, refresh tokens, user consent, and
reference tokens. Some specialized grant types, including device flow and CIBA,
use their own specialized stores instead.

IdentityServer includes two implementations of the *IPersistedGrantStore*. The
*InMemoryPersistedGrantStore* unsurprisingly persists grants in memory and is
intended for demos, tests, and other situations where persistent storage is not
actually necessary. In contrast, the
*Duende.IdentityServer.EntityFramework.Stores.PersistedGrantStore* durably
persists grants to a database using EntityFramework, and can be used with any
database with an EF provider.

You can also provide your own implementation of the *IPersistedGrantStore*. This
allows for complete control of the data access code so that you can support
other data stores that lack an EF provider, and so that you can optimize the
data access for your environment and usage.

### Duende.IdentityServer.Stores.IPersistedGrantStore

#### Members
| name                                                                        | description                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Task StoreAsync(PersistedGrant grant);                                      | Stores a grant.                                               |
| Task<PersistedGrant> GetAsync(string key);                                  | Retrieves a grant by its key.                                 |
| Task<IEnumerable<PersistedGrant>> GetAllAsync(PersistedGrantFilter filter); | Retrieves all grants that fulfill the conditions of a filter. |
| Task RemoveAsync(string key);                                               | Removes a grant by key.                                       |
| Task RemoveAllAsync(PersistedGrantFilter filter);                           | Removes all grants that fulfill the conditions of a filter.   |


### Duende.IdentityServer.Models.PersistedGrant

#### Members

| name                   | description                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| string Key             | A string that uniquely identifies the grant.                                                                                 |
| string Type            | A string that specifies the type of grant. The possible values are constants in the *PersistedGrantTypes* class (see below). |
| string SubjectId       | The identifier of the subject that granted authorization.                                                                    |
| string SessionId       | The identifier of the session where the grant was made, if applicable.                                                       |
| string ClientId        | The identifier of the client that was granted authorization.                                                                 |
| string Description     | The description the user assigned to the device being authorized.                                                            |
| DateTime CreationTime  | The time that the grant was created.                                                                                             |
| DateTime? Expiration   | The time that the grant expires.                                                                                             |
| DateTime? ConsumedTime | The time that the grant was consumed.                                                                                        |
| string Data            | A serialized and data protected representation of the grant.                                                                 |

#### Key Property
The *Key* property contains a SHA256 hash of the value used to refer to
individual grants. For authorization codes, refresh tokens, and reference
tokens, the stored *Key* hashes the actual value sent to the client as part of
the protocol flow. For example, refresh token records use a hash of the actual
refresh token parameter sent to the client as their *Key*. In contrast, user
consent is not identified by a single protocol parameter. Instead, the *Key*
value for user consent records comes from a hash of a combination of subject id
and client id. In all cases, the value that is hashed to compute the *Key* also
includes the grant type.

Beginning in *v6.0*, the hashes that IdentityServer passes to the
*IPersistedGrantStore* to use as *Key* values are formatted as hex values. In
earlier versions, the *Keys* were base-64 encoded. That occasionally caused
database collation issues in case-insensitive databases, which prompted the
change to hex encoding. To facilitate migration, IdentityServer adds a version
suffix ("-1") to indicate that the newer hex encoding should be used during
hashing. For example, the refresh token parameter
"27931A10FBCA75583C5576DAFB5DBDF0A9BCA8D6BD38B7CF142C47D6E44ED24D-1" ends in the
"-1" suffix, so when IdentityServer searches for its persisted grant record, it
computes the hash of the parameter value, applies hex encoding, and then calls
*IPersistedGrantStore.GetAsync(...)*, passing the resulting hex encoded value. A
refresh token created before *v6.0* would not include the "-1" suffix, so
IdentityServer would instead pass a base-64 encoded hash to the *GetAsync*
method.

However, consent records were not migrated to use hex encoding of their *Key*
values until IdentityServer *v7.0*. Since there's no protocol parameter that
corresponds to consent records, there's no way to use the protocol parameters to
determine which encoding to use. So, prior to *v7.0*, the consent *Key* values
remained in the base-64 encoding.

Beginning in *v7.0*, IdentityServer uses hex encoding for Consent *Key* values,
but falls back to base-64 encoding when hex encoding fails to find a grant. In
that case, IdentityServer will automatically update the grant to use a hex
encoded *Key*.

#### Data Property

The *Data* property contains information that is specific to the grant type. For
example, consent records contain the scopes that the user consented to grant
to the client.  

The *Data* property also contains a copy of the *SubjectId*, *SessionId*,
*ClientId*, *Description*, *CreationTime*, and *Expiration* properties when
those properties are applicable to the grant type. The copy in the *Data* is
treated as authoritative by IdentityServer, in the sense that the copy is used
when grants are retrieved from the store. The other properties exist to enable
querying the grants and/or for informational purposes and should be treated as
read-only. 
 
By default, the *Data* property is encrypted at rest using the ASP.NET Data
Protection API. The [*DataProtectData* option](/identityserver/v6/reference/options#persistentgrants) can be used to disable this
encryption.

#### Time Stamps

All grants set their *CreationTime* when they are created as a UTC timestamp.

Grants that expire set their *Expiration* when they are created as well. Consent
records only expire if the *ConsentLifetime* property of the *Client* is set. By
default, *ConsentLifetime* is not set and consent lasts until it is revoked.
Authorization code records always include an *Expiration*. They expire after the
[*AuthorizationCodeLifetime*](/identityserver/v6/reference/models/client#token) has
elapsed, so they are initialized with their *Expiration* set that far into the
future. Reference token records expire in the same way, with their *Expiration*
controlled by the [*AccessTokenLifetime*](/identityserver/v6/reference/models/client#token). Refresh token records also always include
*Expiration*, controlled by the *AbsoluteRefreshTokenLifetime* and
*SlidingRefreshTokenLifetime* [client settings](/identityserver/v6/tokens/refresh#sliding-expiration). Custom grant records should set the
*Expiration* to indicate that they are only usable for a length of time, or not
set it to indicate that they can be used indefinitely.

Some grants can set a *ConsumedTime* when they are used. This applies to grants
that are intended to be used once and that need to be retained after their use
for some purpose (for example, replay detection or to allow certain kinds of
limited reuse). Refresh tokens can be [configured](/identityserver/v6/tokens/refresh#sliding) to have one-time use semantics. Refresh tokens
that are configured this way set a *ConsumedTime* when they are used.
Authorization codes do not set a *ConsumedTime*. They are instead always removed
on use. *ConsumedTime* is not applicable to reference tokens and consent, so
they both never set it. Custom grant records should set the *ConsumedTime* if
one-time use semantics are appropriate for the grant. 

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
        /// Client ids the grant was issued to.
        /// </summary>
        public IEnumerable<string> ClientIds { get; set; }

        /// <summary>
        /// The type of grant.
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// The types of grants.
        /// </summary>
        public IEnumerable<string> Types { get; set; }
    }
```

#### PersistedGrantTypes

The types of persisted grants are defined by the *IdentityServerConstants.PersistedGrantTypes* constants:

```cs
    public static class PersistedGrantTypes
    {
        public const string AuthorizationCode = "authorization_code";
        public const string BackChannelAuthenticationRequest = "ciba";
        public const string ReferenceToken = "reference_token";
        public const string RefreshToken = "refresh_token";
        public const string UserConsent = "user_consent";
        public const string DeviceCode = "device_code";
        public const string UserCode = "user_code";
    }
```
