---
title: "BFF Back-Channel Logout Endpoint"
date: 2022-12-29T10:22:12+02:00
sidebar:
  label: "Back-Channel Logout"
  order: 50
redirect_from:
  - /bff/v2/fundamentals/session/management/back-channel-logout/
  - /bff/v3/fundamentals/session/management/back-channel-logout/
  - /identityserver/v7/bff/session/management/back-channel-logout/
---

The */bff/backchannel* endpoint is an implementation of the [OpenID Connect Back-Channel Logout](https://openid.net/specs/openid-connect-backchannel-1_0.html) specification. The remote identity provider can use this endpoint to end the BFF's session via a server to server call, without involving the user's browser. This design avoids problems with 3rd party cookies associated with front-channel logout.

## Typical Usage
The back-channel logout endpoint is invoked by the remote identity provider when it determines that sessions should be ended.  IdentityServer will send back-channel logout requests if you [configure](/identityserver/reference/models/client#authentication--session-management) your client's *BackChannelLogoutUri*. When a session ends at IdentityServer, any client that was participating in that session that has a back-channel logout URI configured will be sent a back-channel logout request. This typically happens when another application signs out. [Expiration](/identityserver/ui/server-side-sessions/session-expiration/) of [IdentityServer server side sessions](/identityserver/ui/server-side-sessions/) can also be configured to send back-channel logout requests, though this is disabled by default.

## Dependencies
The back-channel logout endpoint depends on [server-side sessions in the BFF](/bff/fundamentals/session/server-side-sessions/), which must be enabled to use this endpoint. Note that such server-side sessions are distinct from server-side sessions in IdentityServer.

## Revoke all sessions
Back-channel logout tokens include a sub (subject ID) and sid (session ID) claim to describe which session should be revoked. By default, the back-channel logout endpoint will only revoke the specific session for the given subject ID and session ID. Alternatively, you can configure the endpoint to revoke every session that belongs to the given subject ID by setting the *BackchannelLogoutAllUserSessions* [option](/bff/fundamentals/options#session-management) to true.
