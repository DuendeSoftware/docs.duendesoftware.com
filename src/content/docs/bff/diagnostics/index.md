---
title: "Diagnostics"
description: Overview of Duende Backend for Frontend (BFF) diagnostic capabilities including logging and OpenTelemetry integration to assist with monitoring and troubleshooting
date: 2025-11-27T08:20:20+02:00
sidebar:
  label: Overview
  order: 1
---

## Logging

Duende Backend for Frontend (BFF) offers several diagnostics possibilities. It uses the standard logging facilities
provided by ASP.NET Core, so you don't need to do any extra configuration to benefit from rich logging functionality,
including support for multiple logging providers. See the Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging) for a good introduction on logging.

BFF follows the standard logging levels defined by the .NET logging framework, and uses the Microsoft guidelines for
when certain log levels are used.

For general information on how to configure logging in Duende products, see our [Logging Fundamentals](/general/logging.md) guide.

### Configuration

Logs are typically written under the `Duende.Bff` category, with more concrete categories for specific components.

To get detailed logs from the BFF middleware with the `Microsoft.Extensions.Logging` framework, you can configure your `appsettings.json` to enable `Debug` level logs for the `Duende.Bff` namespace:

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Duende.Bff": "Debug"
    }
  }
}
```

:::note[Multiple frontends]
When using [multiple frontends and the `FrontendSelectionMiddleware`](/bff/architecture/multi-frontend.md),
log messages are written in a log scope that contains a `frontend` property with the name of the frontend for which the
log message was emitted.
:::

## OpenTelemetry :badge[v4.0]

OpenTelemetry provides a single standard for collecting and exporting telemetry data, such as metrics, logs, and traces.

To start emitting OpenTelemetry data in Duende Backend for Frontend (BFF), you need to:

* add the OpenTelemetry libraries to your BFF host and client applications
* start collecting traces and metrics from the various BFF sources (and other sources such as ASP.NET Core, the `HttpClient`, etc.)

The following configuration adds the OpenTelemetry configuration to your service setup, and exports data to an [OTLP exporter](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel):

```csharp
// Program.cs
var openTelemetry = builder.Services.AddOpenTelemetry();

openTelemetry.ConfigureResource(r => r
    .AddService(builder.Environment.ApplicationName));

openTelemetry.WithMetrics(metrics =>
    {
        metrics.AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddMeter(BffMetrics.MeterName);
    });

openTelemetry.WithTracing(tracing =>
    {
        tracing.AddSource(builder.Environment.ApplicationName)
            .AddAspNetCoreInstrumentation()
            // Uncomment the following line to enable gRPC instrumentation
            // (requires the OpenTelemetry.Instrumentation.GrpcNetClient package)
            //.AddGrpcClientInstrumentation()
            .AddHttpClientInstrumentation();
    });

openTelemetry.UseOtlpExporter();
```

## Metrics

OpenTelemetry metrics are run-time measurements are typically used to show graphs on a dashboard, to inspect overall
application health, or to set up monitoring rules.

The BFF host emits metrics from several sources, and collects these through the `Duende.Bff` meter:

* `session.started` - a counter that communicates the number of sessions started
* `session.ended` - a counter that communicates the number of sessions ended
