---
title: "Multi-frontend support"
description: Overview on what BFF multi-frontend support is, how it works and why you would use it. 
date: 2024-06-11T08:22:12+02:00
sidebar:
  label: "Multiple Frontends"
  order: 5
  badge:
    text: v4
    variant: tip
---

BFF V4.0 introduces the capability to support multiple BFF Frontends in a single host. This helps to simplify your 
application landscape by consolidating multiple physical BFF Hosts into a single deployable unit. 

A single BFF setup consists of:
1. A browser based application, typically built using technology like React, Angular or VueJS. This is typically deployed to a Content Delivery Network (CDN). 
2. A BFF host, that will take care of the OpenID Connect login flows. 
3. An API surface, exposed and protected by the BFF. 

With the BFF Multi-frontend support, you can logically host multiple of these BFF Setups in a single host. The concept
of a single frontend (with OpenID Connect configuration, an API surface and a browser based app) is now codified inside
the BFF. By using a flexible frontend selection mechanism (using Hosts or Paths to distinguish), it's possible to
create very flexible setups. 

The BFF dynamically configures the aspnet core authentication pipeline according to recommended practices. For example, 
when doing Host based routing, it will configure the cookies using the most secure settings and with the prefix
[`__Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie). 

Frontends can be added or removed dynamically from the system, without having to restart the system. You can do this 
via configuration (for example by modifying a configuration file) or programmatically. 

:::note
The Duende BFF V4 library doesn't ship with an abstraction to store or read frontends from a database. It's possible 
to implement this by creating your own store (based on your requirements), then modify the `FrontendCollection` at 
run-time. 
:::

## A Typical Example

Consider an enterprise that hosts multiple browser based applications. Each of these applications is developed by a 
separate team and as such, has its own deployment schedule. 

There are some internal-facing applications that are exclusively used by internal employees. These internal employees
are all present in Microsoft Entra ID, so these internal-facing applications should directly authenticate against 
Microsoft Entra ID. These applications also use several internal APIs, that due to the sensitivity, should not be 
accessible by external users. However, they also use some of the more common APIs. These apps are only accessible via 
an internal DNS name, such as `https://app1.internal.example.com`. 

There are also several public facing applications, that are used directly by customers. These users should be able to 
log in using their own identity, via providers like Google, Twitter, or others. This authentication process is handled
by Duende IdentityServer. There is constant development ongoing on these applications and it's not uncommon for new
applications to be introduced. There should be single sign-on across all these public facing applications. They are 
all available on the same domain name, but use path based routing to distinguish themselves, such as
`https://app.example.com/app1`

There is also a partner portal. This partner portal can only be accessed by employees of the partners. Each partner 
should be able to bring their own identity provider. This is implemented using the [Dynamic Providers](/identityserver/ui/login/dynamicproviders.md) feature of
Duende IdentityServer. 

This setup, with multiple frontends, each having different authentication requirements and different API surfaces, 
is now supported by the BFF. 

Each frontend can either rely on the global configuration or override (parts of) this configuration, such as the
identity provider or the Client ID and Client Secret to use. 

It's also possible to dynamically add or remove frontends, without restarting the BFF host. 

## Internals

BFF V4 still allows you to manually configure the ASP.NET Core authentication options, by calling `.AddAuthentication().AddOpenIdConnect().AddCookies()`. However, if you wish to use the multi-frontend features, then this setup needs to become dynamic. 

To achieve this, the BFF automatically configures the ASP.NET Core pipeline:

![BFF Multi-Frontend Pipeline](../images/bff_multi_frontend_pipeline.svg)

1. `FrontendSelectionMiddleware` - This middleware performs the frontend selection by seeing which frontend's selection criteria best matches the incoming request route. It's possible to mix both path based routing and host based routing, so the most specific will be selected. 
2. `PathMappingMiddleware` - If you use path mapping, in the selected frontend, then it will automatically map the frontend's path so none of the subsequent middlewares know (or need to care) about this fact. 
3. `OpenIdCallbackMiddleware` - To dynamically perform the OpenID Connect authentication without explicitly adding each frontend as a scheme, we inject a middleware that will handle the OpenID Connect callbacks. This only kicks in for dynamic frontends.
4. Your own applications logic is executed in this part of the pipeline. For example, calling `.UseAuthentication(), .UseRequestLogging()`, etc. 

After your application's logic is executed, there are two middlewares registered as fallback routes:

5. `MapRemoteRoutesMiddleware` - This will handle any configured remote routes. Note, it will not handle plain YARP calls, only routes that are specifically added to a frontend.
    
6. `ProxyIndexMiddleware` - If configured, this proxies the `index.html` to start the browser based app.  

If you don't want this automatic mapping of BFF middleware, you can turn it off using `BffOptions.AutomaticallyRegisterBffMiddleware`. When doing so, you'll need to manually register and add the middlewares:

```csharp
var app = builder.Build();

app.UseBffPreProcessing();

// TODO: your custom middleware goes here
app.UseRouting(); 
app.UseBff();

app.UseBffPostProcessing();

app.Run();
```

## Authentication Architecture

When you use multiple frontends, you can't rely on [manual authentication configuration](/bff/fundamentals/session/handlers.mdx#manually-configuring-authentication). This is because each frontend requires its own scheme, and potentially its own OpenID Connect and Cookie configuration. 

The BFF registers a dynamic authentication scheme, which automatically configures the OpenID Connect and Cookie Scheme's on behalf of the frontends. It does this using a custom `AuthenticationSchemeProvider` called `BffAuthenticationSchemeProvider` to return appropriate authentication schemes for each frontend. 

The BFF will register two schemes:
* `duende-bff-oidc`
* `duende-bff-cookie`

Then, if there are no default authentication schemes registered, it will register 'duende_bff_cookie' schemes as the `AuthenticationOptions.DefaultScheme`, and 'duende_bff_oidc' as the `AuthenticationOptions.DefaultAuthenticateScheme` and `AuthenticationOptions.DefaultSignOutScheme`. This will ensure that calls to `Authenticate()` or `Signout()` will use the appropriate schemes. 

If you're using multiple frontends, then the BFF will create dynamic schemes with the following signature: `duende_bff_oidc_[frontendname]` and `duende_bff_cookie_[frontendname]`. This ensures that every frontend can use its own OpenID Connect and Cookie settings. 

