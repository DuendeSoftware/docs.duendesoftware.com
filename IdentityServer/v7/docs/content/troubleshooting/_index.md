+++
title = "Troubleshooting"
weight = 205
+++

When troubleshooting an IdentityServer setup we have some tips and tricks to share. These are both ways to get more information out of the system as well as how to detect and fix some common problems.

## General debugging advice
Duende IdentityServer is a security product and by design the error messages returned to a user or client application are very short. The actual error message is always written to the logs. The very first step in any troubleshooting should be to review the IdentityServer logs.

Another common issue is that the logs are redacted and that  the interesting/relevant information is overwritten with **'[PII is hidden]'**. (For example *The '[PII is hidden]' for signing cannot be smaller than '[PII is hidden]' bits*). This is a privacy securing feature of th Microsoft.IdentityModel libraries that we use for token handling. The definition of possible PII in those libraries is very generous and includes key sizes, URLs etc.

There is a static property that can be set to disable the redacting.
```
IdentityModelEventSource.ShowPII = true; 
```

## Data protection 
Asp.Net Core Data Protection is an encryption mechanism that is heavily used by Duende.IdentityServer and the Asp.Net Core Authentication libraries. If it is not correctly configured it migth result in issues such as
* Unable to unprotect the message.State.
* The key {xxxxx-xxxx-xxx-xxx-xxxxxxx} was not found in the key ring.

See [our data protection guide]({{< ref "/deployment/data_protection" >}}) for more information.

## Load Balancing, proxies and TSL off loading
When running IdentityServer behind a load balancer it is important that IdentityServer still has access to the original request URL. IdentityServer uses that to create URLs that are included in the discovery document and in protocol messages.

To diagnose, open the discovery document (append `/.well-known/openid-configuration` to your root IdentityServer host), e.g. https://demo.duendesoftware.com/.well-known/openid-configuration. Make sure that the URLs listed in there have the correct host name and are listed as https (assuming you are running under https, which you should).

See [our proxy guide]({{< ref "/deployment/proxies" >}}) for more information.

## TaskCancellationExceptions
TaskCancellationExceptions occur when the incoming HTTP connection is terminated by the requestor. We pass the cancellation token along to Entity Framework so that it can cancel database queries and hopefully reduce load on your database. Both EF itself and the EF providers log those cancellations extremely aggressively before EF re-throws the exception. That unhandled exception then is handled by the IdentityServer middleware. This creates a lot of noise in the logs for what is actually expected behavior. It is normal for some HTTP requests to be canceled.

To help alleviate that, in version 6.2 of IdentityServer, we added a configurable filter to our logging to remove some of these unnecessary logs. Unfortunately the log messages that are written by EF itself are outside our control. Microsoft is in the process of updating EF to not log task cancellation so aggressively. In .NET 7, they were able to update the core EF but not the providers.

Since we know that these task cancellations are expected and safe, another thing you could do is to filter them out of your logs. I would expect most logging tools to allow you to put filters in place. For example, in serilog, adding something like this to your configuration should do the trick:

    Log.Logger = new LoggerConfiguration()
      .Filter
      .ByExcluding(logEvent => logEvent.Exception is OperationCanceledException)

## WAF Rules
Data protected data can contain --, and some firewalls disallow that because it looks like a sql comment/injection. This is not an IdentityServer issue but something that should be fixed on the firewall.

## Microsoft.IdentityModel Version Conflicts
The Microsoft.IdentityModel.\* libraries used by Duende IdentityServer all have to be of exactly the same version. If they are not it can cause unexpected issues reading configuration data and tokens, i.e. **IDX10500: Signature validation failed. No security keys were provided to validate the signature.** or **System.MissingMethodException: Method not found 'Boolean Microsoft.IdentityModel.Tokens.TokenUtilities.IsRecoverableConfiguration(...)'**

See [our guide]({{< ref "wilson" >}}) for more information on how to diagnose and fix version issues.
