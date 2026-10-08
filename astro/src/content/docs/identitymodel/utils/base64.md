---
title: Base64 URL Encoding
date: 2025-11-12
lastmod: 2026-10-07
description: Documentation for Base64 URL encoding and decoding utilities in Duende IdentityModel, used for JWT token serialization
sidebar:
  label: Base64 URL Encoding
  order: 2
redirect_from:
  - /foss/identitymodel/utils/base64/
---

## What is Base64 URL Encoding?

**Base64 URL encoding** (Base64URL) is a URL-safe variant of standard Base64 defined in
[RFC 4648 §5](https://tools.ietf.org/html/rfc4648#section-5). It replaces the two characters that are unsafe in URLs and
HTTP headers, replacing `+` and `/` with `-` and `_`, and omits the `=` padding. This makes the encoded value safe to
place
directly in a URL, query string, or HTTP header without additional percent-encoding.

## Base64 vs Base64 URL Encoding

| Aspect                 | Standard Base64            | Base64 URL (Base64URL)   |
|------------------------|----------------------------|--------------------------|
| Character for index 62 | `+`                        | `-`                      |
| Character for index 63 | `/`                        | `_`                      |
| Padding                | `=` appended               | Padding omitted          |
| URL / header safe      | No (requires escaping)     | Yes                      |
| Typical use            | Email, generic binary data | JWTs, URLs, HTTP headers |

JWT serialization involves transforming the three core components of a JWT (Header, Payload, Signature) into a single,
compact, URL-safe string. Base64 URL encoding is used instead of
standard Base64 because it doesn't include characters like `+`, `/`, or `=`, making it safe to use directly in URLs and
HTTP headers without requiring further encoding.

In newer .NET versions, you can use the `Base64Url` class found in the `System.Buffers.Text` namespace to decode Base64
payloads using the `DecodeFromChars` method:

```csharp
using System.Buffers.Text;

var jsonString = Base64Url.DecodeFromChars(payload);
```

Encoding can be done using the `EncodeToString` method:

```csharp
using System.Buffers.Text;

var bytes = Encoding.UTF8.GetBytes("some string");
var encodedString = Base64Url.EncodeToString(bytes);
```

Alternatively, ASP.NET Core has built-in support for Base64 encoding and decoding via
[WebEncoders.Base64UrlEncode][ms-b64-encode] and [WebEncoders.Base64UrlDecode][ms-b64-decode].

To use these methods, ensure you have the following package installed:

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

[ms-b64-encode]: https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.webutilities.webencoders.base64urlencode

[ms-b64-decode]: https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.webutilities.webencoders.base64urldecode
