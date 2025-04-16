---
title: Duende IdentityServer Troubleshooting
sidebar:
  label: Troubleshooting
  order: 15
redirect_from:
  - /mim/
  - /identityserver/v5/troubleshooting/
  - /identityserver/v6/troubleshooting/
  - /identityserver/v7/troubleshooting/
  - /identityserver/v7/troubleshooting/wilson/
---

When troubleshooting an IdentityServer setup we have some tips and tricks to share. These are both ways to get more
information out of the system and how to detect and fix some common problems.

## General Debugging Advice

Duende IdentityServer is a security product and by design the error messages returned to a user or client application
are very short. The actual error message is always written to the logs. The very first step in any troubleshooting
should be to review the IdentityServer logs.

Another common issue is that the logs are redacted and that the interesting/relevant information is overwritten with 
**'\[PII is hidden]'**. (For example *The '[PII is hidden]' for signing cannot be smaller than '[PII is hidden]' bits*).
This is a privacy feature of the Microsoft.IdentityModel libraries that we use for token handling. The definition of
possible PII in those libraries is very generous and includes key sizes, URLs etc.

There is a static property that can be set to disable the redacting.

```csharp
IdentityModelEventSource.ShowPII = true; 
```

We recommend to always set this flag to true in any development and test environment that does not contain real personal
data.

## Data protection

ASP.NET Core Data Protection is an encryption mechanism that is heavily used by Duende.IdentityServer and the ASP.NET
Core Authentication libraries. If it is not correctly configured it might result in issues such as

* Unable to unprotect the message.State.
* The key `{xxxxx-xxxx-xxx-xxx-xxxxxxx}` was not found in the key ring.
* Failed to unprotect AuthenticationTicket payload for key {key}

See [our data protection guide](/identityserver/deployment#data-protection-keys) for more
information.

## Load Balancing, proxies and TLS offloading

When running IdentityServer behind a load balancer it is important that IdentityServer still has access to the original
request URL. IdentityServer uses that to create URLs that are included in the discovery document and in protocol
messages.

To diagnose, open the discovery document (append `/.well-known/openid-configuration` to your root IdentityServer host),
e.g. https://demo.duendesoftware.com/.well-known/openid-configuration. Make sure that the URLs listed in there have the
correct host name and are listed as https (assuming you are running under https, which you should).

See [our proxy guide](/identityserver/deployment#proxy-servers-and-load-balancers) for more information.

## TaskCancellationExceptions

TaskCancellationExceptions occur when the incoming HTTP connection is terminated by the requester. We pass the
cancellation token along to Entity Framework so that it can cancel database queries and hopefully reduce load on your
database. Both EF itself and the EF providers log those cancellations extremely aggressively before EF re-throws the
exception. That unhandled exception then is handled by the IdentityServer middleware. This creates a lot of noise in the
logs for what is actually expected behavior. It is normal for some HTTP requests to be canceled.

To help alleviate that, in version 6.2 of IdentityServer, we added a configurable filter to our logging to remove some
of these unnecessary logs. Unfortunately the log messages that are written by EF itself are outside our control.
Microsoft is in the process of updating EF to not log task cancellation so aggressively. In .NET 7, they were able to
update the core EF but not the providers.

Since we know that these task cancellations are expected and safe, another thing you could do is to filter them out of
your logs. Most logging tools should allow you to put filters in place. For example, in serilog, adding something like
this to your configuration should do the trick:

```csharp
Log.Logger = new LoggerConfiguration()
  .Filter
  .ByExcluding(logEvent => logEvent.Exception is OperationCanceledException)
```

## WAF Rules

Data protected data can contain '--' (two dashes) and some firewalls disallow that because it looks like a sql
comment/injection. This is not an IdentityServer issue but something that should be fixed on the firewall.

## IdentityServerOptions.EmitStaticAudienceClaim and Token Validation

Some token validation implementations require that all JWTs
include an audience claim with the key/value of `"aud"` and `"<issuer>/resources"`.

To add an audience claim to tokens created by IdentityServer, set the
value of `IdentityServerOptions.EmitStaticAudienceClaim` to `true` during the setup
of your IdentityServer instance (default: `false`).

```csharp
// Program.cs
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

Duende IdentityServer, the Microsoft external authentication handlers and other libraries all use the
Microsoft.IdentityModel set of libraries. These libraries provide token and configuration handling features, and are

The `Microsoft.IdentityModel.*` libraries used by Duende IdentityServer all have to be of exactly the same version
However, this is not enforced by NuGet so it is common to end up with an application that brings in different versions
of
`Microsoft.IdentityModel.*` through transitive dependencies.

Version conflicts can cause unexpected issues reading configuration data and tokens, i.e. **IDX10500: Signature
validation
failed. No security keys were provided to validate the signature.** or **System.MissingMethodException: Method not
found 'Boolean Microsoft.IdentityModel.Tokens.TokenUtilities.IsRecoverableConfiguration(...)'**

### Known Errors

Errors that we have seen because of IdentityModel version mismatches include:

* IDX10500: Signature validation failed. No security keys were provided to validate the signature.
* System.MissingMethodException: Method not found 'Boolean
  Microsoft.IdentityModel.Tokens.TokenUtilities.IsRecoverableConfiguration(...)'
* Microsoft.AspNetCore.Authentication.AuthenticationFailureException: An error was encountered while handling the remote
  login. ---> System.InvalidOperationException: An invalid request URI was provided. Either the request URI must be an
  absolute URI or BaseAddress must be set.

### Diagnosing

Run this command in powershell:

```bash
dotnet list package --include-transitive | sls "Microsoft.IdentityModel|System.IdentityModel"
```

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

To fix this, add explicit package references to upgrade the packages that are of lower version to the most recent
version used.

```xml
<ItemGroup>
    <PackageReference Include="Microsoft.IdentityModel.Protocols" Version="7.4.0"/>
    <PackageReference Include="Microsoft.IdentityModel.Protocols.OpenIdConnect" Version="7.4.0"/>
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.4.0"/>
</ItemGroup>
```

## Performance Issues

In some installations, upgrading .NET and IdentityServer has caused performance issues. Since the IdentityServer and
.NET version upgrades typically are done at the same time, it is sometimes hard to tell what the root cause is
for the performance degradation. When working with installations to find the root cause, there are some dependencies
that have been found to cause issues in specific verisons.

### PostgreSQL Pooling

There are issues with some versions of the PostgreSQL client library that gives large memory consumption. Enabling
pooling on the operational store has solved this in the past:

```csharp
.AddOperationalStore(options =>
   {
      // Enable pooling:
      options.EnablePooling = true;

      // More settings....
   })
```

### Entity Framework Core & Microsoft SQL OPENJSON

Entity Framework Core version 8 introduced a new behaviour when creating `WHERE IN()` sql clauses. Previously, the
possible values were supplied as parameters, which meant that the query text was dependent on the number of items
in the collection. This was solved by sending the parameters as a JSON object and using `OPENJSON` to read the parameters.
While this enabled query plan caching, it unfortunately caused Microsoft SQL Server to generate bad query execution plans.

Please see [this EF Core GitHub Issue](https://github.com/dotnet/efcore/issues/32394#issuecomment-2266634632) for information
and possible mitigations.

### Microsoft Azure

The `Azure.Core` package versions `1.41.0` and prior had an issue that caused delays when accessing Azure resources.
This could be Azure blob storage or key vault for data protection or Azure SQL Server for stores, especially if managed
identities are used. This package is typically not referenced directly but brought in as a transient dependency 
through other packages. Ensure to use version `1.42.0` or later if you are hosting on Azure.

### Entity Framework Core, Microsoft.Data.SqlClient, and SqlServerRetryingExecutionStrategy

As more developers migrate their database-powered application to the cloud,
they will need to handle intermittent connection failures. In most cases, these transient connection failures occur and resolve in a short period of time, allowing the application to self-correct and continue processing requests. The strategy is known as **connection resiliency**. 

In recent versions of Entity Framework Core and `Microsoft.Data.SqlClient`, you can enable this retry strategy explicitly, but in the case of `Microsoft.Data.SqlClient`, when operating in a cloud environment, this strategy is enabled by default or defined in the connection string.

```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(
            @"Server=(localdb)\mssqllocaldb;Database=EFMiscellanous.ConnectionResiliency;Trusted_Connection=True;ConnectRetryCount=0",
            options => options.EnableRetryOnFailure());
}
```

In most cases, this is a _good feature to have enabled_ but there are drawbacks that can cause severe system degradation.

- Enabling retry on failure causes Entity Framework Core to buffer the result set. This significantly increases memory requirements and causes garbage collection pauses.
- Some versions of `Microsoft.Data.SqlClient` call `Thread.Sleep` that can lock threads for up to **_10 seconds_**. This can lead to thread exhaustion and server unresponsiveness. We've isolated this issue to versions.

  | Microsoft.EntityFrameworkCore.SqlServer | Microsoft.Data.SqlClient | Status     |
  |:----------------------------------------|:-------------------------|:-----------|
  | `8.0.0`                                 | `>=5.1.1`                | ✅ Good     |
  | `8.0.3`                                 | `>=5.1.5`                | ❌ Affected |
  | `8.0.4`                                 | `>=5.1.5`                | ❌ Affected |
  | `8.0.6`                                 | `>=5.1.5`                | ❌ Affected |
  | `8.0.11`                                | `>=5.1.6`                | ✅ Good     |
  | `9.0.1`                                 | `>=5.1.6`                | ✅ Good     |
  | `>9.0.1`                                | `>=6.0.0`                | ❌ Affected |

Architectural issues that may be causing connection resiliency issues you may want to investigate:

- Lack of caching in a high-load production environment.
- Under-provisioned database instance with limited resources or connections available.
- Datacenter networking issues caused by incorrect zoning choices.
- Under-provisioned application host with limited cores/threads.

## Cookie and Header Size Limits and Management

The default cookie size limit is `4096` bytes. This is a limit imposed by the browser. In practice, this limit is
enough for most applications. However, there are some scenarios where the default limit is not enough. ASP.NET Core will chunk cookies into multiple parts if they exceed the limit, but you may still run into `Bad Request - Request Too Long` when trying to set a cookie during the authentication process.

Here are some ways to manage the cookie size during authentication:

### Initiate a `SignOutAsync` during `Challenge`

When invoking `Challenge`, be sure to call `SignOutAsync` before returning the challenge result. This will ensure any existing session cookie is removed and a new one is created.

### Set SaveTokens to `false`

When dealing with external authentication, you may want to set `SaveTokens` to `false` when calling `AddOpenIdConnect` to avoid storing the tokens in the cookie. Storing these tokens may not be necessary for your use case and thus take up unnecessary space.

### Set MapInboundClaims to `false`

When dealing with external authentication, you may want to set `MapInboundClaims` to `false` when calling `AddOpenIdConnect` to avoid mapping the claims from the external provider to the local user. Microsoft's namespace for external claims is `http://schemas.microsoft.com/identity/claims/` is larger than the claim names used by OpenID Connect and can take up unnecessary space.

### Implement `OnTicketReceived` To Reduce Cookie Size

When dealing with external authentication, you may want to implement `OnTicketReceived` to reduce the size of the cookie. This is a callback that is invoked after the external authentication process is complete. You can use this callback to remove any claims that are not needed by your solution.