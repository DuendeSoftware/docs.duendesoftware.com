---
title: "Grants"
weight: 30
---

Many protocol flows produce state that represents a grant of one type or another.
These include authorization and device codes, reference and refresh tokens, and remembered user consent.

## Stores

The persistence for grants is abstracted behind two interfaces:
* The [persisted grant store]({{<ref "/reference/persisted_grant_store">}}) is a common store for most grants.
* The [device flow store]({{<ref "/reference/device_flow_store">}}) is a specialized store for device grants.

## Grant Consumption
Some grant types are one-time use only (either by definition or configuration).

Once they are "used", rather than deleting the record, the *ConsumedTime* value is set in the database marking them as having been used.
This "soft delete" allows for custom implementations to either have flexibility in allowing a grant to be re-used (typically within a short window of time),
or to be used in risk assessment and threat mitigation scenarios (where suspicious activity is detected) to revoke access.
For refresh tokens, this sort of custom logic would be performed in the *IRefreshTokenService*.

The presence of the record in the store without a *ConsumedTime* and while still within the *Expiration* represents the validity of the grant.
Setting either of these two values, or removing the record from the store effectively revokes the grant.

## Persisted Grant Service
Working with the grants store directly might be too low level. 
As such, a higher level service called the [IPersistedGrantService]({{<ref "/reference/persisted_grant_service">}}) is provided.
It abstracts and aggregates the different grant types into one concept, and allows querying and revoking the persisted grants for a user.

