+++
title = "Troubleshooting"
weight = 205
+++

## General debugging advice
- Basically this comes down to "Read the identity server logs"
- In development, we can show PII as well:
  ```
  IdentityModelEventSource.ShowPII = true; 
  ```
- Link to our [youtube channel](https://www.youtube.com/@duendesoftware)

## Common Errors and Exceptions
If we have docs elsewhere, we can link to those pages. We should include exceptions or log messages to help find things here.

#### Data protection 
TODO - link to new page
#### Load Balancing
TODO - link to new page
#### Correlation Failures
TODO
#### Cookie Problems
TODO - SameSite=none, 3rd party cookie blocking, etc cause issues
#### Database updates/schema issues
#### TaskCancellationExceptions
TODO - Edit this section
TaskCancellationExceptions occur when the incoming HTTP connection is terminated by the requestor. We pass the cancellation token along to Entity Framework so that it can cancel database queries and hopefully reduce load on your database. Both EF itself and the EF providers log those cancellations extremely aggressively before EF re-throws the exception. That unhandled exception then is handled by the IdentityServer middleware. This creates a lot of noise in the logs for what is actually expected behavior. It is normal for some HTTP requests to be canceled.

To help alleviate that, in version 6.2 of IdentityServer, we added a configurable filter to our logging to remove some of these unnecessary logs. Unfortunately the log messages that are written by EF itself are outside our control. Microsoft is in the process of updating EF to not log task cancellation so aggressively. In .NET 7, they were able to update the core EF but not the providers.

Since we know that these task cancellations are expected and safe, another thing you could do is to filter them out of your logs. I would expect most logging tools to allow you to put filters in place. For example, in serilog, adding something like this to your configuration should do the trick:

    Log.Logger = new LoggerConfiguration()
      .Filter
      .ByExcluding(logEvent => logEvent.Exception is OperationCanceledException)
#### WAF Rules
TODO - Expand this section

Data protected data can contain --, and some firewalls disallow that because it looks like a sql comment/injection.

