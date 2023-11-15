---
title: "Issuing Internal Tokens"
date: 2020-09-10T08:22:12+02:00
weight: 60
---

Sometimes, extensibility code running on your IdentityServer needs access tokens to call other APIs. In this case it is not necessary to use the protocol endpoints. The tokens can be issued internally.

*IIdentityServerTools* is a collection of useful internal tools that you might need when writing extensibility code
for IdentityServer. To use it, inject it into your code, e.g. a controller::

```cs
    public MyController(IIdentityServerTools tools)
    {
        _tools = tools;
    }
```

The *IssueJwtAsync* method allows creating JWT tokens using the IdentityServer token creation engine. The *IssueClientJwtAsync* is an easier
version of that for creating tokens for server-to-server communication (e.g. when you have to call an IdentityServer protected API from your code):

```cs
public async Task<IActionResult> MyAction()
{
    var token = await _tools.IssueClientJwtAsync(
        clientId: "client_id",
        lifetime: 3600,
        audiences: new[] { "backend.api" });

    // more code
}
```

The *IIdentityServerTools* interface was added in v7 to allow mocking. Previous versions refrenced the *IdentityServerTools* implementation class directly.