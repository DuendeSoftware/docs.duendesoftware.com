---
title: "Logging"
description: "Documentation for logging configuration and usage in Duende IdentityServer, including log levels and Serilog setup"
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 10
redirect_from:
  - /identityserver/v5/diagnostics/logging/
  - /identityserver/v6/diagnostics/logging/
  - /identityserver/v7/diagnostics/logging/
---

Duende IdentityServer uses the standard logging facilities provided by ASP.NET Core. You don't need to do any extra
configuration.

The Microsoft [documentation](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/logging) has a good intro and a
description of the built-in logging providers.

We are roughly following the Microsoft guidelines for usage of log levels:

* **`Trace`**

  For information that is valuable only to a developer troubleshooting an issue. These messages may contain sensitive
  application data like tokens and should not be enabled in a production environment.

* **`Debug`**

  For following the internal flow and understanding why certain decisions are made. Has short-term usefulness during
  development and debugging.

* **`Information`**

  For tracking the general flow of the application. These logs typically have some long-term value.

* **`Warning`**

  For abnormal or unexpected events in the application flow. These may include errors or other conditions that do not
  cause the application to stop, but which may need to be investigated.

* **`Error`**

  For errors and exceptions that cannot be handled. Examples: failed validation of a protocol request.

* **`Critical`**

  For failures that require immediate attention. Examples: missing store implementation, invalid key material...

:::note
In production, logging might produce too much data. It is recommended you either turn it off, or default to the
`Warning` level. Have a look at [events](/identityserver/diagnostics/events.md) for more high-level production
instrumentation.
:::

### Setup For Serilog

We personally like [Serilog](https://serilog.net) and
the [Serilog.AspNetCore](https://github.com/serilog/serilog-aspnetcore) package a lot. Give it a try:

```csharp
// Program.cs
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

You can also use ASP.NET Core's configuration pattern to configure Serilog using `appsettings.json` and other configuration sources.
To do so, you first need to tell Serilog to read its configuration from the `IConfiguration` root:

```csharp {11}
// Program.cs

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, lc) => lc
    .WriteTo.Console(
        outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level}] {SourceContext}{NewLine}{Message:lj}{NewLine}{Exception}{NewLine}",
        formatProvider: CultureInfo.InvariantCulture)
    .Enrich.FromLogContext()
    .ReadFrom.Configuration(ctx.Configuration));
```

Then, in your `appsettings.json` file, you can set the default minimum log level and log level overrides like so:

```json {12}
// appsettings.json

{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Debug",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.Hosting.Lifetime": "Information",
        "Microsoft.AspNetCore.Authentication": "Debug",
        "System": "Warning",
        "Duende": "Verbose" // As an example, we've enabled more verbose logging for the Duende.* namespace
      }
    }
  }
}
```

## Filtering Exceptions

The `LoggingOptions` class allows developers to filter out any exceptions that
could potentially lead to log bloat. For example, in a web application, developers
should expect to see `OperationCanceledException` as clients end HTTP requests
abruptly for many reasons. It's such a common occurrence to see this exception that
the default filter included with IdentityServer excludes it by default.

```csharp
/// <summary>
/// Called when the IdentityServer middleware detects an unhandled exception, and is used to determine if the exception is logged.
/// Returns true to emit the log, false to suppress.
/// </summary>
public Func<HttpContext, Exception, bool> UnhandledExceptionLoggingFilter = (context, exception) =>
{
    var result = !(context.RequestAborted.IsCancellationRequested && exception is OperationCanceledException);
    return result;
};
```

To apply custom filtering, you can set the `UnhandledExceptionLoggingFilter` property on
the `LoggingOptions` for your `IdentityServerOptions`.

```csharp
var isBuilder = builder.Services.AddIdentityServer(options =>
    {
        options.Logging.UnhandledExceptionLoggingFilter =
            (ctx, ex) => {
                if (ctx.User is { Identity.Name: "Jeff" }) 
                {
                    // Oh Jeff...
                    return false;
                }

                if (ex.Message.Contains("Oops"))
                {
                    // ignore this exception
                    return false;
                }

                // this is a real exception
                return true;
            };
    })
    .AddTestUsers(TestUsers.Users)
    .AddLicenseSummary();
```

Returning `true` means the exception will be logged, while returning `false` indicates the exception should not be logged.
