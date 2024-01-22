---
title: "OpenTelemetry"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

(added in v6.1, expanded in v7.0)

[OpenTelemetry](https://opentelemetry.io) is a collection of tools, APIs, and SDKs for generating and collecting
telemetry data (metrics, logs, and traces). This is very useful for analyzing software performance and behavior, 
especially in highly distributed systems.

.NET 8 comes with first class support for Open Telemetry. IdentityServer emmits traces, metrics and logs.
- Metrics are high level statistic counters. They provide an aggregated overview and can be used to set monitoring rules.
- Traces shows individual requests and dependencies. The output is very useful for visualizing the control 
  flow and finding performance bottlenecks.
- Logs contains all the details when needed for troubleshooting.

{{%children style="h4" /%}}

