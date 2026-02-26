---
title: "Issuing Internal Tokens"
description: "A guide to using the IIdentityServerTools interface for creating JWT tokens internally within IdentityServer's extensibility code, without going through the protocol endpoints."
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Internal Tokens
  order: 60
redirect_from:
  - /identityserver/v5/tokens/internal/
  - /identityserver/v6/tokens/internal/
  - /identityserver/v7/tokens/internal/
---

Sometimes, extensibility code running on your IdentityServer needs access tokens to call other APIs. In this case it is
not necessary to use the protocol endpoints. The tokens can be issued internally.

`IIdentityServerTools` is a collection of useful internal tools that you might need when writing extensibility code
for IdentityServer. To use it, inject it into your code, e.g. an endpoint:

```csharp
app.MapGet("/myAction", async (IIdentityServerTools tools) =>
{
    var token = await tools.IssueClientJwtAsync(
        clientId: "client_id",
        lifetime: 3600,
        audiences: new[] { "backend.api" });

    // more code
});
```

The `IIdentityServerTools` interface was added in v7 to allow mocking. Previous versions referenced the
`IdentityServerTools` implementation class directly.
