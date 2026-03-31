---
title: ASP.NET Core Data Protection
description: Comprehensive guide covering key aspects of ASP.NET Core Data Protection.
date: 2026-03-26T08:20:20+02:00
sidebar:
  label: Data Protection
  order: 9
redirect_from:
   - /dataprotection/
---

Any Duende server-side application, like IdentityServer or BFF, is developed and deployed as an ASP.NET Core application. While there are a lot of decisions to make, this also means that your implementation can be built, deployed, hosted, and managed with the same technology you're using for any other ASP.NET applications you have. 

It is important to correctly configure ASP.NET Core Data Protection in your application.

:::tip
Some of our most common support requests are related to [Data Protection Keys](#data-protection-keys), so we strongly encourage you to review the rest of this page before deploying to production.
:::

## ASP.NET Core Data Protection

Data Protection in any Duende server-side application makes extensive use of ASP.NET's [data protection](https://docs.microsoft.com/en-us/aspnet/core/security/data-protection/) feature. It is crucial that you configure data protection correctly before you start using your application in production.

In local development, ASP.NET automatically creates data protection keys, but in a deployed environment, you will need
to ensure that your data protection keys are stored in a persistent way and shared across all load balanced instances of
your implementation. This means you'll need to choose where to store and how to protect the data
protection keys, as appropriate for your environment. Microsoft has extensive
documentation [here](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview)
describing how to configure storage and protection of data protection keys.

A typical implementation should include data protection configuration code, like this:

```csharp
// Program.cs
builder.Services.AddDataProtection()
  // Choose an extension method for key persistence, such as 
  // PersistKeysToFileSystem, PersistKeysToDbContext, 
  // PersistKeysToAzureBlobStorage, PersistKeysToAWSSystemsManager, or
  // PersistKeysToStackExchangeRedis
  .PersistKeysToFoo()
  // Choose an extension method for key protection, such as 
  // ProtectKeysWithCertificate, ProtectKeysWithAzureKeyVault
  .ProtectKeysWithBar()
  // Explicitly set an application name to prevent issues with
  // key isolation. 
  .SetApplicationName("My.Duende.IdentityServer");
```

:::danger[Ensure data protection keys are persisted]
Always make sure data protection is configured to persist data protection keys to storage, using `.PersistKeys...()`
for your storage mechanism.

In addition, make sure the storage mechanism itself is durable. For example, if you are using the default file system
based key store, make sure that the configured path is not stored on ephemeral storage. If you are using Redis to store
data protection keys using `PersistKeysToStackExchangeRedis`, ensure that your Redis service is configured to persist
data to a database backup or append-only file. Otherwise, when your Redis instance reboots, you will lose all data
protection keys.

If you lose your data protection keys, all data protected with those keys is no longer be readable.
:::

## ASP.NET Data Protection Keys and IdentityServer Signing Keys

ASP.NET's data protection keys are sometimes confused with IdentityServer's signing keys, but the two are completely
separate keys with different purposes. IdentityServer implementations need both to function correctly.

### ASP.NET Data Protection Keys

Data protection is a cryptographic library that is part of ASP.NET Core. Data protection uses private key
cryptography to encrypt and sign sensitive data to ensure that it is only written and read by the application. The
framework uses data protection to secure data that is commonly used by IdentityServer implementations, such as
authentication cookies and anti-forgery tokens. In addition, IdentityServer itself uses data protection to protect
sensitive data at rest, such as persisted grants, and sensitive data passed through the browser, such as the
context objects passed to pages in the UI. The data protection keys are critical secrets for an IdentityServer
implementation because they encrypt a great deal of sensitive data at rest and prevent sensitive data that is
round-tripped through the browser from being tampered with.

### The IdentityServer Signing Key

Separately, IdentityServer needs cryptographic keys, called [signing keys](/identityserver/fundamentals/key-management.md), to
sign tokens such as JWT access tokens and id tokens. The signing keys use public key cryptography to allow client
applications and APIs to validate token signatures using the public keys, which are published by IdentityServer
through [discovery](/identityserver/reference/endpoints/discovery.md). The private key component of the signing keys are
also critical secrets for IdentityServer because a valid signature provides integrity and non-repudiation guarantees
that allow client applications and APIs to trust those tokens.

## Common Problems

Common data protection problems occur when data is protected with a key that is not available when the data is later
read. A common symptom is `CryptographicException`s in the application logs. For example, when IdentityServer's automatic key
management fails to read its signing keys due to a data protection failure, it will log an error message
such as "Error unprotecting key with kid {Signing Key ID}.", and log the underlying
`System.Security.Cryptography.CryptographicException`, with a message like "The key {Data Protection Key ID} was not
found in the key ring."

Failures to read automatic signing keys are often the first place where a data protection problem manifests, but any of
many places where ASP.NET uses data protection might also throw `CryptographicException`s.

There are several ways that data protection problems can occur:

1. In load balanced environments, every instance of a Duende server-side app needs to be configured to share data protection keys.
   Without shared data protection keys, each load balanced instance will only be able to read the data that it writes.
2. Data protected data could be generated in a development environment and then accidentally included into the build
   output. This is most commonly the case for automatically managed signing keys that are stored on disk. If you are
   using automatic signing key management with the default file system based key store, you should exclude the `~/keys`
   directory from source control and make sure keys are not included in your builds. Note that if you are using our
   Entity Framework based implementation of the operational data stores, then the keys will instead be stored in the
   database.
3. Data protection creates keys isolated by application name. If you don't specify a name, the content root path of the
   application will be used. But, beginning in .NET 6.0 Microsoft changed how they handle the path, which can cause data
   protection keys to break. Their docs on the problem
   are [here](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview#setapplicationname),
   including a work-around where you de-normalize the path. Then, in .NET 7.0, this change was reverted. The solution is
   always to specify an explicit application name, and if you have old keys that were generated without an explicit
   application name, you need to set your application name to match the default behavior that produced the keys you want
   to be able to read.
4. If you host on IIS, special configuration is needed for data protection. In most default
   deployments, IIS lacks the permissions required to persist data protection keys, and falls back to using an ephemeral
   key generated every time the site starts up. Microsoft's docs on this issue
   are [here](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/advanced?view=aspnetcore-7.0#data-protection).

### Identity Server's Usage of Data Protection

Duende IdentityServer's features that rely on data protection include

* protecting signing keys at rest (if [automatic key management](/identityserver/fundamentals/key-management.md#automatic-key-management) is used and enabled)
* protecting [persisted grants](/identityserver/data/operational.md#persisted-grant-service) at rest (if enabled)
* protecting [server-side session](/identityserver/ui/server-side-sessions/index.md) data at rest (if enabled)
* protecting [the state parameter](/identityserver/ui/login/external.md#state-url-length-and-isecuredataformat) for
  external OIDC providers (if enabled)
* protecting message payloads sent between pages in the UI (
  e.g. [logout context](/identityserver/ui/logout/logout-context.md) and [error context](/identityserver/ui/error.md)).
* session management (because the ASP.NET Core cookie authentication handler requires it)
