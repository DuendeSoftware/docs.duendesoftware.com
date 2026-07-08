---
title: "Event Sink"
description: Documentation for the IEventSink interface which handles the persistence or forwarding of IdentityServer events to external systems such as logging frameworks, audit databases, or SIEM solutions.
sidebar:
  label: Event Sink
  order: 70
---

#### Duende.IdentityServer.Services.IEventSink

The `IEventSink` interface handles the persistence or forwarding of IdentityServer events raised by `IEventService`. Implement this interface to integrate IdentityServer's event stream with an external system such as a logging framework, audit database, or SIEM solution.

```csharp
/// <summary>
/// Handles the persistence or forwarding of IdentityServer events raised by IEventService.
/// Implement this interface to integrate IdentityServer's event stream with an external system
/// such as a logging framework, audit database, or SIEM solution.
/// </summary>
public interface IEventSink
{
    /// <summary>
    /// Persists the event to the sink.
    /// </summary>
    /// <param name="evt">The event.</param>
    /// <param name="ct">The cancellation token.</param>
    Task PersistAsync(Event evt, CancellationToken ct);
}
```

## IEventSink APIs

* **`PersistAsync(Event evt, CancellationToken ct)`**

  Called whenever an event is raised by IdentityServer. The `evt` parameter contains the event data including the event type, category, name, timestamp, and event-specific properties.

## Event Types

IdentityServer raises events for various activities, all inheriting from the base `Event` class in the `Duende.IdentityServer.Events` namespace. Common event categories include:

- **Authentication** — User login success/failure, logout
- **Token** — Token issued, token issued failure
- **Grants** — Consent granted/denied, grants revoked
- **Device Flow** — Device authorization success/failure
- **CIBA** — Backchannel authentication events

## Enabling Events

Events must be enabled in the IdentityServer options. By default, error and failure events are enabled. To receive all events:

```csharp
builder.Services.AddIdentityServer(options =>
{
    options.Events.RaiseSuccessEvents = true;
    options.Events.RaiseFailureEvents = true;
    options.Events.RaiseErrorEvents = true;
    options.Events.RaiseInformationEvents = true;
});
```

## Default Implementation

The `DefaultEventSink` writes events to the configured `ILogger` infrastructure. Events are serialized to JSON and written at the appropriate log level.

## Multiple Event Sinks

You can register multiple `IEventSink` implementations. All registered sinks will receive every raised event:

```csharp
builder.Services.AddTransient<IEventSink, AuditDatabaseEventSink>();
builder.Services.AddTransient<IEventSink, SiemEventSink>();
```

## Sample Implementation

The following example shows an event sink that writes audit events to a database:

```csharp
public class AuditDatabaseEventSink : IEventSink
{
    private readonly AuditDbContext _dbContext;
    private readonly ILogger<AuditDatabaseEventSink> _logger;

    public AuditDatabaseEventSink(
        AuditDbContext dbContext,
        ILogger<AuditDatabaseEventSink> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task PersistAsync(Event evt, CancellationToken ct)
    {
        var auditEntry = new AuditEntry
        {
            EventType = evt.EventType.ToString(),
            Category = evt.Category,
            Name = evt.Name,
            Timestamp = evt.TimeStamp,
            ActivityId = evt.ActivityId,
            RemoteIpAddress = evt.RemoteIpAddress,
            // Serialize the full event for detailed audit trail
            EventData = JsonSerializer.Serialize(evt, evt.GetType())
        };

        _dbContext.AuditEntries.Add(auditEntry);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogDebug(
            "Persisted {EventCategory}/{EventName} event to audit database",
            evt.Category, evt.Name);
    }
}
```

Register the implementation:

```csharp
builder.Services.AddTransient<IEventSink, AuditDatabaseEventSink>();
```
