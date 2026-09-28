---
title: "Error"
description: "Documentation for implementing the error page in IdentityServer, covering authorize endpoint error handling and which errors are returned to the client versus shown on the error page."
date: 2020-09-10T08:22:12+02:00
sidebar:
  order: 3
redirect_from:
  - /identityserver/v5/ui/error/
  - /identityserver/v6/ui/error/
  - /identityserver/v7/ui/error/
---

The error page is used to display to the end user that an error has occurred during a request to
the [authorize endpoint](/identityserver/reference/v8/endpoints/authorize.md).

When an error occurs at the authorize endpoint that cannot be safely returned to the client, IdentityServer will
redirect the user to a configurable `ErrorUrl`. Some errors are sent back to the client application instead, and never
reach your IdentityServer error page. See [Errors Returned To The Client](#errors-returned-to-the-client) for which errors those are.

```csharp
// Program.cs
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.ErrorUrl = "/path/to/error";
})
```

The default `ErrorUrl` is "/home/error". The quickstart UI includes a basic
implementation of an error page at that route.

Errors are commonly due to misconfiguration, and there's not much an end user can do about that.
But this allows the user to understand that something went wrong and that they are not in the middle of a successful
workflow.

## Errors Returned To The Client

Not every error encountered at the [authorize endpoint](/identityserver/reference/v8/endpoints/authorize.md) results
in the error page being shown. A fixed set of error codes are considered safe to return directly to the client, because
they are meaningful to a well-behaved client and are not indicative of a broken or malicious request. For these codes,
IdentityServer sends the `error`, `error_description`, and `state` parameters back to the client's `redirect_uri`,
delivered according to the requested response mode (query, fragment, or form post). The error page is **not** shown
for these codes, so the client application is responsible for handling them. For example, a client that sends
`prompt=none` must be prepared to handle a `login_required` error in its callback rather than the user seeing an error
page.

There is no option to reconfigure which codes are considered safe. The only related options are `UserInteraction.ErrorUrl`
and `UserInteraction.ErrorId`, described below.

| Error                               | Typical Cause                                                                                                                                                                                                                    | Sent To    |
|-------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| `login_required`                    | `prompt=none` was requested but the user would need to log in                                                                                                                                                                    | Client     |
| `consent_required`                  | `prompt=none` was requested but the user would need to consent                                                                                                                                                                   | Client     |
| `interaction_required`              | `prompt=none` was requested but some other interaction is required                                                                                                                                                               | Client     |
| `account_selection_required`        | Raised by your UI via `DenyAuthorizationAsync` on the [interaction service](/identityserver/reference/v8/services/interaction-service.md#iidentityserverinteractionservice-apis) with the corresponding `InteractionError` value | Client     |
| `access_denied`                     | The user denied consent, or required scopes weren't consented                                                                                                                                                                    | Client     |
| `temporarily_unavailable`           | Raised by your UI via `DenyAuthorizationAsync` with the corresponding `InteractionError` value                                                                                                                                   | Client     |
| `unmet_authentication_requirements` | Raised by your UI via `DenyAuthorizationAsync` with the corresponding `InteractionError` value; relates to the OAuth 2.0 Step-Up Authentication Challenge (RFC 9470)                                                             | Client     |
| `invalid_request`                   | Malformed or missing required parameters, e.g. a bad or missing `redirect_uri`                                                                                                                                                   | Error page |
| `unauthorized_client`               | The client is unknown or disabled                                                                                                                                                                                                | Error page |
| `unsupported_response_type`         | An invalid or unsupported `response_type`                                                                                                                                                                                        | Error page |
| `invalid_scope`                     | One or more requested scopes are invalid                                                                                                                                                                                         | Error page |
| `invalid_target`                    | An invalid resource indicator                                                                                                                                                                                                    | Error page |
| `invalid_request_uri`               | An invalid Pushed Authorization Request (PAR) request URI                                                                                                                                                                        | Error page |
| `invalid_request_object`            | An invalid JWT-Secured Authorization Request (JAR) request object                                                                                                                                                                | Error page |
| `request_uri_not_supported`         | A `request_uri` parameter was used but is not supported                                                                                                                                                                          | Error page |
| `server_error`                      | An unexpected server-side error                                                                                                                                                                                                  | Error page |
| Any other or custom error code      | An unrecognized or custom error returned by a custom [authorize interaction response generator](/identityserver/reference/v8/response-handling/authorize-interaction-response-generator.md)                                      | Error page |

Most codes routed to the error page stem from request validation failures: an unknown or disabled client, a bad
or missing `redirect_uri`, an invalid `response_type` or `response_mode`, invalid scopes or resource indicators, or an
invalid PAR/JAR request object. In these cases the request is not trustworthy enough to redirect back to, so
IdentityServer shows the error page instead. This prevents open redirects and avoids leaking error details to an
unverified `redirect_uri`.

The response mode does not affect this decision; it only affects how a safe error is delivered to the client.

See also the relevant specifications:

- [OpenID Connect Core 1.0, section 3.1.2.6 (Authentication Error Response)](https://openid.net/specs/openid-connect-core-1_0.html#AuthError)
- [RFC 6749, section 4.1.2.1 (Error Response)](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1)
- [RFC 9470 (OAuth 2.0 Step-Up Authentication Challenge Protocol)](https://datatracker.ietf.org/doc/html/rfc9470)

## Error Context

Details of the error are provided to the error page via a query string parameter. That parameter's name is configurable
using the `ErrorId` option.

```csharp
// Program.cs
builder.Services.AddIdentityServer(opt => {
    opt.UserInteraction.ErrorId = "ErrorQueryStringParamName";
})
```

By default, the `ErrorId` is the string "errorId".

The [interaction service](/identityserver/reference/v8/services/interaction-service.md#iidentityserverinteractionservice-apis)
provides a `GetErrorContextAsync` API that will load error details for an `ErrorId`.
The returned [ErrorMessage](/identityserver/reference/v8/services/interaction-service.md#errormessage) object contains these
details.
