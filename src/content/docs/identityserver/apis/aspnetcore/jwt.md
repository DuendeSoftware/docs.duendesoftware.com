---
title: "Using JSON Web Tokens (JWTs)"
description: "Guide for validating JWT bearer tokens in ASP.NET Core applications using the JWT authentication handler"
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: JWTs
  order: 10
redirect_from:
  - /identityserver/v5/apis/aspnetcore/jwt/
  - /identityserver/v6/apis/aspnetcore/jwt/
  - /identityserver/v7/apis/aspnetcore/jwt/
---

On ASP.NET Core, you typically use the [JWT authentication handler](https://www.nuget.org/packages/Microsoft.AspNetCore.Authentication.JwtBearer) for validating JWT bearer tokens.

## Validating A JWT

First you need to add a reference to the authentication handler in your API project:

```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
```

If all you care about is making sure that an access token comes from your trusted IdentityServer, the following snippet shows the typical JWT validation configuration for ASP.NET Core:

```cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // base-address of your identityserver
        options.Authority = "https://demo.duendesoftware.com";

        // audience is optional, make sure you read the following paragraphs
        // to understand your options
        options.TokenValidationParameters.ValidateAudience = false;

        // it's recommended to check the type header to avoid "JWT confusion" attacks
        options.TokenValidationParameters.ValidTypes = new[] { "at+jwt" };
    });
```

## Adding Audience Validation

Simply making sure that the token is coming from a trusted issuer is not good enough for most cases.
In more complex systems, you will have multiple resources and multiple clients. Not every client might be authorized to access every resource.

In OAuth there are two complementary mechanisms to embed more information about the "functionality" that the token is for - `audience` and `scope` (see [defining resources](/identityserver/fundamentals/resources/api-resources.md) for more information).

If you designed your APIs around the concept of [API resources](/identityserver/fundamentals/resources/api-resources.md), your IdentityServer will emit the `aud` claim by default (`api1` in this example):

```text
{
    "typ": "at+jwt",
    "kid": "123"
}.
{
    "aud": "api1",

    "client_id": "mobile_app",
    "sub": "123",
    "scope": "read write delete"
}
```

If you want to express in your API, that only access tokens for the `api1` audience (aka API resource name) are accepted, change the above code snippet to:

```cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://demo.duendesoftware.com";
        options.Audience = "api1";

        options.TokenValidationParameters.ValidTypes = new[] { "at+jwt" };
    });
```

:::tip[Dynamic Proof-of-Possession (DPoP) validation]
You can make use of the [JwtBearer Extensions](/identityserver/apis/aspnetcore/confirmation.md#validating-dpop) to validate Dynamic Proof-of-Possession (DPoP) access tokens in ASP.NET Core.
:::