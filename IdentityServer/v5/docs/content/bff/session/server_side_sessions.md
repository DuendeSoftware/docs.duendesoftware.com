---
title: "Server-side Sessions"
weight: 40
---

By default, ASP.NET Core's cookie handler will store all user session data in a protected cookie. This works very well unless cookie size or revocation becomes an issue.

Duende.BFF includes all the plumbing to store your sessions server-side. The cookie will then only be used to transmit the session ID between the browser and the BFF host. This has the following advantages

* the cookie size will be very small and constant - regardless how much data (e.g. token or claims) is stored in the authentication session
* the session can be also revoked outside the context of a browser interaction, for example when receiving a back-channel logout notification from the upstream OpenID Connect provider

Server-side session can be enabled in *startup*:

```csharp
services.AddBff()
    .AddServerSideSessions();
```

The default implementation stores the session in-memory on the server. This is useful for testing, for production you typically want a more robust storage mechanism. 

We provide an EntityFramework Core-based session store implementation (e.g. for SQL Server):

```csharp
var cn = _configuration.GetConnectionString("db");
        
services.AddBff()
    .AddEntityFrameworkServerSideSessions(options=> 
    {
        options.UseSqlServer(cn);        
    });
```

You can also use a custom store, see [extensibility]({{< ref "/bff/extensibility" >}}) for more information.