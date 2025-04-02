---
title: "Distributed Caching"
date: 2020-09-10T08:22:12+02:00
order: 40
---

Some optional features rely on ASP.NET Core distributed caching:

* [State data formatter for OpenID Connect](../ui/login/external#state-url-length-and-isecuredataformat)
* Replay cache (e.g. for [JWT client credentials](../tokens/authentication/jwt))
* [Device flow](../reference/stores/device_flow_store) throttling service
* Authorization parameter store 

In order to work in a multi server environment, this needs to be set up correctly. Please consult the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/performance/caching/distributed) for more details.