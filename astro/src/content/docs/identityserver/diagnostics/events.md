---
title: "IdentityServer Events And Audit Logging"
description: "How to configure IdentityServer events and send structured authentication, token, consent, and security events to an audit store."
date: 2026-05-20
sidebar:
  label: Events
  order: 20
redirect_from:
  - /identityserver/v5/diagnostics/events/
  - /identityserver/v6/diagnostics/events/
  - /identityserver/v7/diagnostics/events/
---

[Logs](/identityserver/diagnostics/logging.mdx) describe low-level application activity. Events describe higher-level
operations in IdentityServer, such as user login, client authentication, token issuance, consent, and token revocation.
Events are structured data with event IDs, success or failure information, categories, and details, which makes them
easier to query and process than application logs.

You can send events to structured logging stores such as
[ELK](https://www.elastic.co/webinars/introduction-elk-stack), [Seq](https://getseq.net), or
[Splunk](https://www.splunk.com/).

## How To Configure IdentityServer Events

Events are not enabled by default. Choose which event types to raise when you call `AddIdentityServer`:

```csharp
// Program.cs
builder.Services.AddIdentityServer(options =>
{
    options.Events.RaiseSuccessEvents = true;
    options.Events.RaiseFailureEvents = true;
    options.Events.RaiseErrorEvents = true;
    options.Events.RaiseInformationEvents = true;
});
```

IdentityServer raises protocol events itself. Events for user-interface actions, such as a successful or failed login,
must be raised by your UI code because that code belongs to your application. Inject `IEventService` and call
`RaiseAsync`:

```csharp {8,12}
// LoginController.cs
public async Task<IActionResult> Login(LoginInputModel model)
{
    if (_users.ValidateCredentials(model.Username, model.Password))
    {
        // issue authentication cookie with subject ID and username
        var user = _users.FindByUsername(model.Username);
        await _events.RaiseAsync(new UserLoginSuccessEvent(user.Username, user.SubjectId, user.Username), HttpContext.RequestAborted);
    }
    else
    {
        await _events.RaiseAsync(new UserLoginFailureEvent(model.Username, "invalid credentials"), HttpContext.RequestAborted);
    }
}
```

## When To Use Events For Audit Logging

Use logs to diagnose application behavior. Use events when you need a smaller, structured record of security-relevant
operations. An audit trail commonly records:

* Successful and failed user logins
* Client and API authentication
* Token issuance, revocation, and introspection
* Consent grants and denials
* Custom events for application-specific security decisions

Enabling events does not create a complete audit system by itself. You must decide where to store raised events, how long to
retain them, and who can access them. For an audit trail, send events to a dedicated append-only or tamper-resistant
store rather than relying only on general application logs.

Built-in events can include usernames, subject IDs, display names, client IDs, scopes, redirect URIs, and local and
remote IP addresses. Treat this data as personal or security-sensitive information when you set access and retention
policies for the audit store. Issued token values are obfuscated, so full tokens are not written to events. Custom events
and sinks should not add secrets, full tokens, or personal data that the audit trail does not need.

## How To Store Events In An Audit System

The default event sink serializes each event to JSON and forwards it to the ASP.NET Core logging system. To send events
to an audit database, SIEM, or another store, implement
[`IEventSink`](/identityserver/reference/v8/services/event-sink.md) and register it with the ASP.NET Core service provider.

The following example uses [Seq](https://getseq.net) to emit events:

```csharp
// SeqEventSink.cs
public class SeqEventSink : IEventSink
{
    private readonly Logger _log;

    public SeqEventSink()
    {
        _log = new LoggerConfiguration()
            .WriteTo.Seq("http://localhost:5341")
            .CreateLogger();
    }

    public Task PersistAsync(Event evt, CancellationToken cancellationToken)
    {
        if (evt.EventType == EventTypes.Success ||
            evt.EventType == EventTypes.Information)
        {
            _log.Information("{Name} ({Id}), Details: {@details}",
                evt.Name,
                evt.Id,
                evt);
        }
        else
        {
            _log.Error("{Name} ({Id}), Details: {@details}",
                evt.Name,
                evt.Id,
                evt);
        }

        return Task.CompletedTask;
    }
}
```

Add the `Serilog.Sinks.Seq` package to your host, then register the sink:

```shell
dotnet add package Serilog.Sinks.Seq
```

```csharp
// Program.cs
builder.Services.AddTransient<IEventSink, SeqEventSink>();
```

`IEventService` sends each event to one `IEventSink`. Registering a custom sink replaces the default sink, so events are
no longer forwarded to the standard ASP.NET Core logger unless your custom sink does that too.

Your sink controls the reliability and retention of the audit trail. In production, account for temporary failures in
the destination, restrict write and delete access, and monitor the sink so dropped events do not go unnoticed. If you
need events in both the default logger and a dedicated audit store, implement that fan-out in your sink.

## Built-In IdentityServer Events

The following events are defined in IdentityServer:

* **`ApiAuthenticationFailureEvent`** & **`ApiAuthenticationSuccessEvent`**

  Gets raised for successful/failed API authentication at the introspection endpoint.

* **`ClientAuthenticationSuccessEvent`** & **`ClientAuthenticationFailureEvent`**

  Gets raised for successful/failed client authentication at the token endpoint.

* **`TokenIssuedSuccessEvent`** & **`TokenIssuedFailureEvent`**

  Gets raised for successful/failed attempts to request identity tokens, access tokens, refresh tokens and authorization
  codes.

* **`TokenIntrospectionSuccessEvent`** & **`TokenIntrospectionFailureEvent`**

  Gets raised for successful token introspection requests.

* **`TokenRevokedSuccessEvent`**

  Gets raised for successful token revocation requests.

* **`UserLoginSuccessEvent`** & **`UserLoginFailureEvent`**

  Gets raised by the quickstart UI for successful/failed user logins.

* **`UserLogoutSuccessEvent`**

  Gets raised for successful logout requests.

* **`ConsentGrantedEvent`** & **`ConsentDeniedEvent`**

  Gets raised in the consent UI.

* **`UnhandledExceptionEvent`**

  Gets raised for unhandled exceptions.

* **`DeviceAuthorizationFailureEvent`** & **`DeviceAuthorizationSuccessEvent`**

  Gets raised for successful/failed device authorization requests.

### SAML Events :badge[v8.0]

The following events are raised by SAML components:

* **`SamlSsoSuccessEvent`**

  Raised when a SAML single sign-on request completes successfully.

* **`SamlSsoFailureEvent`**

  Raised when a SAML single sign-on request fails.

* **`SamlSloSuccessEvent`**

  Raised when a SAML single logout request completes successfully.

* **`SamlSloFailureEvent`**

  Raised when a SAML single logout request fails.

* **`SamlAuthnRequestValidationFailureEvent`**

  Raised when validation of an incoming SAML authentication request fails.

* **`SamlLogoutRequestValidationFailureEvent`**

  Raised when validation of an incoming SAML logout request fails.

* **`InvalidSamlServiceProviderConfigurationEvent`**

  Raised when a SAML Service Provider's configuration fails runtime validation (performed by [`ISamlServiceProviderConfigurationValidator`](/identityserver/saml/extensibility#isamlserviceproviderconfigurationvalidator)). Includes the SP's `EntityId` and `DisplayName`.

## How To Create Custom IdentityServer Events

You can create your own events and emit them through the same event pipeline.

Derive from the `Event` base class, which adds contextual information such as the activity ID and timestamp. Choose an
event ID that does not conflict with the [built-in events](#built-in-identityserver-events), then add the fields your
application needs:

```csharp
// AccountLockedEvent.cs
public class AccountLockedEvent : Event
{
    private const int AccountLockedEventId = 9000;

    public AccountLockedEvent(string subjectId)
        : base(EventCategories.Authentication,
                "Account Locked",
                EventTypes.Information,
                AccountLockedEventId)
    {
        SubjectId = subjectId;
    }

    public string SubjectId { get; set; }
}
```
