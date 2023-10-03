---
title: "Session Expiration"
weight: 20
---

If a user abandons their session without triggering logout, the server-side session data will remain in the store by default.
In order to clean up these expired records, there is an automatic cleanup mechanism that periodically scans for expired sessions.
When these records are cleaned up, you can optionally notify the client that the session has ended via back-channel logout.

## Expiration Configuration

The expiration configuration features can be configured with the [server-side session options]({{<ref "/reference/options#server-side-sessions">}}).
It is enabled by default, but if you wish to disable it or change how often IdentityServer will check for expired sessions, you can. 

For example:

```
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options => {
        options.ServerSideSessions.RemoveExpiredSessionsFrequency = TimeSpan.FromSeconds(60);
    })
        .AddServerSideSessions();
}
```

### Back-channel Logout
When the session cleanup job removes expired records, it will by default also trigger [back-channel logout notifications]({{<ref "/ui/logout/notification#back-channel-server-side-clients">}}) to client applications participating in the session. You can use this mechanism to create an [inactivity timeout]({{<ref "inactivity_timeout">}}) that applies across all your client applications.

The *ServerSideSessions.ExpiredSessionsTriggerBackchannelLogout* flag enables this behavior, and it is on by default.

