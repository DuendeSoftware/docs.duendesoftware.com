---
title: "Token Management"
date: 2024-07-23T08:22:12+02:00
weight: 4
---

Welcome to this Quickstart for Duende IdentityServer!

The previous quickstart introduced
[API access with interactive applications]({{< ref "3_api_access" >}}), but by far the most complex task for a typical client is to manage the access token.
Given that the access token has a finite lifetime, you typically want to

- request an access and refresh token at login time
- cache those tokens
- use the access token to call APIs until it expires
- use the refresh token to get a new access token
- repeat the process of caching and refreshing with the new token

ASP.NET Core has built-in facilities that can help you with some of those tasks
(like caching or sessions), but there is still quite some work left to do.
Consider using the
[Duende.AccessTokenManagement](https://github.com/DuendeSoftware/Duende.AccessTokenManagement/wiki)
library for help with access token lifetime management. It provides abstractions
for storing tokens, automatic refresh of expired tokens, etc.
