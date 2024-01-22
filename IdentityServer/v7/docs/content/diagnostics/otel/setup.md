---
title: "Setup"
date: 2020-09-10T08:22:12+02:00
weight: 40
---

To start emitting Otel tracing and metrics information you need 

* add the Otel libraries to your IdentityServer and client applications
* start collecting traces and Metrics from the various IdentityServer sources (and other sources e.g. ASP.NET Core)

For development a simple option is to export the tracing information to the console and use the Prometheus
exporter to create a human readable /metrics endpoint for the metrics.

Add the Open Telemetry configuration to your service setup.
```cs
var openTelemetry = builder.Services.AddOpenTelemetry();

openTelemetry.ConfigureResource(r => r
    .AddService(builder.Environment.ApplicationName));

openTelemetry.WithMetrics(m => m
    .AddMeter(Telemetry.ServiceName)
    .AddMeter(Pages.Telemetry.ServiceName)
    .AddPrometheusExporter());

openTelemetry.WithTracing(t => t
    .AddSource(IdentityServerConstants.Tracing.Basic)
    .AddSource(IdentityServerConstants.Tracing.Cache)
    .AddSource(IdentityServerConstants.Tracing.Services)
    .AddSource(IdentityServerConstants.Tracing.Stores)
    .AddSource(IdentityServerConstants.Tracing.Validation)
    .AddAspNetCoreInstrumentation()
    .AddConsoleExporter());
```

Add the Prometheus exporter to the pipeline

```cs
// Map /metrics that displays Otel data in human readable form.
app.UseOpenTelemetryPrometheusScrapingEndpoint();
```

This setup will write the tracing information to the console and provide metrics on the /metrics endpoint.
