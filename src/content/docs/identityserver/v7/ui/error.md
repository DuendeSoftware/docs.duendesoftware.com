---
title: "Error"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

The error page is used to display to the end user that an error has occurred during a request to the [authorize endpoint](/identityserver/v7/reference/endpoints/authorize).

When an error occurs, IdentityServer will redirect the user to a configurable `ErrorUrl`.
```csharp
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.ErrorUrl = "/path/to/error";
})
```
The default `ErrorUrl` is "/home/error". The quickstart UI includes a basic
implementation of an error page at that route.

Errors are commonly due to misconfiguration, and there's not much an end user can do about that.
But this allows the user to understand that something went wrong and that they are not in the middle of a successful workflow.

## Error Context

Details of the error are provided to the error page via a query string parameter. That parameter's name is configurable using the `ErrorId` option.

```csharp
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.ErrorId = "ErrorQueryStringParamName";
})
```

By default, the `ErrorId` is simply the string "errorId".

The [interaction service](/identityserver/v7/reference/services/interaction_service#iidentityserverinteractionservice-apis) provides a `GetErrorContextAsync` API that will load error details for an `ErrorId`.
The returned [ErrorMessage](/identityserver/v7/reference/services/interaction_service#errormessage) object contains these details.
