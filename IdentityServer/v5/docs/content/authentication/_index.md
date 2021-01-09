+++
title = "User Interaction"
date = 2020-09-10T08:20:20+02:00
weight = 40
chapter = true
+++

# User Interface

As part of customizing your IdentityServer, the there are several pages that are mandatory to implement but other custom pages can also be created.
Additionally, during any of the user workflows your code might need to use information about the original authorize request to perform logic to customize the user experience.
The [UI pages]({{< ref "./UI" >}}) section covers these topics.

# Authorize Requests

The interactive protocol endpoint users are redirected to is the [authorization endpoint]({{< ref "/reference/endpoints/authorize" >}}).
When an authorize request is made, normally one of the standard pages is what the user is redirected to (e.g. login, or consent).
But you can control or override the logic by extending the [authorize interaction response generator]({{<ref "response_generator">}}).

Normally parameters to the authorize endpoint as passed as query string arguments, 
but those parameters can optionally be passed as a JWT using [Signed Authorize Requests]({{<ref "jar">}}).
