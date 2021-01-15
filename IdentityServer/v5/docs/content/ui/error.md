---
title: "Error"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

The error page is used to display to the end user than an error has ocurred during requests to the [authorize endpoint]({{<ref "/reference/endpoints/authorize">}}).

Commonly errors are due to misconfiguration, and there's not much an end user can do about that.
But this allows the user to understand that something went wrong and that they are not in the middle of a successful workflow.

## Error Context

Details of the error are provided to the error page via an *errorId* parameter.

The [interaction service]({{< ref "/reference/services/interaction_service#iidentityserverinteractionservice-apis" >}}) provides a *GetErrorContextAsync* API that will extract that information from the *errorId*.
The returned [ErrorMessage]({{<ref "/reference/services/interaction_service#errormessage">}}) object contains these details.


