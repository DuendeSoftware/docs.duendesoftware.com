---
title: "Proxy Servers and Load Balancers"
date: 2020-09-10T08:22:12+02:00
order: 10
---

In most situations, your IdentityServer is hosted using the IIS/ASP.NET Core Module, Nginx, or Apache. Proxy servers, load balancers, and other network appliances often obscure information about the request before it reaches the host, e.g.:

* when HTTPS requests are proxied over HTTP, the original scheme (HTTPS) is lost and must be forwarded in a header.
* because an app receives a request from the proxy and not its true source on the Internet or corporate network, the originating client IP address must also be forwarded in a header.

Common effects of such infrastructures is that the HTTPS gets turned into HTTP, or that host names are incorrect in the discovery document or on redirect. In almost all cases, these problems can be solved by adding the *ForwardedHeaders* middleware to you pipeline. This takes care of translating the information received from reverse proxies or load balancers back into a format ASP.NET Core can understand it.

Please consult the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer) for more details.