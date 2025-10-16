---
title: IdentityServer Deployment
description: Comprehensive guide covering key aspects of deploying IdentityServer including proxy configuration, data protection, data stores, caching, and health monitoring.
date: 2020-09-10T08:20:20+02:00
sidebar:
  label: Overview
  order: 10
redirect_from:
   - /dataprotection/
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
Our experience has been that these topics are very important. Some of our most common support requests are related to [Data Protection](#data-protection-keys) and [Load Balancing](#proxy-servers-and-load-balancers), so we strongly encourage you to review those pages, along with the rest of this chapter before deploying IdentityServer to production.
:::

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

In local development, ASP.NET automatically creates data protection keys, but in a deployed environment, you will need
to ensure that your data protection keys are stored in a persistent way and shared across all load balanced instances of
your IdentityServer implementation. This means you'll need to choose where to store and how to protect the data
protection keys, as appropriate for your environment. Microsoft has extensive
documentation [here](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview)
describing how to configure storage and protection of data protection keys.

A typical IdentityServer implementation should include data protection configuration code, like this:

```cs
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
  .SetApplicationName("IdentityServer");
```

:::danger[Ensure data protection keys are persisted]
Always make sure data protection is configured to persist data protection keys to storage, using `.PersistKeys...()`
for your storage mechanism.

In addition, make sure the storage mechanism itself is durable. For example, if you are using the default file system
based key store, make sure that the configured path is not stored on ephemeral storage. If you are using Redis to store
data protection keys using `PersistKeysToStackExchangeRedis`, ensure that your Redis service is configured to persist
data to a database backup or append-only file. Otherwise, when your Redis instance reboots, you will lose all data
protection keys.

If you lose your data protection keys, all data protected with those keys to no longer be readable.
:::

### Data Protection Keys and IdentityServer's Signing Keys

ASP.NET's data protection keys are sometimes confused with IdentityServer's signing keys, but the two are completely
separate keys with different purposes. IdentityServer implementations need both to function correctly.

#### Data Protection Keys

Data protection is a cryptographic library that is part of the ASP.NET framework. Data protection uses private key
cryptography to encrypt and sign sensitive data to ensure that it is only written and read by the application. The
framework uses data protection to secure data that is commonly used by IdentityServer implementations, such as
authentication cookies and anti-forgery tokens. In addition, IdentityServer itself uses data protection to protect
sensitive data at rest, such as persisted grants, and sensitive data passed through the browser, such as the
context objects passed to pages in the UI. The data protection keys are critical secrets for an IdentityServer
implementation because they encrypt a great deal of sensitive data at rest and prevent sensitive data that is
round-tripped through the browser from being tampered with.

#### IdentityServer Signing Key

Separately, IdentityServer needs cryptographic keys, called [signing keys](/identityserver/fundamentals/key-management.md), to
sign tokens such as JWT access tokens and id tokens. The signing keys use public key cryptography to allow client
applications and APIs to validate token signatures using the public keys, which are published by IdentityServer
through [discovery](/identityserver/reference/endpoints/discovery.md). The private key component of the signing keys are
also critical secrets for IdentityServer because a valid signature provides integrity and non-repudiation guarantees
that allow client applications and APIs to trust those tokens.

### Common Problems

Common data protection problems occur when data is protected with a key that is not available when the data is later
read. A common symptom is `CryptographicException`s in the IdentityServer logs. For example, when automatic key
management fails to read its signing keys due to a data protection failure, IdentityServer will log an error message
such as "Error unprotecting key with kid {Signing Key ID}.", and log the underlying
`System.Security.Cryptography.CryptographicException`, with a message like "The key {Data Protection Key ID} was not
found in the key ring."

Failures to read automatic signing keys are often the first place where a data protection problem manifests, but any of
many places where IdentityServer and ASP.NET use data protection might also throw `CryptographicException`s.

There are several ways that data protection problems can occur:

1. In load balanced environments, every instance of IdentityServer needs to be configured to share data protection keys.
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
4. If your IdentityServer is hosted by IIS, special configuration is needed for data protection. In most default
   deployments, IIS lacks the permissions required to persist data protection keys, and falls back to using an ephemeral
   key generated every time the site starts up. Microsoft's docs on this issue
   are [here](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/iis/advanced?view=aspnetcore-7.0#data-protection).

### Identity Server's Usage of Data Protection

Duende IdentityServer's features that rely on data protection include

* protecting signing keys at rest (
  if [automatic key management](/identityserver/fundamentals/key-management.md#automatic-key-management) is used and enabled)
* protecting [persisted grants](/identityserver/data/operational.md#persisted-grant-service) at rest (if enabled)
* protecting [server-side session](/identityserver/ui/server-side-sessions/index.md) data at rest (if enabled)
* protecting [the state parameter](/identityserver/ui/login/external.md#state-url-length-and-isecuredataformat) for
  external OIDC providers (if enabled)
* protecting message payloads sent between pages in the UI (
  e.g. [logout context](/identityserver/ui/logout/logout-context.md) and [error context](/identityserver/ui/error.md)).
* session management (because the ASP.NET Core cookie authentication handler requires it)

## IdentityServer Data Stores

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

## Distributed Caching

Some optional features rely on ASP.NET Core distributed caching:

* [State data formatter for OpenID Connect](/identityserver/ui/login/external.md#state-url-length-and-isecuredataformat)
* Replay cache (e.g. for [JWT client credentials](/identityserver/tokens/client-authentication.md#setting-up-a-private-key-jwt-secret))
* [Device flow](/identityserver/reference/stores/device-flow-store.md) throttling service
* Authorization parameter store

In order to work in a multi-server environment, this needs to be set up correctly. Please consult the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/performance/caching/distributed) for more details.

## Health Checks

You can use ASP.NET's [health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks) to monitor the health of your IdentityServer deployment. Health checks can contain arbitrary logic to test various conditions of a system. One common strategy for checking the health of IdentityServer is to make discovery requests. Successful discovery responses indicate not just that the IdentityServer host is running and able to receive requests and generate responses, but also that it was able to communicate with the configuration store.

The following example code creates a health check that makes requests to the discovery endpoint. It finds the discovery endpoint's handler by name, which requires IdentityServer `v6.3`.

```csharp
public class DiscoveryHealthCheck : IHealthCheck
{
    private readonly IEnumerable<Hosting.Endpoint> _endpoints;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DiscoveryHealthCheck(IEnumerable<Hosting.Endpoint> endpoints, IHttpContextAccessor httpContextAccessor)
    {
        _endpoints = endpoints;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = _endpoints.FirstOrDefault(x => x.Name == IdentityServerConstants.EndpointNames.Discovery);
            if (endpoint != null)
            {
                var handler = _httpContextAccessor.HttpContext.RequestServices.GetRequiredService(endpoint.Handler) as IEndpointHandler;
                if (handler != null)
                {
                    var result = await handler.ProcessAsync(_httpContextAccessor.HttpContext);
                    if (result is DiscoveryDocumentResult)
                    {
                        return HealthCheckResult.Healthy();
                    }
                }
            }
        }
        catch
        {
        }
        
        return new HealthCheckResult(context.Registration.FailureStatus);
    }
}
```

Another health check that you can perform is to request the public keys that IdentityServer uses to sign tokens - the JWKS (JSON Web Key Set). Doing so demonstrates that IdentityServer is able to communicate with the signing key store, a critical dependency. The following example code creates such a health check. Just as with the previous health check, it finds the endpoint's handler by name, which requires IdentityServer `v6.3`.

```csharp
public class DiscoveryKeysHealthCheck : IHealthCheck
{
    private readonly IEnumerable<Hosting.Endpoint> _endpoints;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DiscoveryKeysHealthCheck(IEnumerable<Hosting.Endpoint> endpoints, IHttpContextAccessor httpContextAccessor)
    {
        _endpoints = endpoints;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var endpoint = _endpoints.FirstOrDefault(x => x.Name == IdentityServerConstants.EndpointNames.Jwks);
            if (endpoint != null)
            {
                var handler = _httpContextAccessor.HttpContext.RequestServices.GetRequiredService(endpoint.Handler) as IEndpointHandler;
                if (handler != null)
                {
                    var result = await handler.ProcessAsync(_httpContextAccessor.HttpContext);
                    if (result is JsonWebKeysResult)
                    {
                        return HealthCheckResult.Healthy();
                    }
                }
            }
        }
        catch
        {
        }

        return new HealthCheckResult(context.Registration.FailureStatus);
    }
}
```
