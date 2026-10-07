---
title: IdentityServer Deployment
description: "Deploy Duende IdentityServer into production, covering reverse proxies, ASP.NET Data Protection, persistent stores, caching, and health checks."
date: 2020-09-10T08:20:20+02:00
sidebar:
  label: Overview
  order: 10
redirect_from:
   - /identityserver/v5/deployment/
   - /identityserver/v6/deployment/
   - /identityserver/v7/deployment/
   - /identityserver/v5/deployment/proxies/
   - /identityserver/v6/deployment/proxies/
   - /identityserver/v7/deployment/proxies/
   - /identityserver/v5/deployment/data_protection/
   - /identityserver/v6/deployment/data_protection/
   - /identityserver/v7/deployment/data_protection/
   - /identityserver/v5/deployment/data_stores/
   - /identityserver/v6/deployment/data_stores/
   - /identityserver/v7/deployment/data_stores/
   - /identityserver/v5/deployment/caching/
   - /identityserver/v6/deployment/caching/
   - /identityserver/v7/deployment/caching/
   - /identityserver/v5/deployment/health_checks/
   - /identityserver/v6/deployment/health_checks/
   - /identityserver/v7/deployment/health_checks/
---

Because IdentityServer is made up of middleware and services that you use within an ASP.NET Core application, it can be hosted and deployed with the same diversity of technology as any other ASP.NET Core application. You have the choice about 
- where to host your IdentityServer (on-prem or in the cloud, and if in the cloud, which one?)
- which web server to use (IIS, Kestrel, Nginx, Apache, etc.)
- how you'll scale and load-balance the deployment
- what kind of deployment artifacts you'll publish (files in a folder, containers, etc.)
- how you'll manage the environment (a managed app service in the cloud, a Kubernetes cluster, etc.)

While this is a lot of decisions to make, this also means that your IdentityServer implementation can be built, deployed, hosted, and managed with the same technology that you're using for any other ASP.NET applications that you have.

Microsoft publishes extensive [advice and documentation](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/) about deploying ASP.NET Core applications, and it is applicable to IdentityServer implementations. We're not attempting to replace that documentation - or the documentation for other tools that you might be using in your environment. Rather, this section of our documentation focuses on IdentityServer-specific deployment and hosting considerations. 

:::note
Our experience has been that these topics are very important. Some of our most common support requests are related to [Data Protection](/general/data-protection.md#data-protection-keys) and [Load Balancing](#proxy-servers-and-load-balancers), so we strongly encourage you to review those pages, along with the rest of this chapter before deploying IdentityServer to production.
:::

## Production Deployment Checklist

This checklist is a short summary of the detailed deployment guidance on this page. Before deploying IdentityServer to production, confirm that:

* **HTTPS and proxy settings are correct.** Configure forwarded headers before IdentityServer and verify that the discovery document publishes the public HTTPS issuer. See [Proxy Servers and Load Balancers](#proxy-servers-and-load-balancers).
* **Data Protection keys use durable, shared storage.** Protect the keys at rest and set an explicit application name. See [ASP.NET Core Data Protection](#aspnet-core-data-protection).
* **Signing keys are protected and shared by every instance.** Define how keys will be rotated, use [Automatic Key Management](/identityserver/fundamentals/key-management.md#automatic-key-management) when it is available for your edition, and choose a [shared key store](/identityserver/fundamentals/key-management.md#key-storage) for load-balanced deployments.
* **Configuration and operational data use production stores.** Do not rely on in-memory stores for state that must survive restarts or be shared between instances. See [IdentityServer Data Stores](#identityserver-data-stores).
* **Database changes are part of the deployment process.** Apply schema changes before the new application version starts, and enable [operational-store cleanup](/identityserver/data/providers/entityframework-core.md#operational-store) so expired grants and pushed authorization requests do not accumulate.
* **Every instance can access the same shared state.** Configure shared operational data, signing keys, Data Protection keys, and any feature-specific [distributed caches](#distributed-caching).
* **CORS allows only the required client origins.** Configure explicit origins for browser-based clients and check the middleware order when combining IdentityServer and ASP.NET Core policies. See [CORS](/identityserver/tokens/cors.md).
* **Token and session lifetimes match your threat model.** Review [access-token and refresh-token settings](/identityserver/reference/v8/models/client.md#token) and keep [server-side session lifetimes](/identityserver/ui/server-side-sessions/session-expiration.mdx) consistent with them.
* **Diagnostics are ready before traffic arrives.** Configure appropriate [logging](/identityserver/diagnostics/logging.mdx), collect [OpenTelemetry](/identityserver/diagnostics/otel.md) signals, enable the [events](/identityserver/diagnostics/events.md) you need, and expose [health checks](#health-checks).
* **Traffic controls match the deployment risk.** Most deployments do not need application-level throttling, but public or multi-tenant deployments should assess [rate limiting](#rate-limiting).

## Proxy Servers and Load Balancers

In typical deployments, your IdentityServer will be hosted behind a load balancer or reverse proxy. These and other network appliances often obscure information about the request before it reaches the host. Some of the behavior of IdentityServer and the ASP.NET authentication handlers depend on that information, most notably the scheme (HTTP vs HTTPS) of the request and the originating client IP address.

Requests to your IdentityServer that come through a proxy will appear to come from that proxy instead of its true source on the Internet or corporate network. If the proxy performs TLS termination (that is, HTTPS requests are proxied over HTTP), the original HTTPS scheme  will also no longer be present in the proxied request. Then, when the IdentityServer middleware and the ASP.NET authentication middleware process these requests, they will have incorrect values for the scheme and originating IP address.

Common symptoms of this problem are
- HTTPS requests get downgraded to HTTP
- HTTP issuer is being published instead of HTTPS in `.well-known/openid-configuration`
- Host names are incorrect in the discovery document or on redirect
- Cookies are not sent with the secure attribute, which can especially cause problems with the samesite cookie attribute.

In almost all cases, these problems can be solved by adding the ASP.NET `ForwardedHeaders` middleware to your pipeline. Most network infrastructure that proxies requests will set the [`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) and [`X-Forwarded-Proto`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto) HTTP headers to describe the original request's IP address and scheme.

The `ForwardedHeaders` middleware reads the information in these headers on incoming requests and makes it available to the rest of the ASP.NET pipeline by updating the [`HttpContext.HttpRequest`](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/use-http-context?view=aspnetcore-7.0#httprequest). This transformation should be done early in the pipeline, certainly before the IdentityServer middleware and ASP.NET authentication middleware process requests, so that the presence of a proxy is abstracted away first.

The appropriate configuration for the forwarded headers middleware depends on your environment. In general, you need to configure which headers it should respect, the IP address or IP address range of your proxy, and the number of proxies you expect (when there are multiple proxies, each one is captured in the `X-Forwarded-*` headers).

There are two ways to configure this middleware:
1. Enable the environment variable `ASPNETCORE_FORWARDEDHEADERS_ENABLED`. This is the simplest option, but doesn't give you as much control. It automatically adds the forwarded headers middleware to the pipeline, and configures it to accept forwarded headers from any single proxy, respecting the `X-Forwarded-For` and `X-Forwarded-Proto` headers. This is often the right choice for cloud hosted environments and Kubernetes clusters.
2. Configure the `ForwardedHeadersOptions` in DI, and use the `ForwardedHeaders` middleware explicitly in your pipeline. The advantage of configuring the middleware explicitly is that you can configure it in a way that is appropriate for your environment, if the defaults used by `ASPNETCORE_FORWARDEDHEADERS_ENABLED` are not what you need. Most notably, you can use the `KnownNetworks` or `KnownProxies` options to only accept headers sent by a known proxy, and you can set the `ForwardLimit` to allow for multiple proxies in front of your IdentityServer. This is often the right choice when you have more complex proxying going on, or if your proxy has a stable IP address.

By default, `KnownNetworks` and `KnownProxies` support localhost with values of `127.0.0.1/8` and `::1` respectively. This is useful (and secure!) for local development environments and for solutions where the reverse proxy and the .NET web host runs on the same machine.

In production environments when operating behind a proxy, you'll need to configure the `ForwardedHeadersOptions`. Be sure to correctly set values for `KnownNetworks` and `KnownProxies` for your environments, as otherwise requests may be blocked.

```csharp
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    // you may need to change these ForwardedHeaders 
    // values based on your network architecture
    options.ForwardedHeaders = ForwardedHeaders.XForwardedHost |
                                ForwardedHeaders.XForwardedProto;
    
    // exact Addresses of known proxies to accept forwarded headers from.
    options.KnownProxies.Add(IPAddress.Parse("203.0.113.42")); // <-- change this value to the IP Address of the proxy

    // if the proxies could use any address from a block, that can be configured too:
    // var network = new IPNetwork(IPAddress.Parse("198.51.100.0"), 24);
    // options.KnownNetworks.Add(network);

    // default is 1
    options.ForwardLimit = 1;
});
```

Please consult the [Microsoft documentation on configuring ASP.NET Core to work with proxy servers and load balancers](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer) for more details.

## ASP.NET Core Data Protection

Duende IdentityServer makes extensive use of
ASP.NET's [data protection](https://docs.microsoft.com/en-us/aspnet/core/security/data-protection/) feature. It is
crucial that you configure data protection correctly before you start using your IdentityServer in production.

The recommended practices for setting up and using ASP.NET Core Data Protection for Duende IdentityServer are the same as for other server-side products, like BFF. See the [general ASP.NET Core Data Protection page](/general/data-protection).

### ASP.NET Data Protection Keys and IdentityServer Signing Keys

ASP.NET's data protection keys are sometimes confused with IdentityServer's signing keys, but the two are completely
separate keys with different purposes. IdentityServer implementations need both to function correctly.

#### ASP.NET Data Protection Keys

Data protection is a cryptographic library that is part of ASP.NET Core. Data protection uses private key
cryptography to encrypt and sign sensitive data to ensure that it is only written and read by the application. The
framework uses data protection to secure data that is commonly used by IdentityServer implementations, such as
authentication cookies and anti-forgery tokens. In addition, IdentityServer itself uses data protection to protect
sensitive data at rest, such as persisted grants, and sensitive data passed through the browser, such as the
context objects passed to pages in the UI. The data protection keys are critical secrets for an IdentityServer
implementation because they encrypt a great deal of sensitive data at rest and prevent sensitive data that is
round-tripped through the browser from being tampered with.

#### The IdentityServer Signing Key

Separately, IdentityServer needs cryptographic keys, called [signing keys](/identityserver/fundamentals/key-management.md), to
sign tokens such as JWT access tokens and id tokens. The signing keys use public key cryptography to allow client
applications and APIs to validate token signatures using the public keys, which are published by IdentityServer
through [discovery](/identityserver/reference/v8/endpoints/discovery.md). The private key component of the signing keys are
also critical secrets for IdentityServer because a valid signature provides integrity and non-repudiation guarantees
that allow client applications and APIs to trust those tokens.

### IdentityServer Data Stores

IdentityServer itself is stateless and does not require server affinity - but there is data that needs to be shared between in multi-instance deployments.

### Configuration Data
This typically includes:

* resources
* clients
* startup configuration, e.g. key material, external provider settings etc…

The way you store that data depends on your environment. In situations where configuration data rarely changes we recommend using the in-memory stores and code or configuration files. In highly dynamic environments (e.g. Saas) we recommend using a database or configuration service to load configuration dynamically.

### Operational Data
For certain operations, IdentityServer needs a persistence store to keep state, this includes:

* issuing authorization codes
* issuing reference and refresh tokens
* storing consent
* automatic management for signing keys

You can either use a traditional database for storing operational data, or use a cache with persistence features like Redis.

Duende IdentityServer includes storage implementations for above data using EntityFramework, and you can build your own. See the [data stores](/identityserver/data) section for more information.

### IdentityServer Features Using Data Protection

Duende IdentityServer's features that rely on data protection include:

* protecting signing keys at rest (if [automatic key management](/identityserver/fundamentals/key-management.md#automatic-key-management) is used and enabled)
* protecting [persisted grants](/identityserver/data/operational.md#persisted-grant-service) at rest (if enabled)
* protecting [server-side session](/identityserver/ui/server-side-sessions/index.md) data at rest (if enabled)
* protecting [the state parameter](/identityserver/ui/login/external.md#state-url-length-and-isecuredataformat) for
  external OIDC providers (if enabled)
* protecting message payloads sent between pages in the UI (e.g. [logout context](/identityserver/ui/logout/logout-context.md) and [error context](/identityserver/ui/error.md)).
* session management (because the ASP.NET Core cookie authentication handler requires it)

## Distributed Caching

Some optional features rely on ASP.NET Core distributed caching:

* [State data formatter for OpenID Connect](/identityserver/ui/login/external.md#state-url-length-and-isecuredataformat)
* Replay cache (e.g. for [JWT client credentials](/identityserver/tokens/client-authentication.md#setting-up-a-private-key-jwt-secret))
* [Device flow](/identityserver/reference/v8/stores/device-flow-store.md) throttling service
* Authorization parameter store

In order to work in a multi-server environment, this needs to be set up correctly. Please consult the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/performance/caching/distributed) for more details.

## Rate Limiting

Duende IdentityServer does not include built-in rate limiting, and most deployments do not need it. Excessive requests are usually caused by a client misconfiguration, such as a missing token cache or a retry loop, so fixing the client is the right first step. When you do need to throttle traffic, for example on public-facing or multi-tenant deployments or when you do not have control over client applications, see [Rate Limiting Duende IdentityServer Endpoints](/identityserver/deployment/rate-limiting.md) for options at the network layer, in ASP.NET Core middleware, and in a custom token request validator.

## Health Checks

You can use ASP.NET Core's [health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks) to advertise the health of your IdentityServer deployment. 
These health checks can be used by load balancers, orchestrators, and other infrastructure to determine whether your IdentityServer is healthy and able to serve requests.
Health checks can contain arbitrary logic to test the dependencies of your IdentityServer implementation, such as the configuration store, signing key store, and operational data store, to confirm that they are available and functioning correctly.

A good health check to implement, is one that reports IdentityServer is ready for action. This health check does not verify external dependencies are available, but confirms that the IdentityServer 
middleware is up and running, and that it can respond to requests. The following example code creates such a health check:

```csharp {5,10}
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Register the health check services
builder.Services.AddHealthChecks();

var app = builder.Build();

// Map the health check endpoint
app.MapHealthChecks("/health/live");
```

If you're deploying your IdentityServer solution as a Docker image, you can use the `HEALTHCHECK` instruction in your Dockerfile 
to configure a health check for the container. The following example uses the `curl` command to request the `/health/live` endpoint 
and returns a non-zero exit code if the request fails.

```dockerfile title="Dockerfile"
# Add the health check instruction
HEALTHCHECK CMD curl --fail http://localhost:5000/health/live || exit 1
```

You can also add health checks to verify the availability of database services, for example by using EF Core's health check extension methods. 
The following example adds a health check for both the [configurational and operational DbContexts](/identityserver/data/index.mdx):

```csharp {5-7,12-13}
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Register the health check services, including checks for the configuration and operational DbContexts
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ConfigurationDbContext>(tags: ["db", "ready"]);
    .AddDbContextCheck<PersistedGrantDbContext>(tags: ["db", "ready"]);

var app = builder.Build();

// Map the health check endpoints
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = x => x.Tags.Contains("ready") });
```

This sample code creates two health check endpoints: `/health/live` for the liveness probe, and `/health/ready` for the readiness probe. 
Liveness probes are used to determine if the application is running, while readiness probes are used to determine if the application is ready to serve requests.

The liveness probe uses a predicate that always returns `false` to prevent running any of the registered health checks: this probe simply confirms that the IdentityServer middleware is running. 
The readiness probe uses a predicate that filters the registered health checks to only include those with the `ready` tag, which in this case are the health checks for the configuration and operational DbContexts.

Using tags, you can create multiple health check endpoints that check different aspects of your IdentityServer deployment, allowing you to monitor the health of your application and its dependencies in a flexible way.