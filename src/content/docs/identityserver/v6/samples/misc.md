---
title: "Miscellaneous"
order: 1000
---

### Securing Azure Functions
This sample shows how to parse and validate a JWT token issued by IdentityServer inside an Azure Function.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/various/JwtSecuredAzureFunction)

### Mutual TLS using Kestrel 
This sample shows how to use Kestrel using MTLS for [client authentication](../tokens/authentication/mtls) and [proof of possession](../tokens/pop) API access.
Using Kestrel will not likely be how MTLS is configured in a production environment, but it is convenient for local testing.
This approach requires DNS entries for *mtls.localhost* and *api.localhost* to resolve to *127.0.0.1*, and is easily configured by modifying your local *hosts* file.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/MTLS)

### DPoP
This sample shows how to access APIs using DPoP for [proof of possession](../tokens/pop/dpop).
It contains two different clients; one that uses client credentials and DPoP tokens, and another that is an interactive ASP.NET Core app using code flow to obtain the DPoP bound tokens. Both clients demonstrate the use of the *Duende.AccessTokenManagement* library with DPoP.
The sample also contains an API with the necessary helper code to accept and validate DPoP bound access tokens. 

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/DPoP)

### Session Management

This sample shows how to enable [server-side sessions](../ui/server_side_sessions) and configure the basic settings.
The sample requires all three projects to be run at once.

Things of note:
* In the *IdentityServerHost* project in *Startup.cs*, server-side sessions are enabled with a call to *AddServerSideSessions*. This only uses in-memory server-side sessions by default, so restarting the host will lose session data.
*  Also in *Startup.cs* with the call to *AddIdentityServer* various settings are configured on the *ServerSideSessions* options object to control the behavior.
* The client application configured in *Clients.cs* has *CoordinateLifetimeWithUserSession* enabled, which causes its refresh token to slide the server-side session for the user.
* When launching the *IdentityServerHost* project, you should visit the *~/serversidesessions* page to see the active sessions. Note that there is no authorization on this page (so consider adding it based on your requirements).
* Once you login, you should see a user's session in the list.
* As the client app refreshes its access token, you should see the user's session expiration being extended.
* When you revoke the user's session, the user should be logged out of the client app.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/SessionManagement)

### Session Migration
This sample shows how to do seamless migration of existing cookie-based session when enabling server side sessions. Normally when server side sesssions are enabled all existing logged in sessions are invalidated
and the users are forced to log in again. If the application has sessions with long lifetimes where it would be a problem to have all users log in again the sessions can be migrated. Instructions for running the
sample are in the HostingExtensions.cs file.

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v6/SessionMigration)
