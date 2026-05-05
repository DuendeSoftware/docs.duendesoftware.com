---
title: "SAML Extensibility"
description: Extensibility interfaces for customizing SAML 2.0 Identity Provider behavior, including NameID generation, SSO response generation, metadata, AuthnRequest validation, interaction, logout, and sign-in state storage.
date: 2026-03-02
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

## ISamlInteractionService

`ISamlInteractionService` provides SAML-specific request context to your login UI pages. It is **not required for standard login flows**. Your existing login pages work with SAML automatically because IdentityServer translates SAML `AuthnRequest` messages into the protocol-agnostic `IAuthenticationContext` model that your pages already use.

Inject `ISamlInteractionService` only when your login UI needs access to SAML-specific details that are not available through the standard `IAuthenticationContext` interface, such as the SP's `RequestedAuthnContext` requirements or the `RelayState` value.

```csharp
public interface ISamlInteractionService
{
    Task<SamlAuthenticationRequest?> GetAuthenticationRequestContextAsync(
        CancellationToken ct = default);

    Task StoreRequestedAuthnContextResultAsync(
        bool requestedAuthnContextRequirementsWereMet,
        CancellationToken ct = default);
}
```

### When to Use

Inject `ISamlInteractionService` into your login UI pages when you need to:

* Display SAML-specific information about the requesting SP (beyond what `IAuthenticationContext.Application` provides)
* Check the SP's `RequestedAuthnContext` requirements and adjust your authentication flow accordingly (e.g., enforce MFA when the SP requests a specific `AuthnContext` class)
* Report back to IdentityServer whether the user's authentication met the SP's `RequestedAuthnContext` requirements via `StoreRequestedAuthnContextResultAsync`

For standard login, consent, and logout flows, no SAML-specific code is needed in your pages.

---

## ISamlSigninInteractionResponseGenerator

`ISamlSigninInteractionResponseGenerator` determines what interaction (login, consent, or error)
is required during a SAML sign-in flow. After an `AuthnRequest` is received and validated,
IdentityServer calls this interface to decide whether the user needs to be redirected to the login
page, a consent screen, or whether the flow can proceed directly to assertion generation.

The default implementation (`DefaultSamlSigninInteractionResponseGenerator`) handles standard
login and consent flows. Override it when you need custom step-up authentication logic, per-SP
consent requirements, or any other non-standard interaction decision.

```csharp
public interface ISamlSigninInteractionResponseGenerator
{
    Task<SamlInteractionResponse> ProcessInteractionAsync(
        SamlServiceProvider sp,
        AuthNRequest request,
        CancellationToken ct = default);
}
```

### When to Use

Override this interface to customize the interaction flow for SAML sign-in requests. For example,
to implement custom step-up authentication logic, or to enforce per-SP consent requirements.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlSigninInteractionResponseGenerator, MySamlSigninInteractionGenerator>();
```

---

## ISamlLogoutNotificationService

`ISamlLogoutNotificationService` builds the set of front-channel logout notifications that
IdentityServer sends to SAML Service Providers when a user logs out. When a logout is initiated,
IdentityServer calls this service to determine which SPs should be notified and what messages to
send them.

The default implementation sends a SAML `LogoutRequest` to each SP that has a configured
`SingleLogoutServiceUrl`. Override it to customize which SPs receive notifications or to modify
the logout messages.

```csharp
public interface ISamlLogoutNotificationService
{
    Task<IEnumerable<ISamlFrontChannelLogout>> GetSamlFrontChannelLogoutsAsync(
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

## ISamlFrontChannelLogout

`ISamlFrontChannelLogout` represents a single front-channel logout notification to be sent to a
Service Provider. Instances of this interface are produced by `ISamlLogoutNotificationService` and
consumed by the SAML logout pipeline to deliver `LogoutRequest` messages to each SP. You typically
do not need to implement this interface directly. It is a data carrier returned by your custom
`ISamlLogoutNotificationService` implementation if you choose to override that service.

```csharp
public interface ISamlFrontChannelLogout
{
    SamlBinding SamlBinding { get; }
    Uri Destination { get; }
    string EncodedContent { get; }
    string? RelayState { get; }
}
```

Each instance represents a SAML `LogoutRequest` (or response) message encoded for delivery to a
specific SP via the specified binding and destination URL.

---

## ISamlNameIdGenerator

`ISamlNameIdGenerator` is responsible for generating the SAML `NameID` value included in
assertions sent to Service Providers. The `NameID` identifies the subject of the assertion (typically
the authenticated user) in a format the SP understands. It is called during assertion generation,
after the user has authenticated and the requested `NameID` format has been resolved.

The default implementation handles the most common formats: email address, persistent, and
unspecified. Register a custom implementation to support additional `NameID` formats or to derive
the `NameID` value from non-standard claims.

```csharp
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
used in application portal pages (e.g., a "My Apps" dashboard) where the user is already
authenticated and clicks a tile to launch an SP application.

The built-in endpoint `/saml/idp-initiated?spEntityId={entityId}` uses this service internally.
You can also inject `IIdpInitiatedSsoService` directly into your own Razor Pages or controllers
to generate and send the SAML response programmatically. Because this flow bypasses the normal
SP-initiated request, **the caller is responsible for anti-forgery protection** (e.g., ensuring
the request originates from a legitimate authenticated session).

```csharp
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
* You need to pass a `relayState` value to the SP (e.g., a deep-link URL within the SP application).
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
when you need full control over the SAML response structure. For example, to add custom
attributes, change signing behavior, or embed additional assertion elements required by a specific
SP or federation.

```csharp
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
`Saml2Options` and signing keys. Override this interface to add custom metadata elements
such as organization information, contact details, additional key descriptors, or
federation-specific extensions required by specific SPs or federation operators.

```csharp
public interface ISaml2MetadataResponseGenerator
{
    Task<Saml2MetadataResult> GenerateMetadataAsync(
        string issuer,
        IEnumerable<X509Certificate2> signingKeys,
        Saml2Options options,
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
ACS URLs. Override this interface to add custom business rules on top of the default validation.
For example, restricting which SPs can request certain `AuthnContext` classes, enforcing IP-based
access controls, or applying time-of-day restrictions.

```csharp
public interface IAuthnRequestValidator
{
    Task<AuthnRequestValidationResult> ValidateAsync(
        ValidatedAuthnRequest request,
        CancellationToken ct);
}
```

### When to Use

Override `IAuthnRequestValidator` when:

* You need to enforce custom business rules on incoming `AuthnRequest` messages beyond what the default
  implementation checks.
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

The default implementation stores state in a browser cookie. Override this interface to store
state in a server-side store (distributed cache or database) instead. This is useful when the
sign-in state is too large for a cookie (even with chunking), when you want to avoid exposing
state data to the client, or when you need server-side auditability of in-flight SSO requests.

State is retained after a successful callback to allow browser retries (e.g., if the user
navigates back). TTL-based expiry is the primary cleanup mechanism; `RemoveSigninRequestStateAsync`
is called on explicit cleanup paths.

```csharp
public interface ISamlSigninStateStore
{
    Task<StateId> StoreSigninRequestStateAsync(SamlAuthenticationState state, CancellationToken ct = default);
    Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(StateId stateId, CancellationToken ct = default);
    Task RemoveSigninRequestStateAsync(StateId stateId, CancellationToken ct = default);
}
```

### When to Use

Override `ISamlSigninStateStore` when:

* The sign-in state exceeds cookie size limits (even with chunking) for your deployment.
* You prefer not to expose sign-in state to the client browser (security or compliance reasons).
* You want server-side visibility into in-flight SSO requests for auditing or operational monitoring.

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
