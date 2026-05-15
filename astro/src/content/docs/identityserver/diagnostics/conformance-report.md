---
title: "Financial-Grade Security and Conformance Report"
description: How to install, configure, and use the IdentityServer Financial-Grade Security and Conformance report to assess OAuth 2.1 and FAPI 2.0 compliance.
date: 2026-03-02
sidebar:
  label: Conformance Report
  order: 60
  badge:
    text: v8.0
    variant: tip
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

Part of Financial-Grade Security and Conformance, the conformance report assesses your IdentityServer
deployment against [OAuth 2.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1) and
[FAPI 2.0 Security Profile](https://openid.net/specs/fapi-2_0-security-profile.html) specifications,
generating an HTML report accessible via a protected endpoint.

## Installation

Install the NuGet package:

```bash title="Terminal"
dotnet add package Duende.IdentityServer.ConformanceReport --prerelease
```

## Setup

### 1. Register the Financial-Grade Security and Conformance Report

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

Add the Financial-Grade Security and Conformance report endpoint to your middleware pipeline:

```csharp
// Program.cs
app.MapConformanceReport();
```

### 3. Access the Report

Navigate to: `https://your-server/_duende/conformance-report`

The endpoint requires an authenticated user by default (see [Authorization](#authorization) below).

## Configuration Options

`ConformanceReportOptions` controls the Financial-Grade Security and Conformance report feature:

* **`Enabled`**
  Enable or disable the conformance report endpoint. Defaults to `false`.

* **`EnableOAuth21Assessment`**
  Include OAuth 2.1 profile assessment in the report. Defaults to `true`.

* **`EnableFapi2SecurityAssessment`**
  Include FAPI 2.0 Security Profile assessment in the report. Defaults to `true`.

* **`PathPrefix`**
  URL path prefix for the conformance endpoint (no leading slash). Defaults to `"_duende"`.

* **`ConfigureAuthorization`**
  Authorization policy for the HTML report endpoint. Defaults to require an authenticated user.

* **`AuthorizationPolicyName`**
  ASP.NET Core authorization policy name used internally. Defaults to `"ConformanceReport"`.

* **`HostCompanyName`**
  Optional company name shown in the report header. Defaults to `null`.

* **`HostCompanyLogoUrl`**
  Optional company logo URL shown in the report header. Defaults to `null`.

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
See the [upgrade guide](/identityserver/upgrades/v7_4-to-v8_0.md#iclientstoregetallclientsasync-now-required)
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
