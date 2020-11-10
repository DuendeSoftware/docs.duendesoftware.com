---
title: "Using Reference Tokens"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

If you are using reference tokens, you need an authentication handler that implements [OAuth 2.0 token introspection](https://tools.ietf.org/html/rfc7662), e.g. [this](https://github.com/IdentityModel/IdentityModel.AspNetCore.OAuth2Introspection) one:.

```cs
services.AddAuthentication("token")
    .AddOAuth2Introspection("token", options =>
    {
        options.Authority = Constants.Authority;

        // this maps to the API resource name and secret
        options.ClientId = "resource1";
        options.ClientSecret = "secret";
    });
```

## Supporting both JWTs and reference tokens
todo: merge blog post info

You can setup ASP.NET Core to dispatch to the right handler based on the incoming token, see [this](https://leastprivilege.com/2020/07/06/flexible-access-token-validation-in-asp-net-core) blog post for more information.
In this case you setup one default handler, and some forwarding logic, e.g.:

```cs
services.AddAuthentication("token")

    // JWT tokens
    .AddJwtBearer("token", options =>
    {
        options.Authority = Constants.Authority;
        options.Audience = "resource1";

        options.TokenValidationParameters.ValidTypes = new[] { "at+jwt" };

        // if token does not contain a dot, it is a reference token
        options.ForwardDefaultSelector = Selector.ForwardReferenceToken("introspection");
    })

    // reference tokens
    .AddOAuth2Introspection("introspection", options =>
    {
        options.Authority = Constants.Authority;

        options.ClientId = "resource1";
        options.ClientSecret = "secret";
    });
```