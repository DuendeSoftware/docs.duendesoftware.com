---
title: Duende Open Source
sidebar:
  order: 10
---



Welcome to Duende Open Source
========================

Duende Software sponsors a series of free open source libraries under the Apache 2 license.

These libraries help with building OAuth 2.0 and OpenID Connect clients. 

## [Duende.AccessTokenManagement](AccessTokenManagement)

A set of .NET libraries that manage OAuth and OpenId Connect access tokens. These tools automatically acquire new tokens when old tokens are about to expire, provide conveniences for using the current token with HTTP clients, and can revoke tokens that are no longer needed.

The latest version of Duende.AccessTokenManagement targets .NET 8 and is available on [GitHub](https://github.com/DuendeSoftware/foss/tree/main/access-token-management) and [NuGet](https://www.nuget.org/packages/Duende.AccessTokenManagement).

## [Duende.IdentityModel](IdentityModel)

The Duende.IdentityModel package is the base library for OIDC and OAuth 2.0 related protocol
operations. It provides an object model to interact with the endpoints defined in the
various OAuth and OpenId Connect specifications in the form of types to represent the
requests and responses, extension methods to invoke requests constants defined in the
specifications, such as standard scope, claim, and parameter names, and other convenience
methods for performing common identity related operations.

Duende.IdentityModel targets .NET Standard 2.0, making it suitable for .NET and .NET Framework and is available on [GitHub](https://github.com/DuendeSoftware/foss/tree/main/identity-model) and [NuGet](https://www.nuget.org/packages/IdentityModel).

## [Duende.IdentityModel.OidcClient](IdentityModel.OidcClient)

Duende.IdentityModel.OidcClient is an OpenID Connect (OIDC) client library for mobile and native
applications in .NET. It is a certified OIDC relying party and implements [RFC
8252](https://datatracker.ietf.org/doc/html/rfc8252/), "OAuth 2.0 for native
Applications". It provides types that describe OIDC requests and responses, low level
methods to construct protocol state and handle responses, and higher level methods for
logging in, logging out, retrieving userinfo, and refreshing tokens.

Duende.IdentityModel.OidcClient targets .NET Standard 2.0, making it suitable for .NET and .NET Framework and is available on [GitHub](https://github.com/DuendeSoftware/foss/tree/main/identity-model-oidc-client) and [NuGet](https://www.nuget.org/packages/IdentityModel.OidcClient).
