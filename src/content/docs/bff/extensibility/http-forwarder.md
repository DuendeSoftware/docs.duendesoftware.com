---
title: "HTTP Forwarder"
description: Learn how to customize the HTTP forwarding behavior in BFF by providing custom HTTP clients and request/response transformations
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 40
redirect_from:
  - /bff/v2/extensibility/http_forwarder/
  - /bff/v3/extensibility/http_forwarder/
  - /identityserver/v5/bff/extensibility/proxy/
  - /identityserver/v6/bff/extensibility/http_forwarder/
  - /identityserver/v7/bff/extensibility/http_forwarder/
---

You can customize the HTTP forwarder behavior in two ways

* provide a customized HTTP client for outgoing calls
* provide custom request/response transformation

## Custom HTTP clients
By default, Duende.BFF will create and cache an HTTP client per configured route or local path.

This invoker is set up like this:

```csharp
var client = new HttpMessageInvoker(new SocketsHttpHandler
{
    UseProxy = false,
    AllowAutoRedirect = false,
    AutomaticDecompression = DecompressionMethods.None,
    UseCookies = false
});
```

If you want to customize the HTTP client you can either implement the *IForwarderHttpClientFactory* interface, e.g.:

```cs
public class MyInvokerFactory : IForwarderHttpClientFactory
{
    public public HttpMessageInvoker CreateClient(ForwarderHttpClientContext context)
    {
        return Clients.GetOrAdd(localPath, (key) =>
        {
            return new HttpMessageInvoker(new SocketsHttpHandler
            {
                // this API needs a proxy
                UseProxy = true,
                Proxy = new WebProxy("https://myproxy"),
                
                AllowAutoRedirect = false,
                AutomaticDecompression = DecompressionMethods.None,
                UseCookies = false
            });
        });
    }
}
```

...and override our registration:

```cs
services.AddSingleton<IForwarderHttpClientFactory, MyInvokerFactory>();
```

## Custom transformations when using Direct Forwarding

The method MapRemoteBffApiEndpoint uses default transformations that:
* removes the cookie header from the forwarded request
* removes local path from from the forwarded request
* Adds the access token to the original request

If you wish to change or extend this behavior, you can do this for a single mapped endpoint
or for all mapped api endpoints. 

### Changing the transformer for a single mapped endpoint

This code block shows an example how you can extend the default transformers with an additional custom
transform. 

```csharp

app.MapRemoteBffApiEndpoint("/local", new Uri("https://target/"), context => {

    // If you want to extend the existing behavior, then you must call the default builder:
    DefaultBffYarpTransformerBuilders.DirectProxyWithAccessToken("/local", context);

    //You can also add custom transformers, such as this one that adds an additional header
    context.AddRequestHeader("custom", "with value");

});

```

The default transformbuilder performs these transforms:

```csharp
context.AddRequestHeaderRemove("Cookie");
context.AddPathRemovePrefix(localPath);
context.AddBffAccessToken(localPath);
```

For more information, also see the [yarp documentation on transforms](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms?view=aspnetcore-9.0)

### Changing the default transformer. 

You can change the default transformer builder delegate by registering one in the services collection:

```csharp
BffYarpTransformBuilder builder = (localPath, context) => {

    // If you want to extend the existing behavior, then you must call the default builder:
    DefaultBffYarpTransformerBuilders.DirectProxyWithAccessToken(localpath, context);

   //You can also add custom transformers, such as this one that adds an additional header
    context.AddResponseHeader("added-by-custom-default-transform", "some-value");

};

services.AddSingleton<BffYarpTransformBuilder>(builder);
```

## Changing the Forwarder Request Config

You an also modify the forwarder request config, either globally or per mapped path.
This can be useful if you want to tweak things like activity timeouts. 

```csharp

// Register a forwarder config globally. 
services.AddSingleton(new ForwarderRequestConfig()
{
    ActivityTimeout = TimeSpan.FromMilliseconds(100)
});

// Or modify one on a per mapped route basis:
app.MapRemoteBffApiEndpoint("/local", new Uri("https://target/"),
    requestConfig: new ForwarderRequestConfig()
    {
        // 100 ms timeout, which is not too short that the normal process might fail,
        // but not too long that the test will take forever
        ActivityTimeout = TimeSpan.FromMilliseconds(100)
    });

```



