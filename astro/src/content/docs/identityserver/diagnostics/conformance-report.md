---
title: "Conformance Report"
description: How to install, configure, and use the IdentityServer conformance report to assess OAuth 2.1 and FAPI 2.0 compliance.
date: 2026-03-02
sidebar:
  label: Conformance Report
  order: 50
  badge:
    text: v8.0
    variant: tip
---

The conformance report assesses your IdentityServer deployment against
[OAuth 2.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1) and
[FAPI 2.0 Security Profile](https://openid.net/specs/fapi-2_0-security-profile.html) specifications,
generating an HTML report accessible via a protected endpoint.

## Installation

Install the NuGet package:

```bash title="Terminal"
dotnet add package Duende.IdentityServer.ConformanceReport
```

## Setup

### 1. Register the Conformance Report

Call `AddConformanceReport()` on the IdentityServer builder:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddConformanceReport(options =>
    {
        options.Enabled = true;
    });
```

### 2. Map the Endpoint

Add the conformance report endpoint to your middleware pipeline:

```csharp
// Program.cs
app.MapConformanceReport();
```

### 3. Access the Report

Navigate to: `https://your-server/_duende/conformance-report`

The endpoint requires an authenticated user by default (see [Authorization](#authorization) below).

## Configuration Options

`ConformanceReportOptions` controls the conformance report feature:

| Property                        | Type                                  | Default                     | Description                                                      |
| ------------------------------- | ------------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `Enabled`                       | `bool`                                | `false`                     | Enable or disable the conformance report endpoint.               |
| `EnableOAuth21Assessment`       | `bool`                                | `true`                      | Include OAuth 2.1 profile assessment in the report.              |
| `EnableFapi2SecurityAssessment` | `bool`                                | `true`                      | Include FAPI 2.0 Security Profile assessment in the report.      |
| `PathPrefix`                    | `string`                              | `"_duende"`                 | URL path prefix for the conformance endpoint (no leading slash). |
| `ConfigureAuthorization`        | `Action<AuthorizationPolicyBuilder>?` | Requires authenticated user | Authorization policy for the HTML report endpoint.               |
| `AuthorizationPolicyName`       | `string`                              | `"ConformanceReport"`       | ASP.NET Core authorization policy name used internally.          |
| `HostCompanyName`               | `string?`                             | `null`                      | Optional company name shown in the report header.                |
| `HostCompanyLogoUrl`            | `Uri?`                                | `null`                      | Optional company logo URL shown in the report header.            |

## Authorization

By default, the report endpoint requires an authenticated user. Customize the policy using
`ConfigureAuthorization`:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddConformanceReport(options =>
    {
        options.Enabled = true;

        // Require a specific role
        options.ConfigureAuthorization = policy => policy.RequireRole("Admin");

        // Or require multiple conditions
        // options.ConfigureAuthorization = policy => policy
        //     .RequireRole("Admin")
        //     .RequireClaim("department", "IT");

        // Or allow anonymous (development/testing only)
        // options.ConfigureAuthorization = policy =>
        //     policy.RequireAssertion(_ => builder.Environment.IsDevelopment());
    });
```

:::caution
If you set `ConfigureAuthorization = null`, you must manually register an ASP.NET Core authorization
policy with the name specified in `AuthorizationPolicyName` (default: `"ConformanceReport"`).
Otherwise, the endpoint will fail at runtime with a "policy not found" error.
:::

## Understanding the Report

The HTML report displays:

* **Server Configuration** — a matrix of server-level conformance rules and their status
* **Client Configurations** — a matrix of per-client conformance rules and their status
* **Rule Legend** — explanation of each rule identifier
* **Notes** — detailed messages for warnings and failures

### Status Indicators

| Symbol  | Meaning                                                  |
| ------- | -------------------------------------------------------- |
| Pass    | Requirement is met                                       |
| Fail    | Requirement is not met (configuration is non-conformant) |
| Warning | Recommended practice is not followed                     |
| N/A     | Rule is not applicable to this configuration             |

## Requirements

The conformance report uses `IClientStore.GetAllClientsAsync` to enumerate all clients for
assessment. Custom `IClientStore` implementations must implement this method (added in v8.0).
See the [upgrade guide](/identityserver/upgrades/v7_4-to-v8_0/#iclientstoregettallclientsasync-now-required)
for details.

## Full Example

```csharp
// Program.cs

builder.Services.AddIdentityServer()
    .AddInMemoryClients(Config.Clients)
    .AddConformanceReport(options =>
    {
        options.Enabled = true;
        options.EnableOAuth21Assessment = true;
        options.EnableFapi2SecurityAssessment = true;
        options.HostCompanyName = "Acme Corp";
        options.ConfigureAuthorization = policy => policy.RequireRole("ComplianceTeam");
    });

// ...

app.MapConformanceReport();
app.UseIdentityServer();
```
