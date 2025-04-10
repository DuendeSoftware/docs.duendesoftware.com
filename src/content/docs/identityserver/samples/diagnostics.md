---
title: "Diagnostics"
description: "Samples"
sidebar:
  order: 50
redirect_from:
  - /identityserver/v5/samples/diagnostics/
  - /identityserver/v6/samples/diagnostics/
  - /identityserver/v7/samples/diagnostics/
---

### OpenTelemetry With Aspire

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Diagnostics/Aspire)

IdentityServer emits OpenTelemetry metrics, traces and logs (see [here](/identityserver/diagnostics/otel) for more
information). This sample uses .NET Aspire to
display OpenTelemetry data. The solution contains an IdentityServer host, an API and a web client. The access token
lifetime is set to a very small value to
force frequent refresh token flows.

Running the sample requires the dotnet aspire workload to be installed with *dotnet workload install aspire*. Run the
Aspire.AppHost project, it will automatically
launch the other projects.

This sample is not intended to be a full Aspire sample, it simply uses Aspire as a local standalone tool for displaying
traces, logs and metrics.

### OpenTelemetry Tracing

[link to source code](https://github.com/DuendeSoftware/Samples/tree/main/IdentityServer/v7/Diagnostics/Otel)

IdentityServer emits OpenTelemetry traces for input validators, stores and response generators (
see [here](/identityserver/diagnostics/otel) for more information).

The sample shows how to set up Otel for console tracing.
