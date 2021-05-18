---
title: "Reverse Proxy"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

You can customize the proxy behavior in two was

* provide a customized HTTP client for outgoing calls
* provide custom request/response transformation

### Custom HTTP clients
By default, Duende.BFF will create and cache an HTTP client (or rather an *HttpMessageInvoker* to be more specific) per configured route or local path.

This invoker is setup like this:

```cs
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

..and override our registration:

```cs
services.AddSingleton<IHttpMessageInvokerFactory, MyInvokerFactory>();
```

### Custom transformations
HTTP requests are being transformed before forwarded to the remote API:

* all request headers besides *Accept*, *Content-Length* and *Content-Type* are removed
* the local path of the API URL gets removed (can be configured on the options)
* an access token gets attached (depends on endpoint configuration)
* X-Forwarded headers are created or forwarded based on the options
* customer headers get forwarded if configured on the options

The response from the remote API is returned to the frontend unchanged.

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

{{% notice note %}}
The transformations are based on YARP's transform library and are extensible. See [here](https://microsoft.github.io/reverse-proxy/articles/transforms.html) for a full list of built-in transforms.
{{% /notice %}}