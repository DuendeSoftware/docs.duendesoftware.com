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

### Setup for Microsoft.Extensions.Logging

.NET provides a logging abstraction interface found in the
[`Microsoft.Extensions.Logging`](https://www.nuget.org/packages/Microsoft.Extensions.Logging) package and is the default logging provider for ASP.NET Core.

If you prefer to use Microsoft's logging option,
you can remove references to Serilog and fall back to the default logging implementation.
Duende IdentityServer already uses the `ILogger` interface,
and will use any implementation registered with the services collection. 

Below you will find a modified version of the in-memory Duende IdentityServer sample.
You can use it as a guide to adapt your own instance of Duende IdentityServer to use Microsoft's logging implementation..

```csharp
using System.Globalization;
using System.Text;
using Duende.IdentityServer.Licensing;

// App1 contains WebApplicationBuilder extension methods
// update according to your application's namespace
using App1; 

var builder = WebApplication.CreateBuilder(args);

var app = builder
    // WebApplicationBuilder extension methods
    .ConfigureServices()
    .ConfigurePipeline();

try
{
    app.Logger.LogInformation("Starting up");

    if (app.Environment.IsDevelopment())
    {
        app.Lifetime.ApplicationStopping.Register(() =>
        {
            var usage = app.Services.GetRequiredService<LicenseUsageSummary>();
            
            app.Logger.LogInformation(Summary(usage));
        });
    }

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    app.Logger.LogCritical(ex, "Host terminated unexpectedly");
}
finally
{
    app.Logger.LogInformation("Shut down complete");
}

static string Summary(LicenseUsageSummary usage)
{
    var sb = new StringBuilder();
    sb.AppendLine("IdentityServer Usage Summary:");
    sb.AppendLine(CultureInfo.InvariantCulture, $"  License: {usage.LicenseEdition}");
    var features = usage.FeaturesUsed.Count > 0 ? string.Join(", ", usage.FeaturesUsed) : "None";
    sb.AppendLine(CultureInfo.InvariantCulture, $"  Business and Enterprise Edition Features Used: {features}");
    sb.AppendLine(CultureInfo.InvariantCulture, $"  {usage.ClientsUsed.Count} Client Id(s) Used");
    sb.AppendLine(CultureInfo.InvariantCulture, $"  {usage.IssuersUsed.Count} Issuer(s) Used");

    return sb.ToString();
}
```

You will also need to modify the `appSettings.json` file to include the `Logging` section:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information",
      "Duende.IdentityServer": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

Learn more about configuring logging in .NET applications by reading the [Microsoft documentation on logging fundamentals](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/logging/?view=aspnetcore-9.0#configure-logging). As you'll see in the Microsoft documentation, configuring logging can be very involved and target different log levels, which can be useful for troubleshooting.

### Setup For Serilog

[Serilog](https://serilog.net) is a trusted and popular logging library for .NET applications.
It is highly configurable,
and at Duende, we think it is a **great alternative** to the default logging
implementation,
especially for .NET developers looking for more control over their logging configuration.
Additionally,
ASP.NET Core developers can use the [Serilog.AspNetCore](https://github.com/serilog/serilog-aspnetcore) for
better integration with ASP.NET Core applications.

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
