---
title: "Using Reference Tokens"
description: "Guide for implementing reference token validation in ASP.NET Core APIs using OAuth 2.0 token introspection"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 20
redirect_from:
  - /identityserver/v5/apis/aspnetcore/reference/
  - /identityserver/v6/apis/aspnetcore/reference/
  - /identityserver/v7/apis/aspnetcore/reference/
---

If you are using [reference tokens](/identityserver/tokens/reference), you need an authentication handler that
implements the back-channel validation via the [OAuth 2.0 token introspection](https://tools.ietf.org/html/rfc7662)
protocol, e.g. [this](https://github.com/IdentityModel/IdentityModel.AspNetCore.OAuth2Introspection) one:

```cs
builder.Services.AddAuthentication("token")
    .AddOAuth2Introspection("token", options =>
    {
        options.Authority = Constants.Authority;

        // this maps to the API resource name and secret
        options.ClientId = "resource1";
        options.ClientSecret = "secret";
    });
```

## Supporting Both JWTs And Reference Tokens

It is not uncommon to use the same API with both JWTs and reference tokens. In this case you set up two authentication
handlers, make one the default handler and provide some forwarding logic, e.g.:

```cs
builder.Services.AddAuthentication("token")

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

The logic of the forward selector looks like this:

```cs
/// <summary>
/// Provides a forwarding func for JWT vs reference tokens (based on existence of dot in token)
/// </summary>
/// <param name="introspectionScheme">Scheme name of the introspection handler</param>
/// <returns></returns>
public static Func<HttpContext, string> ForwardReferenceToken(string introspectionScheme = "introspection")
{
    string Select(HttpContext context)
    {
        var (scheme, credential) = GetSchemeAndCredential(context);

        if (scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase) &&
            !credential.Contains("."))
        {
            return introspectionScheme;
        }

        return null;
    }

    return Select;
}

/// <summary>
/// Extracts scheme and credential from Authorization header (if present)
/// </summary>
/// <param name="context"></param>
/// <returns></returns>
public static (string, string) GetSchemeAndCredential(HttpContext context)
{
    var header = context.Request.Headers["Authorization"].FirstOrDefault();

    if (string.IsNullOrEmpty(header))
    {
        return ("", "");
    }

    var parts = header.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    if (parts.Length != 2)
    {
        return ("", "");
    }

    return (parts[0], parts[1]);
}
```
