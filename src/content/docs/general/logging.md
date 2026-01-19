---
title: "Logging Fundamentals"
description: "General guidance on configuring logging for Duende Software products using Microsoft.Extensions.Logging and Serilog."
date: 2026-01-19
sidebar:
  order: 10
---

All Duende Software products (IdentityServer, Backend for Frontend (BFF), Access Token Management, etc.) use the standard logging facilities provided by ASP.NET Core (`Microsoft.Extensions.Logging`).
This means they integrate seamlessly with whatever logging provider you choose for your application.

This guide provides general instructions for setting up logging that apply to all our products.

## Log Levels

We adhere to the standard Microsoft guidelines for log levels. Understanding these levels helps you configure the appropriate verbosity for your environment.

* **`Trace`**
  * **Usage:** Extremely detailed information for troubleshooting complex issues.
  * **Production:** **Do not enable** in production unless specifically instructed for diagnostics. May contain sensitive data (e.g., token hashes, PII).
* **`Debug`**
  * **Usage:** Internal flow details, useful for understanding _why_ a decision was made (e.g., policy evaluation, token validation steps).
  * **Production:** Generally disabled in production, but safe to enable temporarily for deeper investigation.
* **`Information`**
  * **Usage:** High-level events tracking the general flow (e.g., "Request started", "Token issued").
  * **Production:** Often the default level for production.
* **`Warning`**
  * **Usage:** Unexpected events that didn't stop the application but might require investigation (e.g., "Invalid client configuration detected").
* **`Error`**
  * **Usage:** Exceptions and errors that cannot be handled gracefully.
* **`Critical`**
  * **Usage:** Failures that require immediate attention (e.g., "Signing key not found").

## Setup for Microsoft.Extensions.Logging

This is the default logging provider for ASP.NET Core. If you haven't configured a third-party logger, this is what you are using.

You can configure log levels in your `appsettings.json` file. To get detailed logs from Duende products, you often want to set the `Duende` namespace (or specific sub-namespaces) to `Debug`.

```json
// appsettings.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information",
      // Enable Debug logs for all Duende products
      "Duende": "Debug"
    }
  }
}
```

## Setup for Serilog

[Serilog](https://serilog.net) is a popular structured logging library for .NET. We highly recommend it for its flexibility and rich sink ecosystem (Console, File, Seq, Elasticsearch, etc.).

### 1. Installation

Install the necessary packages:

```bash
dotnet add package Serilog.AspNetCore
```

### 2. Configuration In `Program.cs`

Configure Serilog early in your application startup to capture all logs, including startup errors.

```csharp
// Program.cs
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((ctx, lc) => lc
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level}] {SourceContext}{NewLine}{Message:lj}{NewLine}{Exception}{NewLine}")
    .Enrich.FromLogContext()
    .ReadFrom.Configuration(ctx.Configuration));

var app = builder.Build();

app.UseSerilogRequestLogging(); // Optional: cleaner HTTP request logging

// ... rest of your pipeline
```

### 3. Configuration In `appsettings.json`

You can then control log levels via `appsettings.json`. This approach allows you to change log levels without recompiling your code.

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "Microsoft.Hosting.Lifetime": "Information",
        "System": "Warning",
        // Enable detailed logging for Duende products
        "Duende": "Debug"
      }
    }
  }
}
```

## Troubleshooting Specific Products

If you are debugging a specific component, you can target its namespace to reduce noise.

| Product                     | Namespace                      |
|-----------------------------|--------------------------------|
| **IdentityServer**          | `Duende.IdentityServer`        |
| **BFF**                     | `Duende.Bff`                   |
| **Access Token Management** | `Duende.AccessTokenManagement` |

Example `appsettings.json` for debugging only BFF interactions:

```json
"Duende.Bff": "Debug",
"Duende.IdentityServer": "Information"
```
