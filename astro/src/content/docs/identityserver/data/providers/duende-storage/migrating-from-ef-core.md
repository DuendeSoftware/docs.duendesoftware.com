---
title: "Migrate from Entity Framework Core"
description: "Plan a safe migration of IdentityServer configuration and operational data from Entity Framework Core to Duende Storage"
date: 2026-09-02
sidebar:
  label: "Migrate from EF Core"
  order: 50
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

Duende Storage and the Entity Framework Core provider use different schemas and persistence models. There is no automated
or in-place migration between them. Treat the change as a data transfer and application cutover and rehearse it against a
production-like copy of your data before changing a live system.

Configuration and operational data need different migration strategies.

## Migrate Configuration Data

Configuration data includes clients, API scopes, API resources, identity resources, dynamic identity providers, SAML
service providers and CORS origins.

1. Back up the Entity Framework Core database and record the current IdentityServer and package versions.
2. [Deploy the Duende Storage database schema](/identityserver/data/providers/duende-storage/configuration-storage.md#deploy-the-database-schema) with a separate
   connection string or schema.
3. Export configuration through the Entity Framework Core contexts and map it to the models accepted by the
   [configuration admin APIs](/identityserver/data/providers/duende-storage/admin-apis.md).
4. Import API scopes and identity resources before API resources and clients that reference them.
5. Compare business identifiers, relationships and counts between both stores.
6. Stop configuration writes, perform a final import and switch the IdentityServer registration to
   `AddConfigurationStorage()`.

:::caution[Plan Secret Rotation]
Entity Framework Core stores client and API resource secrets as one-way hashes. The Duende Storage admin APIs accept
plaintext values and hash them before storage, so do not import an existing hash as though it were a plaintext secret.
Provision the original secret from a secure source when it is available or rotate the secret during migration.

Dynamic identity-provider secrets are recoverable configuration values. Transfer them only through a protected migration
process and apply the
[configuration data protection guidance](/identityserver/data/providers/duende-storage/configuration-storage.md#protect-configuration-data).
:::

Use the administration APIs rather than writing Duende Storage records directly. They apply validation, relationship
checks, secret handling and optimistic concurrency expected by the runtime stores.

## Decide How to Handle Operational Data

Operational data includes persisted grants, authorization and device codes, reference and refresh tokens, server-side
sessions, pushed authorization requests, signing keys and SAML request state. Duende does not provide a supported transfer
tool for this state.

The lowest-risk approach is usually a controlled reset:

1. Stop issuing new protocol state and allow short-lived flows such as authorization codes to finish.
2. Schedule a maintenance window and stop all IdentityServer instances that use the Entity Framework Core operational
   store.
3. Start Duende Storage with an empty operational pool.
4. Expect reference tokens, refresh tokens, device flows and server-side sessions from the old store to stop working.
   Users and clients must authenticate again.

JWT access tokens do not depend on a persisted grant record for normal validation, but their validity still depends on
issuer, audience, lifetime and signing-key continuity. Plan signing-key migration or rollover separately so APIs can
validate tokens issued before the cutover. Do not remove old validation keys until every token signed with them has
expired.

If preserving active operational state is mandatory, design and test a custom migration with Duende support before
cutover. Do not copy relational rows directly: serialized payloads, protection keys, versions, identifiers and expiration
semantics differ between providers.

## Cut Over and Retain a Rollback Path

Keep the Entity Framework Core database read-only after the final export. Deploy the new store registration, verify the
discovery document and exercise each enabled flow before reopening traffic. Monitor validation errors, failed refreshes,
session behavior and signing-key publication.

Retain the backup and a documented rollback window until the new deployment is accepted. Do not write to both providers
unless you have designed a supported dual-write strategy; the built-in providers do not synchronize changes.
