+++
title = "User Interaction"
date = 2020-09-10T08:20:20+02:00
weight = 40
chapter = true
+++

# User Interaction

As part of customizing your IdentityServer, the there are several pages that are mandatory to implement but other custom pages can also be created.
Additionally, during any of the user workflows your code might need to use information about the original authorize request to perform logic to customize the user experience.
The [UI pages]({{< ref "./UI" >}}) section covers these topics.

Your IdentityServer supports extensibility and customization when requests are made to the authorization protocol endpoint.
The [Authorize Requests]({{< ref "./AuthorizeEndpoint" >}}) section covers those topics.
