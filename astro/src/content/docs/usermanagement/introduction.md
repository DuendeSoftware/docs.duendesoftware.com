---
title: Introduction to User Management
description: An overview of Duende User Management, an opinionated enterprise-grade identity solution supporting OTP, TOTP, passkeys, external authentication, passwords, recovery codes, user profiles, roles, groups, and membership management.
date: 2026-04-29
sidebar:
  label: Introduction
  order: 2
---

Duende User Management is a first-party, embeddable .NET SDK that provides native user storage, authentication, and lifecycle management. It delivers a modern, extensible, enterprise-grade user store with a passwordless-first approach, supporting one-time passwords (OTP), time-based one-time passwords (TOTP), passkeys, external authentication providers, and traditional username/password authentication. Recovery codes, user profiles, roles, groups, and membership management are all included, so you can ship secure, modern authentication without assembling identity primitives yourself.

## Why User Management?

Traditional authentication libraries were built when username and password was the norm. Today's security landscape demands more. Phishing-resistant passkeys, one-time passwords, and TOTP are now expected by users and required by compliance frameworks.

User Management meets these requirements out of the box. Rather than assembling authentication primitives yourself, you get a complete, opinionated implementation with sensible defaults that guide you toward secure outcomes.

## Relationship to Duende IdentityServer

User Management is a standalone SDK that integrates with Duende IdentityServer. IdentityServer handles the OpenID Connect, OAuth 2.0 and SAML protocol layer, issuing tokens, managing clients and scopes, and enforcing authorization policies. User Management provides the user store and authentication UI that integrates with that protocol layer.

You can use User Management as the identity layer for a new IdentityServer deployment, or integrate it into an existing one. The two components are independently versioned and can be adopted incrementally.

## Authentication Methods

User Management supports the authentication methods that modern applications need:

* **One-Time Passwords (OTP)**: Passwordless authentication via email or SMS-delivered one-time codes, suitable for both primary and step-up authentication flows.
* **TOTP**: Time-based one-time passwords compatible with authenticator apps such as Microsoft Authenticator and Google Authenticator.
* **Passkeys (WebAuthn/FIDO2)**: Phishing-resistant, device-bound authentication using the FIDO2/WebAuthn standard.
* **External Authentication**: Federate with external identity providers (social logins, enterprise IdPs) via OpenID Connect and OAuth 2.0.
* **Username and Password**: Traditional credential-based authentication, supported for scenarios where it is required.
* **Recovery Codes**: Single-use backup codes that allow users to regain access when their primary authentication method is unavailable.

## Key Features

* **Passwordless-First Design**: Built from the ground up to support modern, password-free authentication flows, with passwords as an opt-in rather than the default.
* **User Profiles**: An extensible user profile model for storing and surfacing custom claims and attributes alongside standard identity information.
* **Roles and Groups**: Built-in support for role-based access control and group membership management, making it straightforward to model organizational structures and permission boundaries.
* **Membership Management**: A dedicated API surface (`IMembershipAdmin`) for assigning and removing users from roles and groups programmatically. This matters when user-to-role and user-to-group relationships need to be managed by application code, for example during provisioning workflows, admin UIs, or automated onboarding, rather than only at login time.
* **IdentityServer Integration**: User Management integrates with Duende IdentityServer as the user store, enabling standards-based OpenID Connect and OAuth 2.0 token issuance backed by its full feature set.
* **Opinionated Defaults**: Sensible, security-oriented defaults that reduce the surface area for misconfiguration without sacrificing extensibility.

## When to Use User Management

User Management is a good fit when you need:

* Modern authentication methods beyond username and password, including passkeys, OTP and TOTP.
* A complete user store that integrates with Duende IdentityServer without requiring you to wire up identity primitives manually.
* Enterprise-grade features such as roles, groups, extensible user profiles, and programmatic membership management via `IMembershipAdmin`.
* Recovery code support so users are never permanently locked out of their accounts.
* A passwordless-first approach that still accommodates password-based authentication where required.
