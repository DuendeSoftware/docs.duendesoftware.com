---
title: Multi-Tenancy
description: An introduction to multi-tenancy support in Duende User Management, enabling a single deployment to serve multiple isolated tenants with separate user stores and configuration.
date: 2026-04-29
sidebar:
  label: Multi-Tenancy
  order: 3
---

Duende User Management includes first-class multi-tenancy support, allowing a single deployment to serve multiple isolated tenants. Each tenant has its own user store, identity configuration, and session data, fully separated from every other tenant within the same running instance.

## What Is Multi-Tenancy in User Management?

In a multi-tenant deployment, each tenant is an independent identity environment. Tenants do not share users, clients, resources, or sessions. From the perspective of end users and client applications, each tenant behaves as if it were a completely separate identity provider.

Key characteristics of multi-tenant deployments:

* **Isolated user stores**: Each tenant maintains its own set of users and credentials. A user registered in one tenant has no presence in another.
* **Separate configuration**: Identity resources, API scopes, clients, and other configuration are scoped per tenant. Changes in one tenant do not affect others.
* **Independent sessions and tokens**: Sessions and issued tokens are tenant-scoped. There is no cross-tenant session sharing.
* **Automatic tenant resolution**: Incoming requests are automatically routed to the correct tenant based on the request origin (hostname), with no manual tenant selection required.

By default, User Management operates in single-tenant mode. Multi-tenancy is an opt-in feature that must be explicitly enabled during setup.

## When to Use Multi-Tenancy

Multi-tenancy is the right choice when you need to serve multiple distinct customer environments from a single deployment. Common scenarios include:

* **SaaS platforms**: A software-as-a-service product where each customer organization requires its own isolated identity environment, including separate user accounts and configuration.
* **Multiple isolated environments**: Situations where different business units, brands, or product lines need independent identity stores but share underlying infrastructure.
* **Subdomain-per-customer architectures**: Deployments where each customer is accessed via a dedicated hostname (for example, `customer-a.example.com` and `customer-b.example.com`), and each hostname should resolve to a distinct identity environment.

If you only serve a single customer or a single unified user population, single-tenant mode is simpler and sufficient.

## How Tenant Resolution Works

When multi-tenancy is enabled, each incoming request is automatically matched to a tenant based on the request's origin hostname. This happens transparently in the request pipeline before any identity logic runs.

The resolution process works as follows:

* Each tenant is associated with one or more origin hostnames at configuration time.
* When a request arrives, the hostname is looked up against the configured tenant origins.
* All subsequent operations in that request (user lookups, token issuance, session management) are automatically scoped to the resolved tenant.
* If no tenant matches the incoming hostname, requests fall back to a designated default tenant.

This origin-based resolution means that routing to the correct tenant requires no changes to client applications. Clients simply connect to their assigned hostname and receive a fully isolated identity experience.

## Special Tenants

Two reserved tenants exist in every multi-tenant deployment:

* **Management Tenant**: Stores tenant definitions and shared infrastructure configuration. Used internally to manage the set of active tenants.
* **Default Tenant**: Acts as a fallback when an incoming request's hostname does not match any configured tenant origin. Useful for handling direct access to the root domain or for development environments.

These tenants are created automatically and cannot be deleted.

## High-Level Setup

Enabling multi-tenancy is a single step during application configuration. Once enabled, the infrastructure for tenant resolution, scoped storage, and tenant management becomes available.

Tenants are then created and managed through the `ISpaceAdmin` API, which lets you define tenant names and associate them with one or more origin hostnames. After a tenant is created, its identity resources, API scopes, and other configuration are set up independently within that tenant's context.

Storage for all tenants can share a single database. Each record is automatically tagged with the tenant identifier, ensuring complete data isolation without requiring separate database instances per tenant. Dedicated per-tenant databases are also supported for scenarios where stricter infrastructure separation is required.

