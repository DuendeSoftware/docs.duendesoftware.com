---
title: OIDC Client Logging
description: Learn how to configure and customize logging in OidcClient using Microsoft.Extensions.Logging.ILogger
sidebar:
  label: Logging
  order: 4
redirect_from:
  - /foss/identitymodel.oidcclient/logging/
---

`OidcClient` logs errors, warnings, and diagnostic information using
`Microsoft.Extensions.Logging.ILogger`, the standard .NET logging library.

```cs
using Duende.IdentityModel;
using Duende.IdentityModel.OidcClient;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton(svc =>
{
    var loggerFactory = svc.GetRequiredService<ILoggerFactory>();
    var options = new OidcClientOptions
    {
        Authority = "https://demo.duendesoftware.com",
        ClientId = "interactive.public",
        Scope = "openid profile email offline_access",
        RedirectUri = "app://localhost/",
        PostLogoutRedirectUri = "app://localhost/",
        LoggerFactory = loggerFactory
    };
    return new OidcClient(options);
});

var app = builder.Build();
var client = app.Services.GetService<OidcClient>();
```

You can use any logging provider to store your logs however you like, by setting the `LoggerFactory` property on `OidcClientOptions`.

For example, you could configure
[Serilog](https://github.com/serilog/serilog-extensions-hosting) like this:

```csharp
var serilog = new LoggerConfiguration()
    .MinimumLevel.Verbose()
    .Enrich.FromLogContext()
    .WriteTo.LiterateConsole(outputTemplate: "[{Timestamp:HH:mm:ss} {Level}] {SourceContext}{NewLine}{Message}{NewLine}{Exception}{NewLine}")
    .CreateLogger();

options.LoggerFactory.AddSerilog(serilog);
```

## Log Levels

The `OidcClient` logs at the following levels:

- `Trace`
- `Debug`
- `Information`
- `Error`

You can set the log level in your `appSettings.json` by modifying the following snippet.

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information",
      "Duende.IdentityModel.OidcClient": "Error"
    }
  }
}
```
