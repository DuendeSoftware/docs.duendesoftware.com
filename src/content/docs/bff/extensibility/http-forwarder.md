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

### Custom HTTP clients
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

If you want to customize the HTTP client for specific paths, you can either implement the *IHttpMessageInvokerFactory* interface or derive from the *DefaultHttpMessageInvokerFactory*, e.g.:

```cs
public class MyInvokerFactory : DefaultHttpMessageInvokerFactory
{
    public override HttpMessageInvoker CreateClient(string localPath)
    {
        if (localPath == "/foo")
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
        
        return base.CreateClient(localPath);
    }
}
```

...and override our registration:

```cs
services.AddSingleton<IHttpMessageInvokerFactory, MyInvokerFactory>();
```

### Custom Transformations
In the standard configuration, BFF uses the YARP default behavior for forwarding HTTP requests. In addition, we

* remove the sensitive session cookie
* add the current access token

If you want to modify this behavior you can either implement *IHttpTransformerFactory* from scratch: 

```cs
public interface IHttpTransformerFactory
{
    /// <summary>
    /// Creates a HTTP transformer based on the local path
    /// </summary>
    /// <param name="localPath">Local path the remote API is mapped to</param>
    /// <param name="accessToken">The access token to attach to the request (if present)</param>
    /// <returns></returns>
    HttpTransformer CreateTransformer(string localPath, string accessToken = null);
}
```

...or derive from the *DefaultHttpTransformerFactory*.

:::note
The transformations are based on YARP's transform library and are extensible. See [here](https://microsoft.github.io/reverse-proxy/articles/transforms.html) for a full list of built-in transforms.
:::
