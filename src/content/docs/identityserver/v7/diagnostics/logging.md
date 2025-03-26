---
title: "Logging"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

Duende IdentityServer uses the standard logging facilities provided by ASP.NET Core. You don't need to do any extra configuration.

The Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging) has a good intro and a description of the built-in logging providers.

We are roughly following the Microsoft guidelines for usage of log levels:

* ***Trace*** 

    For information that is valuable only to a developer troubleshooting an issue. These messages may contain sensitive application data like tokens and should not be enabled in a production environment.

* ***Debug*** 

    For following the internal flow and understanding why certain decisions are made. Has short-term usefulness during development and debugging.

* ***Information*** 

    For tracking the general flow of the application. These logs typically have some long-term value.

* ***Warning*** 

    For abnormal or unexpected events in the application flow. These may include errors or other conditions that do not cause the application to stop, but which may need to be investigated.

* ***Error*** 

    For errors and exceptions that cannot be handled. Examples: failed validation of a protocol request.

* ***Critical*** 

    For failures that require immediate attention. Examples: missing store implementation, invalid key material...

:::note
In production, logging might produce too much data. It is recommended you either turn it off, or default to the *Warning* level. Have a look at [events](/identityserver/v7/diagnostics/events) for more high-level production instrumentation.
:::

### Setup for Serilog
We personally like [Serilog](https://serilog.net) and the [Serilog.AspNetCore](https://github.com/serilog/serilog-aspnetcore) package a lot. Give it a try:

```cs
//Program.cs
Activity.DefaultIdFormat = ActivityIdFormat.W3C;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore.Authentication", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level}] {SourceContext}{NewLine}{Message:lj}{NewLine}{Exception}{NewLine}", theme: AnsiConsoleTheme.Code)
    .CreateLogger();

builder.Logging.AddSeriLog();
```