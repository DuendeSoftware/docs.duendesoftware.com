---
title: "BFF Silent Login Callback Extensibility"
sidebar: 
  label: "Silent Login Callback"
  order: 30
date: 2022-12-30 10:55:24
---

The BFF silent login callback endpoint can be customized by implementing the *ISilentLoginCallbackService* or by extending *DefaultSilentLoginCallbackService*, its default implementation.

## Request Processing
*ProcessRequestAsync* is the top level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

For example, you could take whatever actions you need before normal processing of the request like this:

```csharp
public override Task ProcessRequestAsync(HttpContext context)
{
    // Custom logic here

    return base.ProcessRequestAsync(context);
}
```
