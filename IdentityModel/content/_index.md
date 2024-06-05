+++
title = "Welcome to IdentityModel"
weight = 10
chapter = true
+++


Welcome to IdentityModel
========================

IdentityModel is a family of open source libraries for building OAuth 2.0 and OpenID
Connect clients. Development of the IdentityModel libraries is sponsored by [Duende
Software](https://duendesoftware.com/).

## IdentityModel

The IdentityModel package is the base library for OIDC and OAuth 2.0 related protocol
operations. It provides an object model to interact with the endpoints defined in the
various OAuth and OpenId Connect specifications in the form of types to represent the
requests and responses, extension methods to invoke requests constants defined in the
specifications, such as standard scope, claim, and parameter names, and other convenience
methods for performing common identity related operations

IdentityModel targets .NET Standard 2.0, making it suitable for .NET and .NET Framework.

- GitHub: <https://github.com/IdentityModel/IdentityModel>
- NuGet: <https://www.nuget.org/packages/IdentityModel/>
<!-- - CI builds <https://github.com/orgs/IdentityModel/packages> -->

The following libraries build on top of IdentityModel, and provide
specific implementations for different applications:

## IdentityModel.OidcClient

IdentityModel.OidcClient is an OpenID Connect (OIDC) client library for native
applications in .NET. It is a certified OIDC relying party and implements [RFC
8252](https://datatracker.ietf.org/doc/html/rfc8252/), "OAuth 2.0 for native
Applications". It provides types that describe OIDC requests and responses, low level
methods to construct protocol state and handle responses, and higher level methods for
logging in, logging out, retrieving userinfo, and refreshing tokens.

- GitHub: <https://github.com/IdentityModel/IdentityModel.OidcClient>
- NuGet: <https://www.nuget.org/packages/IdentityModel.OidcClient>
<!-- -   CI builds <https://github.com/orgs/IdentityModel/packages> -->

## IdentityModel.AspNetCore.OAuth2Introspection

OAuth 2.0 token introspection authentication handler for ASP.NET Core.

- GitHub <https://github.com/IdentityModel/IdentityModel.AspNetCore.OAuth2Introspection>
- NuGet <https://www.nuget.org/packages/IdentityModel.AspNetCore.OAuth2Introspection/>
<!-- - CI builds <https://github.com/orgs/IdentityModel/packages> -->
