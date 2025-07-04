---
title: "Refreshing a Token"
description: "Documentation for refresh token management in IdentityServer, including requesting, using and securing refresh tokens for long-lived access to resources"
date: 2020-09-10T08:22:12+02:00
sidebar:
  label: Refreshes
  order: 20
redirect_from:
  - /identityserver/v5/tokens/refresh/
  - /identityserver/v6/tokens/refresh/
  - /identityserver/v7/tokens/refresh/
---

Access tokens have finite lifetimes. If a client needs long-lived access to a
resource, [refresh tokens](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5) can be used to request a new
access token. This can be done with an API call and does not require any user interaction or interruption.

Since this is a privileged operation, the clients needs to be explicitly authorized to be able to use refresh tokens by
setting the `AllowOfflineAccess` property to `true`. See
the [client reference](/identityserver/reference/models/client.md#refresh-token) section for additional refresh token
related settings.

Refresh tokens are supported for the following flows: authorization code, hybrid and resource owner password credential
flow.

## Requesting A Refresh Token

You can request a refresh token by adding a scope called `offline_access` to the scope parameter list of the authorize
request.

#### Requesting An Access Token Using A Refresh Token

To get a new access token, you send the refresh token to the token endpoint.
This will result in a new token response containing a new access token and its expiration and potentially also a new
refresh token depending on the client configuration (see [rotation](#rotation)).

```
POST /connect/token

    client_id=client&
    client_secret=secret&
    grant_type=refresh_token&
    refresh_token=hdh922
```

#### .NET Client Library

On .NET you can leverage the [Duende IdentityModel](/identitymodel/index.mdx) client library
to [request](/identitymodel/endpoints/token.md) refresh tokens, e.g.:

```csharp
using Duende.IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestRefreshTokenAsync(new RefreshTokenRequest
{
    Address = TokenEndpoint,

    ClientId = "client",
    ClientSecret = "secret",

    RefreshToken = "..."
});
```

The [Duende.AccessTokenManagement](/accesstokenmanagement) library can be
used to automate refresh & access token lifetime management in ASP.NET Core.

## Binding Refresh Tokens

Refresh tokens are a high-value target for attackers, because they typically have a much higher lifetime than access
tokens.

However, refresh tokens for _confidential clients_ are bound to that client; they can only be used by the client they
are issued to and the client is required to authenticate itself to do so. An attacker able to obtain a refresh
token issued to a confidential client cannot use it without the client's credentials.

Refresh tokens issued to public clients are not bound to the client in the same way, since the client cannot
authenticate itself. We recommend that such refresh tokens be sender-constrained using [Proof of Possession](/identityserver/tokens/pop.md)
instead.

You can further reduce the attack surface of refresh tokens using the following techniques.

### Consent

We encourage you to request consent when a client requests a refresh token, as it not only makes the user aware of the
action being taken, but also provides them with an opportunity to opt-out if they choose.

Duende IdentityServer will always ask for consent (if enabled) if the client asks for the `offline_access` scope which
follows the recommendations in the OpenID Connect specification.

### Sliding Expiration

Refresh tokens usually have a much longer lifetime than access tokens. You can reduce their exposure by adding a sliding
lifetime on top of the absolute lifetime. This allows for scenarios where a refresh token can be silently used if the
user is regularly using the client, but needs a fresh authorize request if the client has not been used for a certain
time. In other words, they auto-expire much quicker without potentially interfering with the typical usage pattern.

You can use the `AbsoluteRefreshTokenLifetime` and `SlidingRefreshTokenLifetime` client settings to fine tune this
behavior.

### Rotation

Rotation is configured with the `RefreshTokenUsage` client setting and, beginning in IdentityServer v7.0, is by default
set to `ReUse` which disables rotation.

When `RefreshTokenUsage` is configured for `OneTime` usage, rotation is enabled and refresh tokens can only be used
once. When refresh tokens are used with `OneTime` usage configured, a new refresh token is included in the response
along with the new access token. Each time the client application uses the refresh token, it must use the most recent
refresh token. This chain of tokens will each appear as distinct token values to the client, but will have identical
creation and expiration timestamps in the datastore.

Beginning in version 6.3, the configuration option `DeleteOneTimeOnlyRefreshTokensOnUse` controls what happens to
refresh tokens configured for OneTime usage. If the flag is on, then refresh tokens are deleted immediately on use. If
the flag is off, the token is marked as consumed instead. Prior to version 6.3, OneTime usage refresh tokens are always
marked as consumed.

Rotating the tokens on every
use [has limited security benefits](https://duendesoftware.com/blog/20240405-refresh-token-reuse) regardless of
which type of client is used. And it comes with the cost of database pressure and reliability issues. Reusable refresh
tokens are robust to network failures in a way that one time use tokens are not: if a one-time use refresh token is used
to produce a new token, but the response containing the new refresh token is lost due to a network issue, the client
application has no way to recover without the user logging in again. Reusable refresh tokens do not have this problem.

Reusable tokens may have better performance in
the [persisted grants store](/identityserver/reference/stores/persisted-grant-store.md). One-time use refresh tokens
require additional records to be written to the store whenever a token is refreshed. Using reusable refresh tokens
avoids those writes.

### Accepting Consumed Tokens

To make one time use tokens more robust to network failures, you can customize the behavior of the `RefreshTokenService`
such that consumed tokens can be used under certain circumstances, perhaps for a small length of time after they are
consumed. To do so, create a subclass of the `DefaultRefreshTokenService` and override its `AcceptConsumedTokenAsync(
RefreshToken refreshToken)` method. This method takes a consumed refresh token and returns a boolean flag that indicates
if that token should be accepted, that is, allowed to be used to obtain an access token. The default implementation in
the `DefaultRefreshTokenService` rejects all consumed tokens, but your customized implementation could create a time
window where consumed tokens can be used.

New options added In 6.3 interact with this feature. The `PersistentGrantOptions.DeleteOneTimeOnlyRefreshTokensOnUse`
flag will cause OneTime refresh tokens to be deleted on use, rather than marked as consumed. This flag will need to be
disabled to allow a customized Refresh Token Service to use consumed tokens.

Consumed tokens can be cleaned up by a background process, enabled with the existing
`OperationalStoreOptions.EnableTokenCleanup` and `OperationalStoreOptions.RemoveConsumedTokens` flags. Starting in 6.3,
the cleanup job can be further configured with the `OperationalStoreOptions.ConsumedTokenCleanupDelay`. This delay is
the amount of time that must elapse before tokens marked as consumed will be deleted. If you are customizing the Refresh
Token Service to allow for consumed tokens to be used for some period of time, then we recommend configuring the
`ConsumedTokenCleanupDelay` to the same time period.

This customization must be registered in the ASP.NET Core service provider as an implementation of the `IRefreshTokenService`:

```csharp
builder.Services.TryAddTransient<IRefreshTokenService, YourCustomRefreshTokenService>();
```

### Replay Detection

In addition to one-time only usage semantics, you can add replay detection for refresh tokens.
Multiple uses of a one-time-only refresh token may indicate:

* A client application bug
* Network failure during token rotation
* A potential replay attack

Depending on your security requirements, you can treat this situation as an attack, and take action.
If a consumed refresh token is ever used, you could revoke all access for that client/user combination.
This could include deleting refresh tokens, revoking access tokens (if they are introspection tokens),
ending the user's server side session, and sending back-channel logout notifications to client applications.
You can also consider alerting the user to suspicious activity on their account.

:::caution
Keep in mind that these actions are disruptive and possibly alarming to the user, and there is a potential for false
positives.
:::

While replay and re-use detection can be useful, they can be tricky to implement due to potential race conditions.
On the server, you'll need a robust synchronization across instances (e.g. using our persisted grant store).
On the client, refresh operations will have to be coordinated to not end up with invalid refresh tokens
(e.g. when multiple client instances refresh in an uncontrolled way).

Implementing replay detection can be done in a similar way to [accepting consumed tokens](#accepting-consumed-tokens). Extending the
`AcceptConsumedTokenAsync` method of the `DefaultRefreshTokenService`, you can add the additional revocation or alerting
behavior that you choose. Depending on your scenario, overriding the `CreateRefreshTokenAsync`,
`ValidateRefreshTokenAsync` and `UpdateRefreshTokenAsync` methods may also be desired.

The options that interact with accepting consumed tokens also interact with replay detection.
The `PersistentGrantOptions.DeleteOneTimeOnlyRefreshTokensOnUse` flag needs to be disabled so that used tokens persist 
and can be used to detect replays. The cleanup job should also be configured to not delete consumed
tokens.

See also: The [IRefreshTokenService](/identityserver/reference/services/refresh-token-service.md) reference.
