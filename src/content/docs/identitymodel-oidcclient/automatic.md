---
title: Automatic Mode
sidebar:
  order: 3
redirect_from:
  - /foss/identitymodel-oidcclient/automatic/
---

In automatic mode, you can encapsulate all browser interactions by
implementing the
[IBrowser](https://github.com/DuendeArchive/IdentityModel.OidcClient/blob/main/src/OidcClient/Browser/IBrowser.cs)
interface:

```cs
var options = new OidcClientOptions
{
    Authority = "https://demo.duendesoftware.com",
    ClientId = "native",
    RedirectUri = redirectUri,
    Scope = "openid profile api",
    Browser = new SystemBrowser() 
};

var client = new OidcClient(options);
```

Once that is done, authentication and token requests become one line of
code:

```cs
var result = await client.LoginAsync();
```
