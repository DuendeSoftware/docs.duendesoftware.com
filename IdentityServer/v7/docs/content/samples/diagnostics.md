---
title: "Diagnostics"
description: "Samples"
weight: 50
---

### OpenTelemetry with Aspire
[link to source code]({{< param samples_base >}}/Diagnostics/Aspire)

IdentityServer emits OpenTelemetry metcis, traces and logs (see [here]({{< ref "/diagnostics/otel" >}}) for more information). This sample uses .NET Aspire to
display OpenTelemetry data. The solution contains an IdentityServer host, an API and a web client. The access token lifetime is set to a very small value to
force frequent refresh token flows.

Running the sample requires the dotnet aspire workload to be installed with `dotnet workload install aspire`. Run the Aspire.AppHost project, it will automatically
launch the other projects.

This sample is not intended to be a full Aspire sample, it simply uses Aspire as a local standalone tool for displaying traces, logs and metrics.

### OpenTelemetry tracing
[link to source code]({{< param samples_base >}}/Diagnostics/Otel)

IdentityServer emits OpenTelemetry traces for input validators, stores and response generators (see [here]({{< ref "/diagnostics/otel" >}}) for more information).

The sample shows how to setup Otel for console tracing.
