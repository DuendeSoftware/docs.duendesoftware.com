---
title: "Logging"
description: "Documentation for logging configuration and usage in Duende Access Token Management, including log levels and Serilog setup"
date: 2026-01-19
sidebar:
  order: 50
---

Duende Access Token Management uses the standard logging facilities provided by ASP.NET Core. You generally do not need to perform any extra configuration, as it will use the logging provider you have already configured for your application.

For general information on how to configure logging, setting up Serilog, and understanding log levels in Duende products, see our [Logging Fundamentals](/general/logging.md) guide.

The Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging) has a good introduction and description of the built-in logging providers.

## Log Levels

You can control the log output for Duende Access Token Management specifically by configuring the `Duende.AccessTokenManagement` namespace in your logging configuration.
For example, to enable debug logging for Access Token Management while keeping other logs at a higher level, you can modify your `appsettings.json`:

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Duende.AccessTokenManagement": "Debug"
    }
  }
}
```