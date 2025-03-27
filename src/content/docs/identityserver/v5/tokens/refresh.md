---
title: "Refreshing a Token"
date: 2020-09-10T08:22:12+02:00
weight: 20
---

Access tokens have finite lifetimes. If a client needs long-lived access to a resource, [refresh tokens](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5) can be used to request a new access token. This can be done with an API call and does not require any user interaction or interruption.

Since this is a privileged operation, the clients needs to be explicitly authorized to be able to use refresh tokens by setting the *AllowOfflineAccess* property to *true*. See the [client reference](/identityserver/v5/reference/models/client#refresh-token) section for additional refresh token related settings.

Refresh tokens are supported for the following flows: authorization code, hybrid and resource owner password credential flow.

## Requesting a refresh token
You can request a refresh token by adding a scope called *offline_access* to the scope parameter list of the authorize request.

## Requesting an access token using a refresh token
To get a new access token, you send the refresh token to the token endpoint.
This will result in a new token response containing a new access token and its expiration and potentially also a new refresh token depending on the client configuration (see above).

```text
POST /connect/token

    client_id=client&
    client_secret=secret&
    grant_type=refresh_token&
    refresh_token=hdh922
```

### .NET client library
On .NET you can leverage the [IdentityModel](https://identitymodel.readthedocs.io) client library to [request](https://identitymodel.readthedocs.io/en/latest/client/token.html) refresh tokens, e.g.:

```cs
using IdentityModel.Client;

var client = new HttpClient();

var response = await client.RequestRefreshTokenAsync(new RefreshTokenRequest
{
    Address = TokenEndpoint,

    ClientId = "client",
    ClientSecret = "secret",

    RefreshToken = "..."
});
```

The [IdentityModel.AspNetCore](https://identitymodel.readthedocs.io/en/latest/aspnetcore/web.html) library can be used to automate refresh & access token lifetime management in ASP.NET Core.

## Refresh token security considerations
Refresh tokens are a high-value target for attackers, because they typically have a much higher lifetime than access tokens.

It is recommended that a refresh token is either bound to the client via a client secret (for confidential/credentialed clients), or rotated for public clients.

The following techniques can be used to reduce the attack surface of refresh tokens.

#### Consent
It’s a good idea to ask for consent when a client requests a refresh token. This way you at least try to make the user aware of what’s happening, and maybe you also give them a chance to opt-out of it. 

Duende IdentityServer will always ask for consent (if enabled) if the client asks for the *offline_access* scope which goes in-line with the recommendations in the OpenID Connect specification.

#### Sliding expiration
Refresh tokens usually have a much longer lifetime than access tokens. You can reduce their exposure by adding a sliding lifetime on top of the absolute lifetime. This allows for scenarios where a refresh token can be silently used if the user is regularly using the client, but needs a fresh authorize request if the client has not been used for a certain time. In other words, they auto-expire much quicker without potentially interfering with the typical usage pattern.

You can use the *AbsoluteRefreshTokenLifetime* and *SlidingRefreshTokenLifetime* client settings to fine tune this behavior.

#### One-time Refresh Tokens
Another option is rotating the refresh tokens on every usage. This also reduces the exposure, and has a higher chance to make older refresh tokens (e.g. ex-filtrated from some storage mechanism or a network trace/log file) unusable.

The downside of this approach is that you might have more scenarios where a legitimate refresh token becomes unusable – e.g. due to network problems while refreshing them.

Rotation can be configured via the *RefreshTokenUsage* client settings and is enabled by default.

#### Replay detection
On top of one-time only semantics, you could also layer replay detection. This means that if you ever see the same refresh token used more than once, you could revoke all access to the client/user combination. Again – same caveat applies – while increasing the security, this might result in false positives.

See the [reference](/identityserver/v5/reference/services/refresh_token_service) section for more customization of the refresh token service.
