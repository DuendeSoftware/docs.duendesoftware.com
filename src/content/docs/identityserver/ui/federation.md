---
title: "Federation Gateway"
description: "Guide to implementing federation in IdentityServer, allowing it to act as a gateway that offers multiple external authentication providers while shielding client applications from authentication complexities."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 6
redirect_from:
  - /identityserver/v5/ui/federation/
  - /identityserver/v6/ui/federation/
  - /identityserver/v7/ui/federation/
---

Federation means that your IdentityServer offers authentication methods that use external authentication providers.
When you offer a number of these external authentication methods, often the term *Federation Gateway* is used to describe
this architectural approach.

![Diagram showing the benefits of using a federation gateway](images/federation.svg)

## Benefits Of A Federation Gateway

A federation gateway architecture shields your client applications from the complexities of your authentication
workflows and business requirements that go along with them.

Your clients only need to trust the gateway, and the gateway coordinates all the communication and trust relationships
with the external providers. This might involve switching between different protocols, token types, claim types etc.

You may federate with other enterprise identity systems like Active Directory, Azure AD, or with
commercial providers like Google, GitHub, or LinkedIn. Federation can bridge protocols, and use OpenID Connect (OIDC),
OAuth 2, SAML, WS-Federation, or any other protocol.

Also, the gateway can make sure that all claims and identities that ultimately arrive at the client applications are
trustworthy and in a format that the client expects.

## Multiple Authentication Methods For Users

With a federation gateway, you can offer your users flexible sign-in options based on their context or preference:

* **Consumer applications**: Username/password or commercial providers like Google or Microsoft Account
* **Hybrid applications**: Username/password or commercial providers for customers, and Active Directory or Azure AD for employees

## Integration Of On-premise Products With Customer Identity Systems

When building on-premise products, you have to integrate with a multitude of customer authentication systems.
Maintaining variations of your business software for each product you have to integrate with, makes your software hard
to maintain.

With a federation gateway, you only need to adapt to these external systems at the gateway level, all of your business
applications are shielded from the technical details.

## Software-as-a-Service (SaaS)

Federation is a common requirement in SaaS scenarios. It allows your customers' users to access your applications with
single sign-on, using their existing corporate credentials without explicitly creating new accounts in your identity system.

## Support For External Authentication Methods

IdentityServer leverages the ASP.NET Core authentication infrastructure for communicating with external providers. This
means any authentication system supported by ASP.NET Core can be used with IdentityServer, including:

* Commercial providers like Google, GitHub, and LinkedIn ([and many more](https://github.com/aspnet-contrib/AspNet.Security.OAuth.Providers))
* OpenID Connect providers
* SAML 2.0 systems
* WS-Federation systems

See the [Integrating with External Providers](/identityserver/ui/login/external.md) section for more details.

## Home Realm Discovery

Home Realm Discovery (HRD) is the process of selecting the most appropriate authentication workflow for a user,
especially when multiple authentication methods are available.

Since users are typically anonymous when they arrive at the federation gateway, you need some sort of hint to optimize
the login workflow. Such hint can come in many forms:

* You present a list of available authentication methods to the user. This works for simpler scenarios, but
  probably not if you have a lot of choices or if this would reveal your customers' authentication systems.
* You ask the user for an identifier, such as their email address. Based on that, you infer the external authentication
  method . This is a common technique for SaaS systems.
* The client application can give a hint to the gateway via a custom protocol parameter of IdentityServer's built-in
  support for the `idp` parameter on `acr_values`. In some cases, the client already knows the appropriate authentication
  method. For example, when your customers access your software via a customer-specific URL
  (see [here](/identityserver/reference/endpoints/authorize.md#optional-parameters)), you can present a subset of
  available authentication methods to the user, or even redirect to a single option.
* You restrict the available authentication methods per client in the client configuration using the
  `IdentityProviderRestrictions` property (see [here](/identityserver/reference/models/client.md#authentication--session-management)).

Every system has unique requirements. Always start by designing the desired user experience, then select and combine
the appropriate HRD strategies to implement your required flow.