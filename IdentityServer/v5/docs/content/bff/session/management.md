---
title: "Session Management Endpoints"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

Duende.BFF adds endpoints for managing typical session-related operations like triggering login and logout and getting information about the currently logged-on user. These endpoint are meant to be called by the frontend.

In addition we add an implementation of the OpenID Connect back-channel notification endpoint to overcome the restrictions of third party cookies in front-channel notification in modern browsers.

You enable the endpoints by adding the relevant services into the DI container:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    // Add BFF services to DI - also add server-side session management
    services.AddBff(options => 
    {
        // default value
        options.ManagementBasePath = "/bff";
    });

    // rest omitted
}
```

Endpoint routing is used to map the management endpoints:

```csharp
public void Configure(IApplicationBuilder app)
{
    // rest omitted

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapBffManagementEndpoints();
    });
```

{{% notice note %}}
*MapBffManagementEndpoints* adds all BFF management endpoints. You can also map every endpoint individually by calling the various *MapBffManagementXxxEndpoint* APIs, for example *endpoints.MapBffManagementLoginEndpoint()*.
{{% /notice %}}

The following describes the default behavior of those endpoints. See the [extensibility]({{< ref "/bff/extensibility" >}}) section for more information how to provide custom implementations.

### Login
The login endpoint triggers authentication with the scheme configured for challenge (typically the OpenID Connect handler).

```
GET /bff/login
```

By default the login endpoint will redirect back to the root of the application after authentication is done. Alternatively you can use a different local URL instead:

```
GET /bff/login?returnUrl=/page2
```

### User
The user endpoint returns data about the currently logged-on user and the session.

{{% notice note %}}
To protect against cross-site request forgery, you need to add a static header to the GET request. Both header name and  value can be configured on the [options]({{< ref "/bff/options" >}}).
{{% /notice %}}

```
GET bff/user

x-csrf: 1
```

If there is no current session, the user endpoint will return a 401 status code. This endpoint can also be used to periodically query if the session is still valid.

If your backend uses sliding cookies, you typically want to avoid that querying the session will extend the session lifetime. Adding the *slide=false* query string parameter to the URL will prohibit that.

{{% notice note %}}
This features requires either usage of server-side sessions, or .NET 6 or higher (or both).
{{% /notice %}}

```
GET bff/user?slide=false

x-csrf: 1
```

If there is a valid session, the user endpoint returns a JSON array containing the contents of the ASP.NET Core authentication session and BFF specific management data, e.g.:

```json
[
  {
    "type": "sid",
    "value": "173E788068FFB728806501F4F46C52D6"
  },
  {
    "type": "sub",
    "value": "88421113"
  },
  {
    "type": "idp",
    "value": "local"
  },
  {
    "type": "name",
    "value": "Bob Smith"
  },
  {
    "type": "bff:logout_url",
    "value": "/bff/logout?sid=173E788068FFB728806501F4F46C52D6"
  },
  {
    "type": "bff:session_expires_in",
    "value": 28799
  },
  {
    "type": "bff:session_state",
    "value": "q-Hl1V9a7FCZE5o-vH9qpmyVKOaeVfMQBUJLrq-lDJU.013E58C33C7409C6011011B8291EF78A"
  }
]
```

{{% notice note %}}
You can customize the contents of the ASP.NET Core session via the OpenID Connect handler's [ClaimAction](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.claimactioncollectionmapextensions?view=aspnetcore-5.0) infrastructure, or using [claim transformation](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.iclaimstransformation?view=aspnetcore-5.0).
{{% /notice %}}

Duende.BFF adds three additional elements to the list:

**bff:session_expires_in**

This is the number of seconds the current session will be valid for

**bff:session_state**

This is the session state value of the upstream OIDC provider that can be use for the JavaScript *check_session* mechanism (if provided).

**bff:logout_url**

This is the URL to trigger logout. If the upstream provider includes an *sid* claim, the BFF logout endpoint requires this value as a query string parameter for CSRF protection. This behavior can be configured on the [options]({{< ref "/bff/options" >}}).

### Logout
This endpoint triggers local and upstream logout. If the upstream IdP sent a session ID, this must be appended to the URL:

```
GET /bff/logout?sid=xyz
```

By default the logout endpoint will redirect back to the root of the application after logout is done. Alternatively you can use a local URL instead:

```
GET /bff/logout?sid=xyz&returnUrl=/loggedout
```

{{% notice note %}}
The logout endpoint will trigger revocation of the user's refresh token (if present). This can be configured on the [options]({{< ref "/bff/options" >}}).
{{% /notice %}}

### Back-channel logout notifications
The */bff/backchannel* endpoint is an implementation of the [OpenID Connect Back-Channel Logout](https://openid.net/specs/openid-connect-backchannel-1_0.html) specification.

The endpoint will call the registered session revocation service to revoke the user session when it receives a valid logout token. You need to enable server-side session for this feature to work.

{{% notice note %}}
By default, only the specific session of the user will be revoked. Alternatively, you can configure the endpoint to revoke every session that belongs to the given subject ID.
{{% /notice %}}
