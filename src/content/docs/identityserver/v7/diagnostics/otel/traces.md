---
title: "Traces"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 20
---

(added in v6.1)

Here's e.g. the output for a request to the discovery endpoint:

![](images/otel_disco.png)

When multiple applications send their traces to the same OTel server, this becomes super useful for following e.g.
authentication flows over service boundaries.

The following screenshot shows the ASP.NET Core OpenID Connect authentication handler redeeming the authorization code:

![](images/otel_flow_1.png)

...and then contacting the userinfo endpoint:

![](images/otel_flow_2.png)

*The above screenshots are from https://www.honeycomb.io.*

#### Tracing sources

IdentityServer can emit very fine grained traces which is useful for performance troubleshooting and general exploration
of the
control flow.

This might be too detailed in production.

You can select which information you are interested in by selectively listening to various traces:

* *`IdentityServerConstants.Tracing.Basic`*

  High level request processing like request validators and response generators

* *`IdentityServerConstants.Tracing.Cache`*

  Caching related tracing

* *`IdentityServerConstants.Tracing.Services`*

  Services related tracing

* *`IdentityServerConstants.Tracing.Stores`*

  Store related tracing

* *`IdentityServerConstants.Tracing.Validation`*

  More detailed tracing related to validation
