---
title: "IHttpResponseWriter"
description: Documentation for the IHttpResponseWriter interface, a low-level abstraction for customizing serialization, encoding, and HTTP headers in protocol endpoint responses.
sidebar:
  order: 100
redirect_from:
  - /identityserver/v5/reference/response_handling/http_response_writer/
  - /identityserver/v6/reference/response_handling/http_response_writer/
  - /identityserver/v7/reference/response_handling/http_response_writer/
---

The `IHttpResponseWriter` interface is the contract for services that can produce HTTP responses for `IEndpointResult`s.
This is a low level abstraction that is intended to be used if you need to customize the serialization, encoding, or
HTTP headers in a response from a protocol endpoint.

#### Duende.IdentityServer.Hosting.IHttpResponseWriter

```csharp
/// <summary>
/// Contract for a service that writes appropriate http responses for <see
/// cref="IEndpointResult"/> objects.
/// </summary>
public interface IHttpResponseWriter<in T>
    where T : IEndpointResult
{
    /// <summary>
    /// Writes the endpoint result to the HTTP response.
    /// </summary>
    Task WriteHttpResponse(T result, HttpContext context);
}
```

#### Duende.IdentityServer.Hosting.IEndpointResult

```csharp
/// <summary>
/// An <see cref="IEndpointResult"/> is the object model that describes the
/// results that will returned by one of the protocol endpoints provided by
/// IdentityServer, and can be executed to produce an HTTP response.
/// </summary>
public interface IEndpointResult
{
    /// <summary>
    /// Executes the result to write an http response.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    Task ExecuteAsync(HttpContext context);
}
```
