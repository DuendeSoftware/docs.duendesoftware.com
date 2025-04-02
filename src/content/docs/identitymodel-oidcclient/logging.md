---
title: Logging
sidebar:
  order: 30
---

OidcClient logs errors, warnings, and diagnostic information using
*Microsoft.Extensions.Logging.ILogger*, the standard .NET logging library. You can use any
logging provider to store your logs however you like. For example, you could configure
[Serilog](https://github.com/serilog/serilog-extensions-hosting) like this:

```csharp
var serilog = new LoggerConfiguration()
    .MinimumLevel.Verbose()
    .Enrich.FromLogContext()
    .WriteTo.LiterateConsole(outputTemplate: "[{Timestamp:HH:mm:ss} {Level}] {SourceContext}{NewLine}{Message}{NewLine}{Exception}{NewLine}")
    .CreateLogger();

options.LoggerFactory.AddSerilog(serilog);
```
