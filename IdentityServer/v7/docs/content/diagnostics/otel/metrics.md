---
title: "Metrics"
date: 2020-09-10T08:22:12+02:00
weight: 10
---

(added in v7.0)

The metric counters are designed to provide a high level overview. They are designed to not contain any
sensitive information. The counters may contain tags to indicate the source of the data.

## High level Metrics
These metrics are instrumented by the IdentityServer middleware and services and are
intended to describe the overall usage and health of the system. They could provide the
starting point for building a metrics dashboard.

#### Telemetry.Metrics.Counters.Failure/Success
Counter names: *failure*/*success*

Aggregated counter of failed and successful operations. Note that it is expected to have failures during normal
operation of IdentityServer. The failure/success ratio can be used as a very high level health metric.
|Tag|Description|
|---|---|
|error | Error label on errors|
|client | Id of client requesting the operation. May be empty. |

#### Telemetry.Metrics.Counters.ActiveRequests
Counter name: *active_requests*

Gauge/up-down counter that shows current active requests that are processed by any IdentityServer endpoint. 
Note that the pages in the user interface are not IdentityServer endpoints and are not included in this count.
|Tag|Description|
|---|---|
|endpoint | The type name for the endpoint processor |
|path | The path of the request |

#### Telemetry.Metrics.Counters.UnHandledException
Counter name: *unhandled_exception*
 
Number of globally unhandled exceptions from IdentityServer.
|Tag|Description|
|---|---|
|type | The type name of the exception |
|method | The name of the method where the exception was thrown. |

### Detailed Metrics
These detailed metrics are instrumented by the IdentityServer middleware and services and track usage of specific flows and features.
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
 
Number of successful/failed token introspections.
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
The [UI in your IdentityServer host]({{< ref "/ui/" >}}) can instrument these events to
measure activities that occur during interactive flows, such as user login and logout. The
These events are not instrumented by the IdentityServer middleware or services because
they are the responsibility of the UI. Our templated UI does instrument these events, and
you can alter and add metrics as needed to the UI in your context.

#### Telemetry.Metrics.Counters.ConsentGranted/ConsentDenied
Counter names: *consent_granted*/*consent_denied*

Consent requests granted or denied. The counters are per scope, so if a user consents
to multiple scopes, the counter is increased multiple times, one for each scope. This allows
the scope name to be included as a tag without causing an explosion of combination of tags.

|Tag|Description|
|---|---|
|client | The client Id |
|scope | The scope names|

#### Telemetry.Metrics.Counters.GrantsRevoked 
Counter name: *grants_revoked*

Revocation of grants.

|Tag|Description|
|---|---|
|client | The client Id, if grants are revoked only for one client. If not set, the revocation was for all clients. |

#### Telemetry.Metrics.Counters.UserLogin/UserLoginFailure 
Counter names: *user_login*/*user_login_failure*

Successful and failed user logins.

|Tag|Description|
|---|---|
|client | The client Id, if the login was caused by a request from a client |
|idp | The idp (Asp.Net Core Scheme name) used to log in |
|error | Error label on errors |

#### Telemetry.Metrics.Counters.UserLogout
Counter name: *user_logout*

User logout. Note that this is only raised on explicit user logout, not if the session times out. The number of logouts
will typically be lower than the number of logins.

|Tag|Description|
|---|---|
|idp | The idp (ASP.NET scheme name) logging out from |
