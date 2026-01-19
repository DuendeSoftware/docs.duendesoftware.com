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

Duende IdentityServer uses the standard logging facilities provided by ASP.NET Core. You don't need to do any extra configuration to benefit from rich logging functionality.

For general information on how to configure logging, setting up Serilog, and understanding log levels in Duende products, see our [Logging Fundamentals](/general/logging.md) guide.

## Configuration

Logs are typically written under the `Duende.IdentityServer` category.

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

To get detailed logs from IdentityServer, you can configure your `appsettings.json` to enable `Debug` or `Information` level logs for the `Duende.IdentityServer` namespace:

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Duende.IdentityServer": "Information"
    }
  }
}
```

:::note
In production, logging might produce too much data. It is recommended you either turn it off, or default to the `Warning` level. Have a look at [events](/identityserver/diagnostics/events.md) for more high-level production instrumentation.
:::

### Filtering Exceptions

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
