---
title: "Diagnostics"
description: Overview of IdentityServer's diagnostic capabilities including logging, OpenTelemetry integration, and event system for monitoring and troubleshooting
date: 2020-09-10T08:20:20+02:00
sidebar:
  label: Overview
  order: 1
redirect_from:
  - /identityserver/v5/diagnostics/
  - /identityserver/v6/diagnostics/
  - /identityserver/v7/diagnostics/
---

## Logging

IdentityServer offers multiple diagnostics possibilities. The logs contains detailed information and
are your best friend when troubleshooting. For security reasons the error messages returned
to the UI/client are very brief - the logs always have all the details of what went wrong.

[Read More](/identityserver/diagnostics/logging)

## Open Telemetry

Open Telemetry is the new standard way of emitting diagnostics information from a process and
IdentityServer supports Traces (.NET Activities), Metrics and Logs.

[Read More](/identityserver/diagnostics/otel)

## Events

The eventing system was created as an extension point to integrate with application monitoring
systems (APM). They used to have their own different APIs so IdentityServer only provided events
that could be used to call the APM's APIs. Thanks to Open Telemetry there is now a standardized
way to emit diagnostic information from a process. The events may eventually be deprecated and removed.

[Read More](/identityserver/diagnostics/events)
