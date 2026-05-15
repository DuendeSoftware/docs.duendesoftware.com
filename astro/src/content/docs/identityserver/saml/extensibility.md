---
title: "SAML Extensibility"
description: Extensibility interfaces for customizing SAML 2.0 Identity Provider behavior, including NameID generation, SSO response generation, metadata, AuthnRequest validation, interaction, logout, and sign-in state storage.
date: 2026-05-15
sidebar:
  label: Extensibility
  order: 40
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

IdentityServer's SAML 2.0 Identity Provider feature exposes several extensibility interfaces that
you can implement to customize SAML behavior. All interfaces are registered in the DI container
and can be replaced with custom implementations.

---

## SAML Authentication Context

When IdentityServer processes a SAML `AuthnRequest`, it stores the SAML-specific request details
alongside the standard authorization context. Your login UI can access this information by calling
`GetAuthenticationContextAsync` on `IIdentityServerInteractionService` and pattern-matching the
result to `SamlAuthenticationContext`.

This is not required for standard login flows. Your existing login pages work with SAML
automatically because IdentityServer redirects to your login page with a `returnUrl` regardless of
protocol. You only need this when your login UI needs to behave differently based on SAML-specific
request details, such as enforcing MFA when the SP requests a specific `AuthnContext` class.

```csharp
// LoginModel.cshtml.cs
var context = await _interaction.GetAuthenticationContextAsync(returnUrl);

if (context is SamlAuthenticationContext samlContext)
{
    var sp = samlContext.ServiceProvider;
    var requestedAuthnContext = samlContext.RequestedAuthnContext;
    // Adjust authentication flow based on SP requirements
}
```

`SamlAuthenticationContext` exposes the following properties:

* **`ServiceProvider`** (`SamlServiceProvider`): The SP that initiated the request. Use this to
  display SP-specific branding or to apply SP-specific authentication policies.
* **`IdP`** (`string?`): The IdP entity ID from the `Scoping` element, if the SP specified one.
* **`LoginHint`** (`string?`): A login hint derived from the `NameID` in the `AuthnRequest`, if
  present.
* **`Tenant`** (`string?`): A tenant identifier extracted from `RequestedAuthnContext`, if present.
* **`PromptModes`** (`IEnumerable<string>`): Derived from `ForceAuthn` and `IsPassive` flags in
  the `AuthnRequest`.
* **`RelayState`** (`string?`): The relay state parameter from the `AuthnRequest`.
* **`IsIdpInitiated`** (`bool`): Whether this is an IdP-initiated SSO flow.
* **`RequestedAuthnContext`** (`RequestedAuthnContext?`): The authentication context requirements
  from the SP, if specified.

If the SP specified a `RequestedAuthnContext`, you can report back whether the user's
authentication met those requirements by calling `StoreRequestedAuthnContextResultAsync` on the
context object:

```csharp
// LoginModel.cshtml.cs
// ... after authenticating the user
if (context is SamlAuthenticationContext samlContext)
{
    await samlContext.StoreRequestedAuthnContextResultAsync(
        requestedAuthnContextRequirementsWereMet: true);
}
```

---

## ISaml2SsoInteractionResponseGenerator

`ISaml2SsoInteractionResponseGenerator` determines what interaction (login or error) is required
during a SAML sign-in flow. After an `AuthnRequest` is received and validated, IdentityServer
calls this interface to decide whether the user needs to be redirected to the login page or
whether the flow can proceed directly to assertion generation.

The default implementation handles standard login flows. Override it when you need custom step-up
authentication logic or any other non-standard interaction decision.

```csharp
// ISaml2SsoInteractionResponseGenerator.cs
public interface ISaml2SsoInteractionResponseGenerator
{
    Task<Saml2InteractionResponse> ProcessInteractionAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct = default);
}
```

### When to Use

Override this interface to customize the interaction flow for SAML sign-in requests, for example
to implement custom step-up authentication logic.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2SsoInteractionResponseGenerator, MySamlSsoInteractionGenerator>();
```

---

## ISamlLogoutNotificationService

`ISamlLogoutNotificationService` builds the set of front-channel logout notifications that
IdentityServer sends to SAML Service Providers when a user logs out. When a logout is initiated,
IdentityServer calls this service to determine which SPs should be notified and what messages to
send them.

The default implementation is `Saml2LogoutNotificationService`, which sends a SAML `LogoutRequest`
to each SP that has a configured `SingleLogoutServiceUrl`. Override it to customize which SPs
receive notifications or to modify the logout messages.

```csharp
// ISamlLogoutNotificationService.cs
public interface ISamlLogoutNotificationService
{
    Task<IReadOnlyCollection<OutboundSaml2Message>> GetSamlFrontChannelLogoutsAsync(
        LogoutNotificationContext context,
        CancellationToken ct);
}
```

### When to Use

Override this interface to customize which Service Providers receive logout notifications, or to
modify the logout messages sent.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlLogoutNotificationService, MySamlLogoutNotificationService>();
```

---

## ILogoutRequestValidator

`ILogoutRequestValidator` validates incoming SAML `LogoutRequest` messages from Service Providers.
It is called early in the SLO pipeline, before IdentityServer begins notifying other SPs.
Validation ensures the request is well-formed, the SP is registered, and the signature is valid.

The default implementation enforces signature requirements and checks SP registration. Override
this interface to add custom business rules on top of the default validation.

```csharp
// ILogoutRequestValidator.cs
public interface ILogoutRequestValidator
{
    Task<LogoutRequestValidationResult> ValidateAsync(
        ValidatedLogoutRequest request,
        CancellationToken ct);
}
```

### When to Use

Override `ILogoutRequestValidator` when you need to enforce custom rules on incoming
`LogoutRequest` messages, such as restricting which SPs can initiate SLO or applying additional
signature checks.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ILogoutRequestValidator, MyLogoutRequestValidator>();
```

---

## ISaml2SloResponseGenerator

`ISaml2SloResponseGenerator` generates the final SAML `LogoutResponse` sent back to the SP that
initiated the SLO flow. It is called after IdentityServer has notified all other SPs and collected
their responses.

The default implementation generates a success response when all SPs responded successfully, and a
partial logout response when some SPs did not respond or returned errors. Override this interface
to customize the response status or add custom response elements.

```csharp
// ISaml2SloResponseGenerator.cs
public interface ISaml2SloResponseGenerator
{
    Task<Saml2FrontChannelResult> CreateSuccessResponse(
        ValidatedLogoutRequest request,
        CancellationToken ct);

    Task<Saml2FrontChannelResult> CreatePartialLogoutResponse(
        ValidatedLogoutRequest request,
        CancellationToken ct);
}
```

### When to Use

Override `ISaml2SloResponseGenerator` when you need to customize the final `LogoutResponse` sent
to the initiating SP, for example to include custom status details or to change how partial logout
is reported.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2SloResponseGenerator, MySloResponseGenerator>();
```

---

## ISamlLogoutSessionStore

`ISamlLogoutSessionStore` persists logout session state during the SLO flow. When IdentityServer
initiates SLO, it creates a logout session that tracks which SPs are expected to respond and
records their responses as they arrive. This state must survive across multiple HTTP requests (one
per SP notification).

The default implementation stores state in memory, which is suitable for development and
single-server deployments. For production deployments with multiple servers, implement a custom
store backed by a distributed cache or database.

```csharp
// ISamlLogoutSessionStore.cs
public interface ISamlLogoutSessionStore
{
    Task StoreAsync(SamlLogoutSession session, CancellationToken ct);
    Task<SamlLogoutSession?> GetByLogoutIdAsync(string logoutId, CancellationToken ct);
    Task<bool> TryRecordResponseAsync(string requestId, string issuer, bool success, CancellationToken ct);
    Task RemoveAsync(string logoutId, CancellationToken ct);
}
```

* `StoreAsync`: stores a new logout session.
* `GetByLogoutIdAsync`: retrieves a logout session by its logout ID; returns `null` if not found
  or expired.
* `TryRecordResponseAsync`: records a `LogoutResponse` for a previously stored request, looked up
  by `InResponseTo` (the request ID). Returns `true` if the response was recorded, `false` if the
  request ID was not found or the issuer did not match.
* `RemoveAsync`: removes a logout session. Idempotent; does not throw if the session does not
  exist.

### When to Use

Override `ISamlLogoutSessionStore` when:

* You are running multiple server instances and need logout session state to be shared across them.
* You want to store logout session state in a specific distributed cache (Redis, etc.) or database.
* You need custom TTL or cleanup behavior for in-flight SLO sessions.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlLogoutSessionStore, MyDistributedSamlLogoutSessionStore>();
```

---

## ISaml2FrontChannelLogoutRequestBuilder

`ISaml2FrontChannelLogoutRequestBuilder` builds the outbound SAML `LogoutRequest` messages that
IdentityServer sends to each SP during the SLO flow. It is called once per SP that needs to be
notified, by `Saml2LogoutNotificationService`.

The default implementation constructs a standards-compliant `LogoutRequest` including the user's
`NameID` and session index. Override this interface to customize the logout request structure, for
example to add custom extensions or to change how the `NameID` is derived.

```csharp
// ISaml2FrontChannelLogoutRequestBuilder.cs
public interface ISaml2FrontChannelLogoutRequestBuilder
{
    Task<OutboundSaml2Message> BuildLogoutRequestAsync(
        SamlServiceProvider serviceProvider,
        string nameId,
        string? nameIdFormat,
        string sessionIndex,
        string issuer,
        CancellationToken ct);
}
```

### When to Use

Override `ISaml2FrontChannelLogoutRequestBuilder` when you need to customize the `LogoutRequest`
messages sent to SPs during SLO, for example to include SP-specific extensions or to change the
`NameID` format used in logout requests.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2FrontChannelLogoutRequestBuilder, MyLogoutRequestBuilder>();
```

---

## ISamlResourceResolver

`ISamlResourceResolver` resolves the claim types that a SAML Service Provider is allowed to
receive, based on its `AllowedScopes` and `RequestedClaimTypes` configuration. It is used during
assertion generation to determine which claims are available for inclusion in the assertion. Note
that `AllowedScopes` must contain only identity resource names; API resource scopes are not
supported for SAML service providers.

The default implementation (`DefaultSamlResourceResolver`) resolves claim types from the
configured identity resource store based on the SP's `AllowedScopes`. Override this interface if
you need custom resource resolution logic, for example to apply dynamic scope filtering or to load
resources from a non-standard source.

```csharp
// ISamlResourceResolver.cs
public interface ISamlResourceResolver
{
    Task<SamlResourceResolutionResult> ResolveRequestedClaimTypesAsync(
        SamlServiceProvider sp,
        CancellationToken ct);
}
```

`SamlResourceResolutionResult` has a `Succeeded` property, a `ClaimTypes` list (populated on
success), and an `Error` string (populated on failure).

### When to Use

Override `ISamlResourceResolver` when you need custom logic to determine which claim types are
available for a given SP, beyond what the default scope-based resolution provides.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlResourceResolver, MyResourceResolver>();
```

---

## ISamlNameIdGenerator

`ISamlNameIdGenerator` is responsible for generating the SAML `NameID` value included in
assertions sent to Service Providers. The `NameID` identifies the subject of the assertion
(typically the authenticated user) in a format the SP understands. It is called during assertion
generation, after the user has authenticated and the requested `NameID` format has been resolved.

The default implementation handles the most common formats: email address and unspecified.
Register a custom implementation to support additional `NameID` formats or to derive the `NameID`
value from non-standard claims.

```csharp
// ISamlNameIdGenerator.cs
public interface ISamlNameIdGenerator
{
    Task<NameIdGenerationResult> GenerateAsync(NameIdGenerationContext context, CancellationToken ct);
}

public sealed class NameIdGenerationContext
{
    public required ClaimsPrincipal Subject { get; init; }
    public required SamlServiceProvider ServiceProvider { get; init; }
    public required string ResolvedFormat { get; init; }
    public string? SPNameQualifier { get; init; }
}

public sealed class NameIdGenerationResult
{
    public NameId? NameId { get; private init; }
    public SamlError? Error { get; private init; }
    public bool IsError => Error is not null;
    public static NameIdGenerationResult Success(NameId nameId) => ...;
    public static NameIdGenerationResult Failure(string statusCode, string subStatusCode, string message) => ...;
}
```

### When to Use

Override `ISamlNameIdGenerator` when:

* You need to support a custom `NameID` format not handled by the default implementation.
* The `NameID` value must be derived from a non-standard claim or computed from multiple claims.
* You need SP-specific `NameID` generation logic based on `context.ServiceProvider`.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlNameIdGenerator, MyNameIdGenerator>();
```

### Example

```csharp
// MyNameIdGenerator.cs
public class MyNameIdGenerator : ISamlNameIdGenerator
{
    public Task<NameIdGenerationResult> GenerateAsync(
        NameIdGenerationContext context,
        CancellationToken ct)
    {
        // Example: use a custom "employee_id" claim as the NameID value
        var employeeId = context.Subject.FindFirst("employee_id")?.Value;
        if (employeeId is null)
            return Task.FromResult(NameIdGenerationResult.Failure(
                StatusCodes.Responder, StatusCodes.UnknownPrincipal,
                "Employee ID claim not found."));

        var nameId = new NameId(employeeId, context.ResolvedFormat);
        return Task.FromResult(NameIdGenerationResult.Success(nameId));
    }
}
```

---

## IIdpInitiatedSsoService

`IIdpInitiatedSsoService` enables IdP-initiated SSO, a flow where the Identity Provider sends a
SAML assertion to a Service Provider without first receiving an `AuthnRequest`. This is commonly
used in application portal pages (for example, a "My Apps" dashboard) where the user is already
authenticated and clicks a tile to launch an SP application.

The built-in endpoint `/saml/idp-initiated?spEntityId={entityId}` uses this service internally.
You can also inject `IIdpInitiatedSsoService` directly into your own Razor Pages or controllers
to generate and send the SAML response programmatically. Because this flow bypasses the normal
SP-initiated request, the caller is responsible for anti-forgery protection (for example, ensuring
the request originates from a legitimate authenticated session).

```csharp
// IIdpInitiatedSsoService.cs
public interface IIdpInitiatedSsoService
{
    Task<IdpInitiatedSsoResult> CreateResponseAsync(
        HttpContext httpContext,
        string spEntityId,
        string? relayState,
        CancellationToken ct);

    Task<IdpInitiatedSsoResult> CreateResponseAsync(
        HttpContext httpContext,
        string spEntityId,
        CancellationToken ct);
}
```

### When to Use

Use `IIdpInitiatedSsoService` when:

* You are building a portal page where authenticated users can launch SP applications with a single
  click, without the SP initiating the flow.
* You need to pass a `relayState` value to the SP (for example, a deep-link URL within the SP
  application).
* You want to trigger IdP-initiated SSO from custom application code rather than the built-in
  endpoint.

### Registration

`IIdpInitiatedSsoService` is registered by the SAML plugin and does not need to be replaced.
Inject it directly into your Razor Page or controller:

```csharp
// MyAppsPage.cshtml.cs
public class MyAppsPageModel : PageModel
{
    private readonly IIdpInitiatedSsoService _ssoService;

    public MyAppsPageModel(IIdpInitiatedSsoService ssoService)
        => _ssoService = ssoService;

    public async Task<IActionResult> OnPostLaunchAsync(string spEntityId)
    {
        var result = await _ssoService.CreateResponseAsync(HttpContext, spEntityId, ct: HttpContext.RequestAborted);
        // Handle result (e.g., write the auto-submit form to the response)
        return result.ToActionResult();
    }
}
```

---

## ISaml2SsoResponseGenerator

`ISaml2SsoResponseGenerator` generates the SAML `<Response>` element sent back to the Service
Provider after a successful (or failed) authentication. It is called at the end of the sign-in
pipeline, after interaction is complete and the user's identity has been established. The response
includes the SAML assertion with the subject, attributes, and conditions the SP expects.

The default implementation produces a standards-compliant signed response. Override this interface
when you need full control over the SAML response structure, for example to add custom attributes,
change signing behavior, or embed additional assertion elements required by a specific SP or
federation.

```csharp
// ISaml2SsoResponseGenerator.cs
public interface ISaml2SsoResponseGenerator
{
    Task<Saml2FrontChannelResult> CreateResponse(
        ValidatedAuthnRequest validatedAuthnRequest,
        CancellationToken ct);

    Task<Saml2FrontChannelResult> CreateErrorResponse(
        ValidatedAuthnRequest validatedAuthnRequest,
        Saml2InteractionResponse interactionResponse,
        CancellationToken ct);
}
```

### When to Use

Override `ISaml2SsoResponseGenerator` when:

* You need to add custom SAML attributes or assertion elements not supported by the default
  implementation.
* You need to change how the response or assertion is signed or encrypted.
* You need SP-specific response customization based on `validatedAuthnRequest.ServiceProvider`.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2SsoResponseGenerator, MySsoResponseGenerator>();
```

---

## ISaml2MetadataResponseGenerator

`ISaml2MetadataResponseGenerator` generates the IdP metadata document served at the
`/saml/metadata` endpoint. SAML metadata describes the IdP's capabilities, endpoints, and signing
keys to Service Providers and federation operators. SPs typically fetch this document during
initial configuration to establish trust.

The default implementation produces a standards-compliant metadata document from the configured
`SamlOptions` and signing keys. Override this interface to add custom metadata elements such as
organization information, contact details, additional key descriptors, or federation-specific
extensions required by specific SPs or federation operators.

```csharp
// ISaml2MetadataResponseGenerator.cs
public interface ISaml2MetadataResponseGenerator
{
    Task<Saml2MetadataResult> GenerateMetadataAsync(
        string issuer,
        IEnumerable<X509Certificate2> signingKeys,
        SamlOptions options,
        string baseUrl,
        CancellationToken ct);
}
```

### When to Use

Override `ISaml2MetadataResponseGenerator` when:

* You need to include organization or contact information in the metadata document.
* A federation operator or SP requires custom metadata extensions.
* You need to advertise additional key descriptors or endpoint bindings.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2MetadataResponseGenerator, MyMetadataGenerator>();
```

---

## IAuthnRequestValidator

`IAuthnRequestValidator` validates incoming SAML `AuthnRequest` messages from Service Providers.
It is called early in the sign-in pipeline, before any interaction begins. Validation ensures the
request is well-formed, the SP is registered, the signature is valid, and the requested ACS URL
is permitted.

The default implementation enforces signature requirements, checks SP registration, and validates
ACS URLs. Override this interface to add custom business rules on top of the default validation,
for example restricting which SPs can request certain `AuthnContext` classes, enforcing IP-based
access controls, or applying time-of-day restrictions.

```csharp
// IAuthnRequestValidator.cs
public interface IAuthnRequestValidator
{
    Task<AuthnRequestValidationResult> ValidateAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct);
}
```

### When to Use

Override `IAuthnRequestValidator` when:

* You need to enforce custom business rules on incoming `AuthnRequest` messages beyond what the
  default implementation checks.
* You want to restrict which SPs can request specific `AuthnContext` classes.
* You need to apply IP-based, time-based, or other contextual access controls at the request
  validation stage.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<IAuthnRequestValidator, MyAuthnRequestValidator>();
```

### Example

```csharp
// MyAuthnRequestValidator.cs
public class MyAuthnRequestValidator : IAuthnRequestValidator
{
    private readonly IAuthnRequestValidator _default;

    public MyAuthnRequestValidator(IAuthnRequestValidator defaultValidator)
        => _default = defaultValidator;

    public async Task<AuthnRequestValidationResult> ValidateAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct)
    {
        // Run default validation first
        var result = await _default.ValidateAsync(request, ct);
        if (!result.IsError)
        {
            // Add custom rule: only allow SP "https://partner.example.com" during business hours
            if (request.ServiceProvider.EntityId == "https://partner.example.com"
                && DateTime.UtcNow.Hour is < 8 or > 18)
            {
                return AuthnRequestValidationResult.Failure("Access outside business hours is not permitted.");
            }
        }
        return result;
    }
}
```

---

## ISamlSigninStateStore

`ISamlSigninStateStore` persists SAML sign-in request state between the initial SSO request and
the callback after the user has authenticated. Because SAML sign-in involves a redirect to the
login UI and back, the original request context (SP entity ID, ACS URL, relay state, etc.) must
be stored somewhere durable for the duration of the interaction.

The default implementation stores state in memory (suitable for development and testing). For
production deployments, use the Entity Framework Core implementation that ships with
IdentityServer, or implement a custom store backed by your own persistence layer.

State is retained after a successful callback to allow browser retries (for example, if the user
navigates back). TTL-based expiry is the primary cleanup mechanism; `RemoveSigninRequestStateAsync`
is called on explicit cleanup paths.

```csharp
// ISamlSigninStateStore.cs
public interface ISamlSigninStateStore
{
    Task<StateId> StoreSigninRequestStateAsync(SamlAuthenticationState state, CancellationToken ct = default);
    Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(StateId stateId, CancellationToken ct = default);
    Task RemoveSigninRequestStateAsync(StateId stateId, CancellationToken ct = default);
}
```

### When to Use

Override `ISamlSigninStateStore` when:

* You need a custom persistence mechanism beyond the built-in in-memory or EF Core implementations.
* You want to store sign-in state in a specific distributed cache (Redis, etc.) for your
  infrastructure.
* You need custom TTL or cleanup behavior for in-flight SSO requests.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlSigninStateStore, MyDistributedSamlSigninStateStore>();
```

### Example

```csharp
// MyDistributedSamlSigninStateStore.cs
public class MyDistributedSamlSigninStateStore : ISamlSigninStateStore
{
    private readonly IDistributedCache _cache;

    public MyDistributedSamlSigninStateStore(IDistributedCache cache)
        => _cache = cache;

    public async Task<StateId> StoreSigninRequestStateAsync(
        SamlAuthenticationState state,
        CancellationToken ct = default)
    {
        var stateId = StateId.New();
        var json = JsonSerializer.Serialize(state);
        await _cache.SetStringAsync(stateId.Value, json,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15) },
            ct);
        return stateId;
    }

    public async Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(
        StateId stateId,
        CancellationToken ct = default)
    {
        var json = await _cache.GetStringAsync(stateId.Value, ct);
        return json is null ? null : JsonSerializer.Deserialize<SamlAuthenticationState>(json);
    }

    public Task RemoveSigninRequestStateAsync(StateId stateId, CancellationToken ct = default)
        => _cache.RemoveAsync(stateId.Value, ct);
}
```
