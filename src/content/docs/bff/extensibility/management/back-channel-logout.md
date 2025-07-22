---
title: "BFF Back-Channel Logout Endpoint Extensibility"
date: 2022-12-29T10:22:12+02:00
sidebar:
  label: "Back-Channel Logout"
  order: 60
redirect_from:
  - /bff/v2/extensibility/management/back-channel-logout/
  - /bff/v3/extensibility/management/back-channel-logout/
  - /identityserver/v5/bff/extensibility/management/back-channel-logout/
  - /identityserver/v6/bff/extensibility/management/back-channel-logout/
  - /identityserver/v7/bff/extensibility/management/back-channel-logout/
---

The back-channel logout endpoint has several extensibility points organized into two interfaces. The *IBackChannelLogoutEndpoint* is the top level abstraction that processes requests to the endpoint. This service can be used to add custom request processing logic or to change how it validates incoming requests. When the back-channel logout endpoint receives a valid request, it revokes sessions using the *ISessionRevocationService*. 

## Request Processing
You can add custom logic to the endpoint by implementing the *IBackChannelLogoutEndpoint* .

*ProcessRequestAsync* is the top level function called in the endpoint service and can be used to add arbitrary logic to the endpoint.

```csharp
public class CustomizedBackChannelLogoutService : IBackChannelLogoutEndpoint
{
    public override Task ProcessRequestAsync(HttpContext context, CancellationToken ct)
    {
        // Custom logic here
    }
}
```


## Session Revocation
The back-channel logout service will call the registered session revocation service to revoke the user session when it receives a valid logout token. To customize the revocation process, implement the *ISessionRevocationService*. 