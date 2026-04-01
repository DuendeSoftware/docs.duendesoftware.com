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
Some of our most common support requests are related to [Data Protection Keys](#data-protection-keys). We strongly encourage you to review the rest of this page before deploying to production.
:::

## About ASP.NET Core Data Protection

Duende's SDKs, like IdentityServer and BFF, make extensive use of ASP.NET's [data protection](https://docs.microsoft.com/en-us/aspnet/core/security/data-protection/) feature. It is crucial that you configure data protection correctly when deploying your application in production.

## Data Protection Keys

In local development, ASP.NET automatically creates data protection keys, but in a deployed environment, you will need
to ensure that your data protection keys are stored in a persistent way and shared across all load balanced instances of
your implementation. This means you'll need to choose where to store and how to protect the data
protection keys, as appropriate for your environment. Microsoft has [extensive
documentation on data protection](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview)
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
Always make sure data protection is configured to persist data protection keys to storage, using `.PersistKeysTo...()`
for your storage mechanism. If you lose your data protection keys, all data protected with those keys is no longer be readable.

Additionally, ensure the storage mechanism itself is durable. For example, if you are using the default file system
based key store, make sure that the configured path is not stored on ephemeral storage. If you are using Redis to store
data protection keys using `PersistKeysToStackExchangeRedis()`, ensure that your Redis service is configured to persist
data to a database backup or append-only file. Otherwise, you will lose all data protection keys when your Redis instance reboots.

For a more advanced setup, you can create a [key escrow sink](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/extensibility/key-management?view=aspnetcore-10.0#xmlkeymanager), allowing you to store new data protection keys into 
a secure storage (e.g., Azure Key Vault) before the new keys are encrypted.
This enables you to restore existing data protection keys in case they become corrupted or lost.
:::

## Common Problems

Common data protection problems occur when data is protected with a key that is not available when the data is later
read. A common symptom is `CryptographicException`s in the application logs. For example, when IdentityServer's automatic key
management fails to read its signing keys due to a data protection failure, it will log an error message
such as `"Error unprotecting key with kid {Signing Key ID}."`, and log the underlying
`System.Security.Cryptography.CryptographicException`, with a message like `"The key {Data Protection Key ID} was not
found in the key ring."`

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
3. Data protection derives keys isolated per application name from the generated key material. If you don't specify a name, 
   the content root path of the application will be used. In .NET 6.0, Microsoft introduced a breaking change: they changed
   how ASP.NET Core sets the content root path, which can cause Data Protection issues. This change was reverted in .NET 7.0, 
   and Microsoft has [documented a workaround in case your application has to restore the correct application name](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview#set-the-application-name-setapplicationname). 
   A better solution is to always specify an explicit application name, but know that changing the application name will 
   cause all existing data protected with the previous application name to become unreadable.
4. When hosting your web application on Microsoft IIS, [special configuration may be required for data protection](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/advanced#data-protection).
   In most default deployments, IIS falls back to using an ephemeral storage for data protection keys, which means that 
   new keys are generated every time the application pool restarts. We recommend storing data protection keys in a shared location, 
   such as a protected file share or database, and configuring IIS to use that location for data protection.

