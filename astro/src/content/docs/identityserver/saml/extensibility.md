---
title: "SAML Extensibility"
description: Extensibility interfaces for customizing SAML 2.0 Identity Provider behavior, including NameID generation, SSO response generation, metadata, AuthnRequest validation, interaction, logout, and sign-in state storage.
date: 2026-05-25
sidebar:
  label: Extensibility
  order: 40
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0</span>

IdentityServer's SAML 2.0 Identity Provider feature exposes several extensibility interfaces that
you can implement to customize SAML behavior. All interfaces are registered in the service provider
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
* **`IdP`** (`string?`): The IdP entity ID from the `Scoping` element, populated only when the SP specified a single IdP in the `IDPList`. When multiple IdPs are listed, this property is `null`.
* **`LoginHint`** (`string?`): A login hint derived from the `NameID` in the `AuthnRequest`, if
  present.
* **`Tenant`** (`string?`): A tenant identifier extracted from `RequestedAuthnContext`, if present.
* **`PromptModes`** (`IEnumerable<string>`): Derived from `ForceAuthn` and `IsPassive` flags in
  the `AuthnRequest`.
* **`RelayState`** (`string?`): The relay state parameter from the `AuthnRequest`.
* **`IsIdpInitiated`** (`bool`): Whether this is an IdP-initiated SSO flow.
* **`RequestedAuthnContext`** (`RequestedAuthnContext?`): The authentication context requirements
  from the SP, if specified.
* **`StateId`** (`Guid`): The identifier for the stored sign-in state entry. You need this when
  calling `DenyAuthenticationAsync` to deny the authentication request (see
  [denying authentication](/identityserver/ui/login/context.md#denying-authentication)).

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

### Error Reporting

Instead of redirecting the user to the login page, you can return a SAML error response directly
to the SP by returning `Saml2InteractionResponse.Error(statusCode, subStatusCode)` from
`ProcessInteractionAsync`. This is useful when you want to reject the SSO request
programmatically. For example, when the SP is not permitted to request SSO at the current time
and you want the SP to receive a SAML error response rather than a login redirect.

`Saml2InteractionResponse` has three factory methods:

* `Login()` - redirect the user to the login page.
* `NoInteraction()` - proceed directly to assertion generation without interaction.
* `Error(statusCode, subStatusCode)` / `Error(statusCode, subStatusCode, message)` - return a
  SAML error response to the SP with the given status codes and an optional human-readable message.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2SsoInteractionResponseGenerator, CustomSamlSsoInteractionGenerator>();
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
    Task<SamlLogoutNotificationResult> GetSamlFrontChannelLogoutsAsync(
        LogoutNotificationContext context,
        CancellationToken ct);
}
```

The method returns a `SamlLogoutNotificationResult` record with two properties:

* `Messages` (`IReadOnlyCollection<SamlLogoutRequestContext>`): the successfully generated logout request contexts, one per SP to notify.
* `SkippedCount` (`int`): the number of SPs that could not be notified (for example, because they are disabled, have no SLO URL, use an unsupported binding, or request generation failed).

`SamlLogoutRequestContext` is a record with three properties:

* `Message` (`OutboundSaml2Message`): the outbound message ready to send to the SP.
* `RequestId` (`string`): the SAML ID attribute value from the `LogoutRequest`, used to correlate the SP's `LogoutResponse` via its `InResponseTo` attribute.
* `SpEntityId` (`string`): the entity ID of the destination SP.

### When to Use

Override this interface to customize which Service Providers receive logout notifications, or to
modify the logout messages sent.

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISamlLogoutNotificationService, CustomSamlLogoutNotificationService>();
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
builder.Services.AddScoped<ILogoutRequestValidator, CustomLogoutRequestValidator>();
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
builder.Services.AddScoped<ISaml2SloResponseGenerator, CustomSloResponseGenerator>();
```

---

## ISamlLogoutSessionStore

`ISamlLogoutSessionStore` persists logout session state during the SLO flow. When IdentityServer
initiates SLO, it creates a logout session that tracks which SPs are expected to respond and
records their responses as they arrive. This state must survive across multiple HTTP requests (one
per SP notification).

**Default (in-memory):** When you register SAML without an EF operational store, IdentityServer
uses an in-memory implementation. This is suitable for development and single-server deployments,
but state is lost on restart and is not shared across multiple server instances.

**EF Core (automatic):** When you call `AddOperationalStore()` on the IdentityServer builder,
IdentityServer automatically registers an EF Core-backed implementation. No additional configuration
is needed.

**Custom implementation:** You can register your own implementation using the `AddSamlLogoutSessionStore<T>()`extension 
method on the IdentityServer builder.

Expired logout sessions are removed automatically by `TokenCleanupService`. The lifetime of each
session is controlled by `LogoutSessionLifetime` in `SamlOptions` (see
[configuration](/identityserver/saml/configuration.md)).

If you implement `IOperationalStoreNotification`, the new `SamlLogoutSessionsRemovedAsync()`
callback is invoked each time `TokenCleanupService` removes a batch of expired logout sessions.
This lets you react to cleanup events, for example to update a secondary index or emit metrics.

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

`SamlLogoutSession` has a `SkippedSpCount` (`int`) property that records how many SPs could not
be notified during logout. This value is set from `SamlLogoutNotificationResult.SkippedCount`
when the session is created. When `SkippedSpCount` is greater than zero, the best achievable
logout outcome is `PartialLogout`, regardless of whether the remaining SPs respond successfully.

Each session also carries an `ExpiresAtUtc` (`DateTime`) property that controls when the session
becomes eligible for cleanup. Store implementations should treat entries past this time as expired.

The `ExpectedResponses` dictionary on `SamlLogoutSession` maps each outbound `LogoutRequest` ID
to an `ExpectedSpLogout` record. That record holds the SP's entity ID and, once the SP replies, a
`SamlSpLogoutResponse` with the outcome (`Success`) and the time the response was received
(`ReceivedUtc`).

### When to Use

Override `ISamlLogoutSessionStore` when:

* You are running multiple server instances and need logout session state to be shared across them
  without using the EF operational store.
* You want to store logout session state in a specific distributed cache (Redis, etc.) or database.
* You need custom TTL or cleanup behavior for in-flight SLO sessions.

### Registration

You can register your custom store at startup:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml()
    .AddSamlLogoutSessionStore<CustomDistributedSamlLogoutSessionStore>();
```

---

## ISaml2FrontChannelLogoutRequestBuilder

`ISaml2FrontChannelLogoutRequestBuilder` builds the outbound SAML `LogoutRequest` messages that
IdentityServer sends to each SP during the SLO flow. It is called once per SP that needs to be
notified, by `Saml2LogoutNotificationService`.

The default implementation constructs a standards-compliant `LogoutRequest` including the user's
`NameID` and session index. Override this interface to customize the logout request structure, for
example to add custom extensions or to change how the `NameID` is derived.

The method returns a `SamlLogoutRequestContext`, which wraps the outbound message together with the
request ID and SP entity ID, giving you the information needed to correlate the logout response back to the original
request when the SP replies.

```csharp
// ISaml2FrontChannelLogoutRequestBuilder.cs
public interface ISaml2FrontChannelLogoutRequestBuilder
{
    /// <returns>
    /// A <see cref="SamlLogoutRequestContext"/> that wraps the outbound message with the
    /// request ID and SP entity ID for response correlation.
    /// </returns>
    Task<SamlLogoutRequestContext> BuildLogoutRequestAsync(
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
builder.Services.AddScoped<ISaml2FrontChannelLogoutRequestBuilder, CustomLogoutRequestBuilder>();
```

---

## ISamlResourceResolver

`ISamlResourceResolver` resolves the claim types that a SAML Service Provider is allowed to
receive, based on its `AllowedScopes` and `RequestedClaimTypes` configuration. It is used during
assertion generation to determine which claims are available for inclusion in the assertion.

The resolution chain works as follows: `AllowedScopes` determines which identity resources (and their claim types)
are available. If `RequestedClaimTypes` is also configured, it narrows the resolved set to only those specific claim types.
Note that `AllowedScopes` must contain only identity resource names; API resource scopes are not supported for SAML service providers.

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
builder.Services.AddScoped<ISamlResourceResolver, CustomResourceResolver>();
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
builder.Services.AddScoped<ISamlNameIdGenerator, CustomNameIdGenerator>();
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

Inject `IIdpInitiatedSsoService` into your own Razor Pages or controllers
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
builder.Services.AddScoped<ISaml2SsoResponseGenerator, CustomSsoResponseGenerator>();
```

---

## ISamlSigningService

`ISamlSigningService` provides access to the certificate used to sign SAML messages and metadata.
IdentityServer calls this service when it needs to sign a SAML response or include the signing
certificate in the IdP metadata document.

```csharp
// ISamlSigningService.cs
public interface ISamlSigningService
{
    Task<X509Certificate2> GetSigningCertificateAsync(CancellationToken ct);
    Task<string> GetSigningCertificateBase64Async(CancellationToken ct);
}
```

* `GetSigningCertificateAsync` - returns the `X509Certificate2` with private key used to sign
  SAML messages. Throws `InvalidOperationException` if no signing credential is configured, if
  the credential is not an X.509 certificate or RSA key, or if the certificate has no private key.
* `GetSigningCertificateBase64Async` - returns the base64-encoded DER representation of the
  certificate, used when embedding the certificate in SAML metadata key descriptors.

The default implementation derives the certificate from IdentityServer's configured signing keys.
When the active signing key is an `X509SecurityKey`, it uses the certificate directly. When the
key is a raw `RsaSecurityKey` managed by automatic key management, it wraps the key in a
self-signed X.509 container automatically.

### When to Use

Override `ISamlSigningService` when:

* Your signing certificate is stored in an external system such as Azure Key Vault or a hardware
  security module (HSM) and cannot be loaded as a standard `X509SecurityKey`.
* You need to rotate the SAML signing certificate independently of the IdentityServer signing key
  configuration.
* You need to return a different certificate for SAML signing than the one used for OIDC token
  signing.

For most deployments the default implementation is sufficient. Only replace it if you have a
specific certificate selection or key management requirement that the default cannot satisfy.

### Registration

`ISamlSigningService` is registered with `TryAddScoped`, so register your implementation before
calling `AddSaml()` to replace the default:

```csharp
// Program.cs
builder.Services.AddScoped<ISamlSigningService, CustomSigningService>();
builder.Services.AddIdentityServer()
    .AddSaml();
```

---

## ISaml2MetadataResponseGenerator

`ISaml2MetadataResponseGenerator` generates the IdP metadata document served at the
`/Saml2` endpoint. SAML metadata describes the IdP's capabilities, endpoints, and signing
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
builder.Services.AddScoped<ISaml2MetadataResponseGenerator, CustomMetadataGenerator>();
```

---

## ISaml2IssuerNameService

`ISaml2IssuerNameService` resolves the SAML entity ID that IdentityServer uses as its IdP issuer.
The default implementation derives the entity ID from the OIDC issuer name combined with
`SamlOptions.EntityIdPath`. Override this interface when you need dynamic entity ID resolution,
for example in multi-tenant deployments where each tenant has a distinct SAML entity ID.

```csharp
// ISaml2IssuerNameService.cs
public interface ISaml2IssuerNameService
{
    Task<string> GetCurrentAsync(CancellationToken ct);
}
```

### When to Use

Override `ISaml2IssuerNameService` when:

* You run a multi-tenant deployment and each tenant needs a unique SAML entity ID.
* The entity ID must be resolved dynamically based on the incoming request (for example, from a
  custom domain or path).

### Registration

```csharp
// Program.cs
builder.Services.AddScoped<ISaml2IssuerNameService, CustomIssuerNameService>();
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
builder.Services.AddScoped<IAuthnRequestValidator, CustomAuthnRequestValidator>();
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

Several implementations are available:

* **In-memory** (default, added by `AddSaml()`): suitable for development and testing. State is lost on restart and is
  not shared across multiple server instances.
* **EF Core**: registered when you call `AddOperationalStore()` from
  `Duende.IdentityServer.EntityFramework`. Use this for production. The operational store
  registration replaces the in-memory fallback. No extra configuration is needed.
* **Custom**: register your own implementation for a specific persistence backend (Redis,
  DynamoDB, etc.) by adding it to the service collection before calling `AddSaml()`.

State is retained after a successful callback to allow browser retries (for example, if the user
navigates back). The `TokenCleanupService` automatically removes expired sign-in state entries
from the EF Core store during its scheduled cleanup runs. Each `SamlAuthenticationState` carries
an `ExpiresAtUtc` property that controls when the entry becomes eligible for removal. TTL-based
expiry is the primary cleanup mechanism; `RemoveSigninRequestStateAsync` is available for
scenarios that need immediate cleanup but is not called in the default flow.

If you implement `IOperationalStoreNotification`, the `SamlSigninStatesRemovedAsync()` callback
is invoked each time `TokenCleanupService` removes a batch of expired sign-in state entries. This
lets you react to cleanup events, for example to emit metrics or update external systems.

```csharp
// ISamlSigninStateStore.cs
public interface ISamlSigninStateStore
{
    Task<Guid> StoreSigninRequestStateAsync(SamlAuthenticationState state, CancellationToken ct = default);
    Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default);
    Task UpdateSigninRequestStateAsync(Guid stateId, SamlAuthenticationState state, CancellationToken ct = default);
    Task RemoveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default);
}
```

### When to Use

* **In-memory**: use during development or when you run a single server instance and do not need
  state to survive a restart.
* **EF Core**: use in production. Call `AddOperationalStore()` and the store is registered for
  you automatically.
* **Custom**: use when you need a specific persistence backend (Redis, DynamoDB, etc.) or custom
  TTL behavior. Register your implementation in the service provider at startup.

### Registration

To use the EF Core store, call `AddOperationalStore()` as part of your IdentityServer setup:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddOperationalStore(options => { /* ... */ })
    .AddSaml();
```

To register a custom implementation, add it to the service collection before `AddSaml()`:

```csharp
// Program.cs
builder.Services.AddScoped<ISamlSigninStateStore, CustomDistributedSamlSigninStateStore>();
builder.Services.AddIdentityServer()
    .AddSaml();
```

### Example

```csharp
// CustomDistributedSamlSigninStateStore.cs
public class CustomDistributedSamlSigninStateStore : ISamlSigninStateStore
{
    private readonly IDistributedCache _cache;

    public CustomDistributedSamlSigninStateStore(IDistributedCache cache)
        => _cache = cache;

    public async Task<Guid> StoreSigninRequestStateAsync(
        SamlAuthenticationState state,
        CancellationToken ct = default)
    {
        var stateId = Guid.NewGuid();
        var json = JsonSerializer.Serialize(state);
        var expiry = state.ExpiresAtUtc - DateTime.UtcNow;
        await _cache.SetStringAsync(stateId.ToString(), json,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiry },
            ct);
        return stateId;
    }

    public async Task<SamlAuthenticationState?> RetrieveSigninRequestStateAsync(
        Guid stateId,
        CancellationToken ct = default)
    {
        var json = await _cache.GetStringAsync(stateId.ToString(), ct);
        return json is null ? null : JsonSerializer.Deserialize<SamlAuthenticationState>(json);
    }

    public Task RemoveSigninRequestStateAsync(Guid stateId, CancellationToken ct = default)
        => _cache.RemoveAsync(stateId.ToString(), ct);

    public async Task UpdateSigninRequestStateAsync(
        Guid stateId,
        SamlAuthenticationState state,
        CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(state);
        var expiry = state.ExpiresAtUtc - DateTime.UtcNow;
        await _cache.SetStringAsync(stateId.ToString(), json,
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiry },
            ct);
    }
}
```

---

## ISamlServiceProviderConfigurationValidator

`ISamlServiceProviderConfigurationValidator` validates the configuration of a SAML Service Provider
at runtime, before IdentityServer processes requests from that SP. It is called by
`ValidatingSamlServiceProviderStore<T>`, which wraps your store automatically when you use
`AddSamlServiceProviderStore<T>()`.

```csharp
// ISamlServiceProviderConfigurationValidator.cs
public interface ISamlServiceProviderConfigurationValidator
{
    Task ValidateAsync(SamlServiceProviderConfigurationValidationContext context, CancellationToken ct);
}
```

The `SamlServiceProviderConfigurationValidationContext` passed to `ValidateAsync` exposes:

* `ServiceProvider` (`SamlServiceProvider`) - the SP being validated.
* `IsValid` (`bool`) - `true` by default; set to `false` when validation fails.
* `ErrorMessage` (`string?`) - the error message when invalid.
* `SetError(string message)` - sets `IsValid` to `false` and records the error message.

### When to Use

The built-in `DefaultSamlServiceProviderConfigurationValidator` already checks EntityId, ACS URLs
(which must use HTTP-POST), AllowedScopes, and lifetime values. It exposes virtual methods you can
override without replacing the whole validator:

* `ValidateEntityIdAsync` - validates that EntityId is not null or empty.
* `ValidateAssertionConsumerServiceUrlsAsync` - validates that ACS URLs exist and use HTTP-POST.
* `ValidateAllowedScopesAsync` - validates that at least one scope is configured.
* `ValidateLifetimesAsync` - validates `AssertionLifetime`, `ClockSkew`, and `RequestMaxAge`.

Override the validator when you need custom rules beyond those checks, for example to enforce naming
conventions on EntityIds, restrict which scopes are allowed, or apply business-specific rules.

### Registration

The default is registered with `TryAddScoped`, so register your implementation as a scoped service
before calling `AddSaml()`:

```csharp
// Program.cs
builder.Services.AddScoped<ISamlServiceProviderConfigurationValidator, CustomSamlServiceProviderConfigurationValidator>();
builder.Services.AddIdentityServer()
    .AddSaml();
```

### Example

The example below extends `DefaultSamlServiceProviderConfigurationValidator` by overriding
`ValidateAllowedScopesAsync` to require that every SP includes the `openid` scope.

```csharp
// CustomSamlServiceProviderConfigurationValidator.cs
public class CustomSamlServiceProviderConfigurationValidator : DefaultSamlServiceProviderConfigurationValidator
{
    protected override async Task ValidateAllowedScopesAsync(SamlServiceProviderConfigurationValidationContext context)
    {
        // Run the default scope check first
        await base.ValidateAllowedScopesAsync(context);
        if (!context.IsValid)
            return;

        // Custom rule: all SPs must include the "openid" scope
        if (!context.ServiceProvider.AllowedScopes.Contains("openid"))
        {
            context.SetError("AllowedScopes must include 'openid'.");
        }
    }
}
```
