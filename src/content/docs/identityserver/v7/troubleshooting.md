---
title: Troubleshooting
sidebar:
  order: 15
---

When troubleshooting an IdentityServer setup we have some tips and tricks to share. These are both ways to get more information out of the system as well as how to detect and fix some common problems.

## General Debugging Advice
Duende IdentityServer is a security product and by design the error messages returned to a user or client application are very short. The actual error message is always written to the logs. The very first step in any troubleshooting should be to review the IdentityServer logs.

Another common issue is that the logs are redacted and that the interesting/relevant information is overwritten with **'[PII is hidden]'**. (For example *The '[PII is hidden]' for signing cannot be smaller than '[PII is hidden]' bits*). This is a privacy  feature of the Microsoft.IdentityModel libraries that we use for token handling. The definition of possible PII in those libraries is very generous and includes key sizes, URLs etc.

There is a static property that can be set to disable the redacting.

```csharp
IdentityModelEventSource.ShowPII = true; 
```

We recommend to always set this flag to true in any development and test environment that does not contain real personal data.

## Data protection 
Asp.Net Core Data Protection is an encryption mechanism that is heavily used by Duende.IdentityServer and the Asp.Net Core Authentication libraries. If it is not correctly configured it might result in issues such as
* Unable to unprotect the message.State.
* The key {xxxxx-xxxx-xxx-xxx-xxxxxxx} was not found in the key ring.
* Failed to unprotect AuthenticationTicket payload for key {key}

See [our data protection guide](./deployment#data-protection-keys-and-identityservers-signing-keys) for more information.

## Load Balancing, proxies and TLS offloading
When running IdentityServer behind a load balancer it is important that IdentityServer still has access to the original request URL. IdentityServer uses that to create URLs that are included in the discovery document and in protocol messages.

To diagnose, open the discovery document (append `/.well-known/openid-configuration` to your root IdentityServer host), e.g. https://demo.duendesoftware.com/.well-known/openid-configuration. Make sure that the URLs listed in there have the correct host name and are listed as https (assuming you are running under https, which you should).

See [our proxy guide](/identityserver/v7/deployment#proxy-servers-and-load-balancers) for more information.

## TaskCancellationExceptions
TaskCancellationExceptions occur when the incoming HTTP connection is terminated by the requestor. We pass the cancellation token along to Entity Framework so that it can cancel database queries and hopefully reduce load on your database. Both EF itself and the EF providers log those cancellations extremely aggressively before EF re-throws the exception. That unhandled exception then is handled by the IdentityServer middleware. This creates a lot of noise in the logs for what is actually expected behavior. It is normal for some HTTP requests to be canceled.

To help alleviate that, in version 6.2 of IdentityServer, we added a configurable filter to our logging to remove some of these unnecessary logs. Unfortunately the log messages that are written by EF itself are outside our control. Microsoft is in the process of updating EF to not log task cancellation so aggressively. In .NET 7, they were able to update the core EF but not the providers.

Since we know that these task cancellations are expected and safe, another thing you could do is to filter them out of your logs. Most logging tools should allow you to put filters in place. For example, in serilog, adding something like this to your configuration should do the trick:

```csharp
Log.Logger = new LoggerConfiguration()
  .Filter
  .ByExcluding(logEvent => logEvent.Exception is OperationCanceledException)
```

## WAF Rules
Data protected data can contain '--' (two dashes) and some firewalls disallow that because it looks like a sql comment/injection. This is not an IdentityServer issue but something that should be fixed on the firewall.

## Microsoft.IdentityModel Version Conflicts
The Microsoft.IdentityModel.\* libraries used by Duende IdentityServer all have to be of exactly the same version. If they are not it can cause unexpected issues reading configuration data and tokens, i.e. **IDX10500: Signature validation failed. No security keys were provided to validate the signature.** or **System.MissingMethodException: Method not found 'Boolean Microsoft.IdentityModel.Tokens.TokenUtilities.IsRecoverableConfiguration(...)'**

See [our guide](#microsoftidentitymodel-versions) for more information on how to diagnose and fix version issues.

## IdentityServerOptions.EmitStaticAudienceClaim and Token Validation

Some token validation implementations require that all JWTs
include an audience claim with the key/value of `"aud"` and `"&lt;issuer&gt;/resources"`.

To add an audience claim to tokens created by IdentityServer, set the
value of `IdentityServerOptions.EmitStaticAudienceClaim` to `true` during the setup
of your IdentityServer instance (default: `false`).

```csharp
services.AddIdentityServer(options =>
{
    // add "aud" claim to JWT
    options.EmitStaticAudienceClaim = true;
})
.AddClientStore<ClientStore>()
.AddInMemoryIdentityResources(IdentityResources)
.AddInMemoryApiScopes(ApiScopes);
```

## Microsoft.IdentityModel versions

Duende IdentityServer, the Microsoft external authentication handlers and other libraries all use the Microsoft.IdentityModel set of libraries. These libraries provides token and configuration handling features. The functionality is split up between different libraries and they all need to be **exactly the same version**. However this is not enforced by Nuget so it is common to end up with an application that brings in different versions of Microsoft.IdentityModel.* through transitive dependencies.

### Known Errors
Errors that we have seen because of IdentityModel version mismatches include:
* IDX10500: Signature validation failed. No security keys were provided to validate the signature.
* System.MissingMethodException: Method not found 'Boolean Microsoft.IdentityModel.Tokens.TokenUtilities.IsRecoverableConfiguration(...)'
* Microsoft.AspNetCore.Authentication.AuthenticationFailureException: An error was encountered while handling the remote login. ---> System.InvalidOperationException: An invalid request URI was provided. Either the request URI must be an absolute URI or BaseAddress must be set.

### Diagnosing
Run this command in powershell: `dotnet list package --include-transitive | sls "Microsoft.IdentityModel|System.IdentityModel"`

The output should look something like this:
```txt
   > Microsoft.IdentityModel.Abstractions                       7.4.0
   > Microsoft.IdentityModel.JsonWebTokens                      7.4.0
   > Microsoft.IdentityModel.Logging                            7.4.0
   > Microsoft.IdentityModel.Protocols                          7.0.3
   > Microsoft.IdentityModel.Protocols.OpenIdConnect            7.0.3
   > Microsoft.IdentityModel.Tokens                             7.4.0
   > System.IdentityModel.Tokens.Jwt                            7.0.3
```

In the above example it is clear that there are different versions active.

### Fixing
To fix this, add explicit package references to upgrade the packages that are of lower version to the most recent version used.

```xml
<PackageReference Include="Microsoft.IdentityModel.Protocols" Version="7.4.0" />
<PackageReference Include="Microsoft.IdentityModel.Protocols.OpenIdConnect" Version="7.4.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.4.0" />
```
