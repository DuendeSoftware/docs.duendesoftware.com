---
title: "Terminology"
date: 2020-09-10T08:22:12+02:00
weight: 2
---

The specs, documentation and object model use a certain terminology that you should be aware of.

![](../images/terminology.png)

### Duende IdentityServer
Duende IdentityServer is an OpenID Connect & OAuth engine - it implements the OpenID Connect and OAuth 2.0 family of [protocols]({{< ref "specs" >}}).

Different literature uses different terms for the same role - you probably also find the terms security token service,
identity provider, authorization server, IP-STS and more.

But they are in a nutshell all the same: a piece of software that issues security tokens to clients.

A typical implementation of Duende IdentityServer has a number of jobs and features - including:

* manage access to resources
* authenticate users using a local account store or via an external identity provider
* provide session management and single sign-on
* manage and authenticate clients
* issue identity and access tokens to clients

### User
A user is a human that is using a registered client to access resources.

### Client
A [client]({{< ref "/fundamentals/clients" >}}) is a piece of software that requests tokens from your IdentityServer - either for authenticating a user (requesting an identity token) or for accessing a resource (requesting an access token). A client must be first registered with your IdentityServer before it can request tokens.

Examples for clients are web applications, native mobile or desktop applications, SPAs, server processes etc.

### Resources
[Resources]({{< ref "/fundamentals/resources" >}}) are something you want to protect with your IdentityServer - either identity data of your users, or APIs. 

Every resource has a unique name - and clients use this name to specify to which resources they want to get access to.

**Identity data** Identity information (aka claims) about a user, e.g. name or email address.

**APIs** APIs resources represent functionality a client wants to invoke - typically modelled as Web APIs, but not necessarily.

### Identity Token
An identity token represents the outcome of an authentication process. It contains at a bare minimum an identifier for the user 
(called the `sub` aka subject claim) and information about how and when the user authenticated.  It can contain additional identity data.

### Access Token
An access token allows access to an API resource. Clients request access tokens and forward them to the API. 
Access tokens contain information about the client and the user (if present).
APIs use that information to authorize access to their data and functionality.