---
title: "Session Expiration"
weight: 20
---

If a user abandons their session without triggering logout, then, by default, the server-side session data will remain in the store.
In order to clean up these expired records, there is an automatic cleanup mechanism that periodically scans for expired sessions.
When these records are cleaned up, you can optionally notify the client that the session has ended via back-channel logout.

## Expiration Configuration

The expiration configuration features can be configured with the [server-side session options]({{<ref "/reference/options#server-side-sessions">}}).
It is enabled by default, but if you wish to disable it or change the frequency it runs you can. 

For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options => {
        options.ServerSideSessions.RemoveExpiredSessionsFrequency = TimeSpan.FromSeconds(60);
    })
        .AddServerSideSessions();
}
```

### Back-channel Logout
When these expired records are removed you can optionally trigger [back-channel logout notification]({{<ref "/ui/logout/notification#back-channel-server-side-clients">}}). 
To do so, you must enable the feature with the *ExpiredSessionsTriggerBackchannelLogout* option on the [server-side session options]({{<ref "/reference/options#server-side-sessions">}}). 
This is not enabled by default.

For example:

```cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddIdentityServer(options => {
        options.ServerSideSessions.ExpiredSessionsTriggerBackchannelLogout = true;
    })
        .AddServerSideSessions();
}
```
