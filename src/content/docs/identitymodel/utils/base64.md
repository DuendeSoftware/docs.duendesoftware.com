---
title: Base64 URL Encoding
date: 2024-04-17
description: Documentation for Base64 URL encoding and decoding utilities in IdentityModel, used for JWT token serialization
sidebar:
  label: Base64 URL Encoding
  order: 2
redirect_from:
  - /foss/identitymodel/utils/base64/
---

:::note
ASP.NET Core has built-in support for Base64 encoding and decoding via
[WebEncoders.Base64UrlEncode][ms-b64-encode] and [WebEncoders.Base64UrlDecode][ms-b64-decode].
:::

JWT serialization involves transforming the three core components of a JWT (Header, Payload, Signature) into a single,
compact, URL-safe string. [Base64 URL encoding](https://tools.ietf.org/html/rfc4648#section-5) is used instead of
standard Base64 because it doesn't include characters like `+`, `/`, or `=`, making it safe to use directly in URLs and
HTTP headers without requiring further encoding.

## WebEncoders Encode and Decode

To use the built-in .NET support, ensure you have the following package installed:

```bash
dotnet add package Microsoft.AspNetCore.WebUtilities
```

Then use the following code:

```csharp
using System.Text;
using Microsoft.AspNetCore.WebUtilities;

var bytes = "hello"u8.ToArray();
var b64url = WebEncoders.Base64UrlEncode(bytes);

bytes = WebEncoders.Base64UrlDecode(b64url);

var text = Encoding.UTF8.GetString(bytes); 
Console.WriteLine(text);
```

## IdentityModel's Base64Url

IdentityModel includes the `Base64Url` class to help with
encoding/decoding:

```csharp
using System.Text;
using Duende.IdentityModel;

var bytes = "hello"u8.ToArray();
var b64url = Base64Url.Encode(bytes);

bytes = Base64Url.Decode(b64url);

var text = Encoding.UTF8.GetString(bytes); 
Console.WriteLine(text);
```

[ms-b64-encode]: https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.webutilities.webencoders.base64urlencode

[ms-b64-decode]: https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.webutilities.webencoders.base64urldecode
