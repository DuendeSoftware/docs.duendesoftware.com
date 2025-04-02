---
title: "Using JWTs"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 10
---

On ASP.NET Core, you typically use the [JWT authentication handler](https://www.nuget.org/packages/Microsoft.AspNetCore.Authentication.JwtBearer) for validating JWT bearer tokens.

## Validating a JWT token
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

## Adding audience validation
Simply making sure that the token is coming from a trusted issuer is not good enough for most cases.
In more complex systems, you will have multiple resources and multiple clients. Not every client might be authorized to access every resource.

In OAuth there are two complementary mechanisms to embed more information about the "functionality" that the token is for - `audience` and `scope` (see [defining resources](../fundamentals/resources) for more information).

If you designed your APIs around the concept of [API resources](../fundamentals/resources/api_resources), your IdentityServer will emit the `aud` claim by default (`api1` in this example):

```json
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
