+++
title = "Authorize Requests"
date = 2020-09-10T08:20:20+02:00
weight = 30
chapter = true
+++

# Authorize Requests

The interactive protocol endpoint users are redirected to is the [authorization endpoint]({{< ref "/reference/endpoints/authorize" >}}).
When an authorize request is made, normally one of the standard pages is what the user is redirected to (e.g. login, or consent).
But you can control or override the logic by extending the [authorize interaction response generator]({{<ref "./airg">}}).

Normally parameters to the authorize endpoint as passed as query string arguments, 
but those parameters can optionally be passed as a JWT using [Signed Authorize Requests]({{<ref "./jar">}}).
