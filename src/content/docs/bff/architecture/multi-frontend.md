---
title: "Multi-frontend support"
description: Overview on what BFF multi-frontend support is, how it works and why you would use it. 
date: 2024-06-11T08:22:12+02:00
---

BFF V4.0 introduces the capability to support multiple BFF Frontends in a single host. This helps to simplify your application landscape by consolidating multiple physical BFF Hosts into a single deployable unit. 

A single BFF setup consists of:
1. A browser based application, typically built using technology like React, Angular or VueJS. This is typically deployed to a CDN. 
2. A BFF host, that will take care of the OpenID Connect login flows. 
3. An api surface, exposed and protected by the BFF. 

With the BFF Multi-frontend support, you can logically host multiple of these BFF Setups in a single host. The concept of a single frontend (with OpenID Connect configuration, an api surface and a browser based app) is now codified inside the BFF. By using a flexibile frontend selection mechanism (using Origins or Paths to distinguish), it's possible to create very flexible setups. 

The BFF dynamically configures the aspnet core authentication pipeline according to recommended practices. For example, when doing Origin based routing, it will configure the cookies using the most secure settings and with the prefix [__Host](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie). 

Frontends can be added or removed dynamically from the system, without having to restart the system. You can do this via configuration (for example by modifying a configuration file) or programmatically. 

:::note
The duende BFF V4 library doesn't ship with an abstraction to store or read frontends from a database. It's possible to implement this by creating your own store (based on your requirements), then modify the **FrontendCollection** at run-time. 
:::

## A typical example

Consider an enterprise who hosts multiple browser based applications. Each of these applications is developed by a separate team and as such, has it's own deployment schedule. 

There are some 'internally facing' applications that are exclusively used by internal employees. These internal employees are all present in Microsoft Entra ID, so these internally facing applications should directly authenticate against Microsoft Entra ID. These applications also use several internal api's, that due to the sensitivity, should not be accessible by external users. However, they also use some of the more common api's. These apps are only accessible via an internal DNS name, such as https://app1.internal.company.com. 

There are also several public facing applications, that are used directly by customers. These users should be able to log in using their own identity, such as a GMail, Twitter or other provider. This authentication process is handled by Duende Identity Server. There is constant development ongoing on these applications and it's not uncommon for new applications to be introduced. There should be single signon across all these public facing applictions. They are all available on the same domain name, but use path based routing to distinguish themselves, such as https://app.company.com/app1

Then there is a partner portal. This partner portal can only be accessed by employees of the partners. Each partner should be able to bring their own identity provider. This is implemented using the Dynamic Providers feature of Duende Identity Server. 

This setup, where there are multiple frontends, which different authentication requirements and different api surfaces, is now supported by the BFF. 

Each frontend can either rely on the 'global' configuration or override (parts of) this configuration, such as the identity provider or the Client ID and Client Secret to use. 

It's also possible to dynamically add or remove frontends, without restarting the BFF host. 

## Internals

BFF V4 still allows you to manually configure the asp.net authentication options, by calling .AddAuthentication().AddOpenIdConnect().AddCookies(). However, if you wish to use the multi-frontend features, then this setup needs to become dynamic. 

To achieve this, the BFF automatically configures the AspNet pipeline:

![BFF Multi-Frontend Pipeline](../images/bff_multi_frontend_pipeline.svg)

1. FrontendSelectionMiddleware. This middleware performs the frontend selection by seeing which frontend's selection criteria best matches the incoming request route. It's possible to mix both path based routing origin based routing, so the most specific will be selected. 
2. PathMappingMiddlweare. If you use path mapping, in the selected frontend, then it will automatically *map()* the frontend's path so none of the subsequent middlewares know (or need to care) about this fact. 
3. OpenIdCallbackMiddlware. To dynamically perform the openid connect authentication without explicitly adding each frontend as a scheme, we inject a middleware that will handle the openid connect callbacks. This only kicks in for dynamic frontends.
4. Your own applications logic is executed in this part of the pipeline. For example, calling .UseAuthentication(), .UseRequestLogging(), etc. 

After your application's logic is executed, there are two middlewares registered as fallback routes:

5. MapRemoteRoutesMiddlware. This will handle any configured remote routes. Note, it will not handle plain yarp calls, only routes that are specifically added to a frontend.
    
6. ProxyIndexMiddleware. If configured, this proxy the IndexHTML to start the browser based app.  


