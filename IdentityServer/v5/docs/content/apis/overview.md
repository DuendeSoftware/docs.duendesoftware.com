---
title: "Overview"
date: 2020-09-10T08:22:12+02:00
weight: 1
---

Duende IdentityServer's OAuth implementation issues access and refresh tokens for controlling access to resources.

These resources are very often HTTP-based APIs, but could be also other "invokable" functionality like messaging endpoints, gRPC services or even good old XML Web Services. See the [issuing tokens]({{< ref "/tokens" >}}) section on more information on access tokens and how to request them.

In the case of HTTP-APIs, the access token is typically sent on the Authorization header to the API.

![](../images/authorization_header.png)


* todo: add jwt vs reference tokens content
* todo: add general JWT information (payload, header, claims).
