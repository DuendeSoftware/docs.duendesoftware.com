---
title: "OpenTelemetry"
date: 2020-09-10T08:22:12+02:00
weight: 30
---

(added in v6.1, expanded in v7.0)

[OpenTelemetry](https://opentelemetry.io) is a collection of tools, APIs, and SDKs for generating and collecting
telemetry data (metrics, logs, and traces). This is very useful for analyzing software performance and behavior, 
especially in highly distributed systems.

.NET 8 comes with first class support for Open Telemetry. IdentityServer emmits traces, metrics and logs.
- Metrics are high level statistic counters. They provide an aggregated overview and can be used to set monitoring rules.
- Traces shows individual requests and dependencies. The output is very useful for visualizing the control 
  flow and finding performance bottlenecks.
- Logs contains all the details when needed for troubleshooting.

# Metrics
The metric counters are designed to provide a high level overview. They are designed to not contain any
sensitive information. The counters may contains tags to indicate the source of the data.

## High level Metrics
The instrumation provides some high level metrics that are probably a good starting point for building a metrics dashboard.

#### Telemetry.Metrics.Counters.Failure/Success
Counter names: *failure*/*success*

Aggregaged counter of failed and successful operations. Please note that it is expected to have failures during normal
operation of IdentityServer. The failure/success ratio can be used as a very high level health metric.
|Tag|Description|
|---|---|
|error | Error label on errors|
|client | Id of client requesting the operation. May be empty. |

#### Telemetry.Metrics.Counters.ActiveRequests
Counter name: *active_requests*

Gauge/up-down counter that shows current active requests that are processed by any IdentityServer endpoint. 
Please note that the pages in the user interface are not IdentityServer endpoints and are not included in this count.
|Tag|Description|
|---|---|
|endpoint | The type name for the endpoint processor |
|path | The path of the request |

#### Telemetry.Metrics.Counters.UnHandledException
Counter names: *unhandled_exception*
 
Number of globally unhandled exceptions from IdentityServer.
|Tag|Description|
|---|---|
|type | The type name of the exception |
|method | The name of the method where the exception was thrown. |

### Detailed Metrics
There are also more detailed metrics available that show the usage of specific flows and features.
####  Telemetry.Metrics.Counters.ApiSecretValidation/ApiSecretValidationFailure
Counter names: *apisecret_validation*/*apisecret_validation_failure*

Number of successful/failed validations of API Secrets.
|Tag|Description|
|---|---|
|api | The Api Id |
|auth_method | Authentication method used |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.BackchannelAuthentication/BackchannelAuthenticationFailure
Counter names: *backchannel_authentication*/*backchannel_authentication_failure*
 
Number of successful/failed back channel authentications (CIBA).
|Tag|Description|
|---|---|
|client | The client Id |
|error | Error label on errors |


#### Telemetry.Metrics.Counters.ClientValidation/ClientValidationFailure 
Counter names: *client_validation*/*client_validation_failure*
 
Number of successful/failed client validations.
|Tag|Description|
|---|---|
|client | The client Id |
|error | Error label on errors |


#### Telemetry.Metrics.Counters.ClientSecretValidation/ClientSecretValidationFailure
Counter names: *clientsecret_validation*/*clientsecret_validation_failure*
 
Number of successful/failed client secret validations.
|Tag|Description|
|---|---|
|client | The client Id |
|auth_method | The authentication method on success |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.DeviceAuthentication/DeviceAuthenticationFailure 
Counter names: *device_authentication*/*device_authentication_failure*
 
Number of successful/failed device authentications.
|Tag|Description|
|---|---|
|client | The client Id |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.DynamicIdentityProviderValidation/DynamicIdentityProviderValidationFailure  
Counter names: *dynamic_identityprovider_validation*/*dynamic_identityprovider_validation_failure*
 
Number of successful/failed validations of dynamic identity providers.
|Tag|Description|
|---|---|
|scheme | The scheme name of the provider |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.Introspection/IntrospectionFailure  
Counter names: *introspection_failure*/*introspection_failure*
 
Number of successful/failed token instrospections.
|Tag|Description|
|---|---|
|caller| The caller of the endpoint, a client id or api id.|
|active| Was the token active? Only sent on success |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.PushedAuthorizationRequest/PushedAuthorizationRequestFailure  
Counter names: *pushed_authorization_request*/*pushed_authorization_request_failure*
 
Number of successful/failed pushed authorization requests.
|Tag|Description|
|---|---|
|client | The client Id |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.ResourceOwnerAuthentication/ResourceOwnerAuthenticationFailure  
Counter names: *resourceowner_authentication*/*resourceowner_authentication_failure*
 
Number of successful/failed resource owner authentications.
|Tag|Description|
|---|---|
|client | The client Id |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.Revocation/RevocationFailure
Counter names: *revocation_failure*/*revocation_failure*
 
Number of successful/failed token revocations.
|Tag|Description|
|---|---|
|client | The client Id |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.TokenIssued/TokenIssuedFailure 
Counter names: *token_issued*/*token_issued_failure*
 
Number of successful/failed token issuance attempts. Note that a token issuance might include
multiple actual tokens (id_token, access token, refresh token).
|Tag|Description|
|---|---|
|client | The client Id |
|grant_type | The grant type used |
|authorize_request_type| The authorize request type, if information about it is available |
|error | Error label on errors |

### Metrics in the UI
Duende IdentityServer in itself does not provide a UI. That is [the responsibility of the hosting application]
({{< ref "/ui/" >}}). That is why there are no metrics from the core IdentityServer system for things
like user login/logout as those events are responsibilities for the UI. We do provide quick start UIs
which are meant as a starting point for your own UI development. In the quick start UIs we do provide
metrics as a starting point, but you should alter and add metrics as needed in your context.

#### Telemetry.Metrics.Counters.ConsentGranted/ConsentDenied
Counter names: *consent_granted*/*consent_denied*

Consents granted or consent requests denied. The counters are per scope, so if a user consents
to multiple scopes, the counter is increased multiple times, one for each scope. The reason
for this is to be able to include the scope name as a tag without causing an explosion of
combination of tags.

|Tag|Description|
|---|---|
|client | The client Id |
|scope | The scope names|

#### Telemetry.Metrics.Counters.GrantsRevoked 
Counter name: *grants_revoked*

Revocation of grants.

|Tag|Description|
|---|---|
|client | The client Id, if grants are revoked only for one client. If not set the revocation was for all clients. |

#### Telemetry.Metrics.Counters.UserLogin/UserLoginFailure 
Counter names: *user_login*/*user_login_failure*

Successful and failed user logins.

|Tag|Description|
|---|---|
|client | The client Id, if the login was caused by a request from a client |
|idp | The idp (Asp.Net Core Scheme name) used to log in |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.UserLogout
Counter names: *user_logout*

User logout. Note that this is only raised on explicit user logout, not if the session times out. The number of logouts
will typically be lower than the number of logins.

|Tag|Description|
|---|---|
|idp | The idp (Asp.Net Core Scheme name) logging out from |

# Traces
Here's e.g. the output for a request to the discovery endpoint:

![](../images/otel_disco.png)

When multiple applications send their traces to the same OTel server, this becomes super useful for following e.g. authentication flows over service boundaries.

The following screenshot shows the ASP.NET Core OpenID Connect authentication handler redeeming the authorization code:

![](../images/otel_flow_1.png)

...and then contacting the userinfo endpoint:

![](../images/otel_flow_2.png)

*The above screenshots are from https://www.honeycomb.io.*

### Setup
To start emitting Otel tracing information you need 

* add the Otel libraries to your IdentityServer and client applications
* start collecting traces from the various IdentityServer sources (and other sources e.g. ASP.NET Core)

```cs
builder.Services.AddOpenTelemetryTracing(builder =>
{
    builder
        .AddSource(IdentityServerConstants.Tracing.Basic)
        .AddSource(IdentityServerConstants.Tracing.Cache)
        .AddSource(IdentityServerConstants.Tracing.Services)
        .AddSource(IdentityServerConstants.Tracing.Stores)
        .AddSource(IdentityServerConstants.Tracing.Validation)
        
        .SetResourceBuilder(
            ResourceBuilder.CreateDefault()
                .AddService("MyIdentityServerHost"))
        .AddHttpClientInstrumentation()
        .AddAspNetCoreInstrumentation()
        .AddSqlClientInstrumentation()
        .AddOtlpExporter(option =>
        {
            // wire up OTel server
        });
});
```

This [sample]({{< ref "/samples/diagnostics#opentelemetry-support" >}}) uses the console exporter and can be used as a starting point.

### Tracing sources
IdentityServer can emit very fine grained traces which is useful for performance troubleshooting and general exploration of the control flow.

This might be too detailed in production. 

You can select which information you are interested in by selectively listening to various traces:

* **IdentityServerConstants.Tracing.Basic**
   
   High level request processing like request validators and response generators

* **IdentityServerConstants.Tracing.Cache**
   
   Caching related tracing

* **IdentityServerConstants.Tracing.Services**
   
   Services related tracing

* **IdentityServerConstants.Tracing.Stores**
   
   Store related tracing

* **IdentityServerConstants.Tracing.Validation**
   
   More detailed tracing related to validation