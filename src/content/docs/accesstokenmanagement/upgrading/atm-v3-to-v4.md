---
title: "Duende AccessTokenManagement v3.x to v4.0"
description: Guide for upgrading Duende.AccessTokenManagement from version 3.x to version 4.0, including migration steps for custom implementations and breaking changes.
sidebar:
  label: v3.x → v4.0
  order: 100
---

## Changes

### Moving Towards HybridCache Implementation And Away from Distributed Cache

Microsoft has recently released [HybridCache](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid). While this is only released as a .NET 9 assembly, these assemblies work fine in .NET 8. So, while we still support .NET 8 with ATM 4.0, we are moving towards using HybridCache.

HybridCache brings significant improvements for us. Because of the two-layered cache, we've found it significantly improves performance.  
If you currently use a distributed cache, this should still work seamlessly.

If you wish to encrypt access tokens, you can do so by implementing a custom serializer. Documentation on this will follow later.

We have added support for using a custom HybridCache instance via keyed services.

### Complete Internal Refactoring

The library has undergone extensive internal changes—so much so that it can be considered a new implementation under the same conceptual umbrella. Despite this, the public API surface remains mostly compatible with earlier versions.

* New extensibility model (see below).
* All async methods now support cancellation tokens.
* Renaming of certain classes and interfaces (see below).
* Implementation logic is now internal.

#### Reduced Public API Surface

All internal implementation details are now marked as internal, reducing accidental coupling and clarifying the intended extension points. In V3, all classes were public and most public methods were marked as virtual. This meant you could override any class by inheriting from it and overriding a single method.

While this was very convenient for our consumers, it made it challenging to introduce changes to the library without making breaking changes.

We still want to ensure our users' extensibility needs are met, but via more controlled mechanisms.
If you find that you have an extensibility need not covered by the new model, please raise a discussion [in our discussion board](https://duende.link/community).
If this is a scenario we want to support, we'll do our best to accommodate it.

### Explicit Extension Model

Instead of relying on implicit behaviors or inheritance, V4 introduces clearly defined extension points, making it easier to customize behavior without relying on internal details.

### Composition Over Inheritance

The `AccessTokenHandler` has been restructured to use composition rather than inheritance, simplifying the customization of token handling and increasing testability.

If you wish to implement a custom access token handling process, for example to implement token exchange, you can now [implement your own `AccessTokenRequestHandler.ITokenRetriever`](/accesstokenmanagement/advanced/extensibility.md#token-retrieval).

### Strongly Typed Configuration

Configuration is now represented by strongly typed objects, improving validation, discoverability, and IDE support.

This means that where before you could assign strings to the configuration system, you'll now have to explicitly parse the string values.

For example:

```csharp
var scheme = Scheme.Parse("oidc");
```

### Renamed classes

Several classes have been renamed, either to clarify their usage or to drop the `service` suffix, which only adds noise:

* `AccessTokenHandler` is now `AccessTokenRequestHandler`
* `ClientCredentialsTokenManagementService` is now `IClientIClientCredentialsTokenManager`
* `IClientCredentialsTokenEndpointService` is now `IClientCredentialsTokenEndpoint`
* `IUserTokenManagementService` is now `IUserTokenManager`
* `ITokenRequestSynchronization` is now `IUserTokenRequestConcurrencyControl`
* `IUserTokenEndpointService` is now `IUserTokenEndpoint`