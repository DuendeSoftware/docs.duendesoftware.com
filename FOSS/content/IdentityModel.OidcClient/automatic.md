+++
title = "Automatic Mode"
weight = 20
+++

In automatic mode, you can encapsulate all browser interactions by
implementing the
[IBrowser](https://github.com/IdentityModel/IdentityModel.OidcClient/blob/main/src/OidcClient/Browser/IBrowser.cs)
interface:

```
var options = new OidcClientOptions
{
    Authority = "https://demo.identityserver.io",
    ClientId = "native",
    RedirectUri = redirectUri,
    Scope = "openid profile api",
    Browser = new SystemBrowser() 
};

var client = new OidcClient(options);
```

Once that is done, authentication and token requests become one line of
code:

```
var result = await client.LoginAsync();
```
