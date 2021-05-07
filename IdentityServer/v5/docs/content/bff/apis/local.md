---
title: "Local APIs"
weight: 10
---

A local API can be any invocable functionality that is located inside the BFF host, e.g. an MVC controller or just a simple endpoint.

These endpoints need to be secured to make sure that only the frontend can call them. We recommend doing this using two layers of protection:

**SameSite cookies**

SameSite cookies are a built-in feature of modern browsers to make sure that a cookie only gets sent from a page that originates from the same site where the cookie was originally issued on.

This is a good first layer of defense, but makes the assumption that you can trust all sub-domains of your top-level site, e.g. **.mycompany.com*.

**Anti-forgery header**

In addition to the cookie protection, we recommend requiring an additional custom header, e.g.:

```
GET /endpoint

x-csrf: 1
```

The fact that the header value is static is really not important - but its presence in combination with the cookie requirement will trigger CORS preflight request for cross-origin calls. This effectively sandboxes the caller to the same origin as the backend which is a very strong security guarantee.

In addition, API endpoints also need some special treatment in situations where the session has expired, or authorization fails. In these cases you want to avoid trigger an authentication redirect to the upstream IdP, but instead return Ajax-friendly status codes

### Setup
Duende.BFF can automate above pre/post-processing of API endpoints. For that you need to add the BFF middleware to the pipeline:

```csharp
public void Configure(IApplicationBuilder app)
{
    // rest omitted

    app.UseAuthentication();
    app.UseRouting();

    app.UseBff();

    app.UseAuthorization();

    app.UseEndpoints(endpoints => { ... }
}
```

{{% notice note %}}
The BFF middleware must be placed before the authorization middleware.
{{% /notice %}}

In addition, the endpoints that need the processing must be decorated, e.g.:

```csharp
app.UseEndpoints(endpoints =>
{
    // MVC controllers
    endpoints.MapControllers()
        .RequireAuthorization()    // no anonymous access
        .AsLocalBffApiEndpoint();  // BFF pre/post processing

    // simple endpoint
    endpoints.MapPost("/foo", context => { ... })
        .RequireAuthorization()
        .AsLocalBffApiEndpoint();
});
```

...or using a controller/action level attribute:

```csharp
[Route("myApi")]
[BffLocalApiEndpoint]
public class MyApiController : ControllerBase
{ ... }
```

{{% notice note %}}
You can disable the anti-forgery protection requirement by using the *DisableAntiforgeryProtection* extension method on the endpoint or passing a flag into the attribute. This is not recommended.
{{% /notice %}}