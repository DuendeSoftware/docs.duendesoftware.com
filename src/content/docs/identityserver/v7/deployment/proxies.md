---
title: "Proxy Servers and Load Balancers"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

In typical deployments, your IdentityServer will be hosted behind a load balancer or reverse proxy. These and other network appliances often obscure information about the request before it reaches the host. Some of the behavior of IdentityServer and the ASP.NET authentication handlers depend on that information, most notably the scheme (HTTP vs HTTPS) of the request and the originating client IP address.

Requests to your IdentityServer that come through a proxy will appear to come from that proxy instead of its true source on the Internet or corporate network. If the proxy performs TLS termination (that is, HTTPS requests are proxied over HTTP), the original HTTPS scheme  will also no longer be present in the proxied request. Then, when the IdentityServer middleware and the ASP.NET authentication middleware process these requests, they will have incorrect values for the scheme and originating IP address.

Common symptoms of this problem are 
- HTTPS requests get downgraded to HTTP
- Host names are incorrect in the discovery document or on redirect
- Cookies are not sent with the secure attribute, which can especially cause problems with the samesite cookie attribute.

In almost all cases, these problems can be solved by adding the ASP.NET *ForwardedHeaders* middleware to your pipeline. Most network infrastructure that proxies requests will set the [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) and [X-Forwarded-Proto](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto) HTTP headers to describe the original request's IP address and scheme.

The *ForwardedHeaders* middleware reads the information in these headers on incoming requests and makes it available to the rest of the ASP.NET pipeline by updating the [*HttpContext.HttpRequest*](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/use-http-context?view=aspnetcore-7.0#httprequest). This transformation should be done early in the pipeline, certainly before the IdentityServer middleware and ASP.NET authentication middleware process requests, so that the presence of a proxy is abstracted away first. 

The appropriate configuration for the forwarded headers middleware depends on your environment. In general, you need to configure which headers it should respect, the IP address or IP address range of your proxy, and the number of proxies you expect (when there are multiple proxies, each one is captured in the X-Forwarded-* headers).

There are two ways to configure this middleware:
1. Enable the environment variable ASPNETCORE_FORWARDEDHEADERS_ENABLED. This is the simplest option, but doesn't give you as much control. It automatically adds the forwarded headers middleware to the pipeline, and configures it to accept forwarded headers from any single proxy, respecting the X-Forwarded-For and X-Forwarded-Proto headers. This is often the right choice for cloud hosted environments and Kubernetes clusters.
2. Configure the *ForwardedHeadersOptions* in DI, and use the ForwardedHeaders middleware explicitly in your pipeline. The advantage of configuring the middleware explicitly is that you can configure it in a way that is appropriate for your environment, if the defaults used by ASPNETCORE_FORWARDEDHEADERS_ENABLED are not what you need. Most notably, you can use the *KnownNetworks* or *KnownProxies* options to only accept headers sent by a known proxy, and you can set the *ForwardLimit* to allow for multiple proxies in front of your IdentityServer. This is often the right choice when you have more complex proxying going on, or if your proxy has a stable IP address.
   
In a client codebase operating behind a proxy, you'll need to configure the *ForwardedHeadersOptions*. Be sure to correctly set values for *KnownNetworks* and *KnownProxies* for your production
environments. By default, *KnownNetworks* and *KnownProxies* support localhost with values of *127.0.0.1* and *::1* respectively. This is useful (and secure!) for local development
environments and for solutions where the reverse proxy and the .NET web host runs on the same machine.

```csharp
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    // you may need to change these ForwardedHeaders 
    // values based on your network architecture
    options.ForwardedHeaders = ForwardedHeaders.XForwardedHost |
                                ForwardedHeaders.XForwardedProto;
    
    // exact Addresses of known proxies to accept forwarded headers from.
    options.KnownProxies.Add(IPAddress.Parse("203.0.113.42"); // <-- change this value to the IP Address of the proxy

    // if the proxies could use any address from a block, that can be configured too:
    // var network = new IPNetwork(IPAddress.Parse("198.51.100.0"), 24);
    // options.KnownNetworks.Add(network);

    // default is 1
    options.ForwardLimit = 1;
});
```

Please consult the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer) for more details.