---
title: "ASP.NET Core OpenID Connect Handler Events"
description: "ASP.NET Core's OpenID Connect handler events, what they are, and why you might want to use them."
date: 2025-5-01
sidebar:
  order: 60
  label: "OIDC Handler Events"
---

The ASP.NET Core [OpenID Connect handler][handler] exposes events that a client can subscribe to intercept the OpenID
Connect protocol flow. Understanding these events is important to understanding how to customize the OpenID Connect
protocol flow from the client. We'll cover each of the events, what they are, and why you might want to subscribe to
them.

To use the `OpenIdConnectHandler` in your client applications, you will first need to install the
`Microsoft.AspNetCore.Authentication.OpenIdConnect` NuGet package.

```bash
dotnet package add Microsoft.AspNetCore.Authentication.OpenIdConnect
```

Followed by adding the `OpenIdConnectHandler` to your application.

```csharp
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "cookie";
        options.DefaultChallengeScheme = "oidc";
        options.DefaultSignOutScheme = "oidc";
    })
    .AddCookie("cookie", options =>
    {
        options.Cookie.Name = "__Host-bff";
        options.Cookie.SameSite = SameSiteMode.Strict;
    })
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://demo.duendesoftware.com";
        options.ClientId = "interactive.confidential";
        options.ClientSecret = "secret";
        options.ResponseType = "code";
        options.ResponseMode = "query";

        options.GetClaimsFromUserInfoEndpoint = true;
        options.SaveTokens = true;
        options.MapInboundClaims = false;

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("api");
        options.Scope.Add("offline_access");

        options.TokenValidationParameters.NameClaimType = "name";
        options.TokenValidationParameters.RoleClaimType = "role";
        
    });
```

From here you can use the `options.Events` property to subscribe to the events you want to use. Let's look at each of the events in more detail.

## OpenID Connect Events

All events either occur before a request is sent to the identity provider or after a response is received from the
identity provider. Understanding the direction of these events can help you determine when to subscribe to them. Let's call events coming from the identity provider **incoming** and events going to the identity provider **outgoing** for an easier understanding.

| **Event Name**                           | **Usage**    |
|------------------------------------------|--------------|
| `OnAuthenticationFailed`                 | **Incoming** |
| `OnAuthorizationCodeReceived`            | **Incoming** |
| `OnMessageReceived`                      | **Incoming** |
| `OnRedirectToIdentityProvider`           | **Outgoing** |
| `OnRedirectToIdentityProviderForSignOut` | **Outgoing** |
| `OnSignedOutCallbackRedirect`            | **Outgoing** |
| `OnRemoteSignOut`                        | **Incoming** |
| `OnTokenResponseReceived`                | **Incoming** |
| `OnTokenValidated`                       | **Incoming** |
| `OnUserInformationReceived`              | **Incoming** |
| `OnPushAuthorization` (**.NET 9+ only**) | **Outgoing** |

## Commonly Subscribed Events

While there are many events available in the `OpenIdConnectEvents` class, only a few are commonly subscribed. We suggest you start with the most commonly subscribed events and then subscribe to the remaining events as needed.

For ASP.NET Core developers, the most commonly subscribed events are:

1. **`OnRedirectToIdentityProvider`**: Useful for customizing login requests (e.g., appending extra parameters).
2. **`OnRedirectToIdentityProviderForSignOut`**: Often required to customize the behavior of sign-out requests.
3. **`OnTokenValidated`**: Frequently used to customize the claims processing or validate custom claims included in the
   ID token.
4. **`OnUserInformationReceived`**: Sometimes used to process additional user data retrieved from the UserInfo
   endpoint (if enabled).

## Descriptions

### OnAuthenticationFailed

- **When called**: Triggered whenever an exception occurs during the authentication process. This event provides an
  opportunity to handle or log errors.
- **How often**: Only called when an authentication error happens.
- **Example use case**: Use this event to log detailed error messages or display a custom error page to the user instead
  of the default behavior.
- **Commonly subscribed**: No, unless you need specific error-handling logic.

### OnAuthorizationCodeReceived

- **When called**: Invoked after an authorization code is received and before it is redeemed for tokens.
- **How often**: Called once per successful authorization code flow request.
- **Example use case**: Validate the authorization code or add extra functionality (e.g., logging or monitoring) when
  the code is received.
- **Commonly subscribed**: Rarely, unless custom logic is required before token redemption.

### OnMessageReceived

- **When called**: Triggered when a protocol message (e.g., an authorization response, logout request) is first
  received.
- **How often**: Called once per incoming protocol message.
- **Example use case**: Inspect or modify protocol messages for debugging or to handle additional query parameters
  passed by the identity provider.
- **Commonly subscribed**: No, unless advanced customization is needed.

### OnRedirectToIdentityProvider

- **When called**: Invoked when redirecting the user to the identity provider for authentication. You can modify the
  outgoing authentication request.
- **How often**: Called once per user authentication attempt (e.g., a "login").
- **Example use case**: Add custom query parameters to the request or modify the state parameter.
- **Commonly subscribed**: Yes—often used to customize the authentication request.

### OnRedirectToIdentityProviderForSignOut

- **When called**: Triggered before redirecting the user to the identity provider to start the sign-out process.
- **How often**: Called once per user sign-out request.
- **Example use case**: Modify the logout request, such as appending additional parameters.
- **Commonly subscribed**: Yes, if signing out requires customization.

### OnSignedOutCallbackRedirect

- **When called**: Invoked after a remote sign-out is completed and before redirecting the user to the
  `SignedOutRedirectUri`.
- **How often**: Called once per remote sign-out.
- **Example use case**: Log or perform business logic after the remote sign-out.
- **Commonly subscribed**: Rarely, unless additional behavior is needed.

### OnRemoteSignOut

- **When called**: Called when a remote sign-out request is received on the `RemoteSignOutPath` endpoint.
- **How often**: Called once per incoming remote sign-out request.
- **Example use case**: Perform cleanup tasks such as clearing local session data upon receiving a sign-out request from
  the identity provider.
- **Commonly subscribed**: Rarely, but important in distributed or multi-tenant systems.

### OnTokenResponseReceived

- **When called**: Triggered after an authorization code exchange is completed and the token endpoint returns tokens.
- **How often**: Called once per token request.
- **Example use case**: Log or debug the token response, or inspect additional data included in the token response.
- **Commonly subscribed**: No, unless debugging or inspection of tokens is required.

### OnTokenValidated

- **When called**: Invoked after the ID token has been validated and an `AuthenticationTicket` has been created.
- **How often**: Called once per token validation process.
- **Example use case**: Add or modify claims in the `ClaimsPrincipal` or validate custom claims included in the token.
- **Commonly subscribed**: Yes—this is one of the most commonly used events for customizing claims.

### OnUserInformationReceived

- **When called**: Triggered when retrieving user information from the UserInfo endpoint (if
  `GetClaimsFromUserInfoEndpoint = true`).
- **How often**: Called once per user information fetch (e.g., per login).
- **Example use case**: Extend or modify user claims based on the additional information retrieved from the UserInfo
  endpoint.
- **Commonly subscribed**: Sometimes, if extra claims processing is required.

### OnPushAuthorization

- **When called**: Invoked before sending authorization parameters using the Pushed Authorization Request (PAR)
  mechanism.
- **How often**: Called once per outgoing PAR-based authorization request.
- **Example use case**: Modify or log pushed authorization parameters.
- **Commonly subscribed**: Rarely, as this is used mainly in advanced scenarios.

[handler]: https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication.openidconnect.openidconnecthandler?view=aspnetcore-9.0