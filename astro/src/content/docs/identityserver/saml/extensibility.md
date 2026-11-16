---
title: "SAML Extensibility"
description: "Extensibility interfaces for SAML 2.0 IdP in IdentityServer, covering NameID generation, SSO response creation, metadata, and AuthnRequest validation."
date: 2026-11-16
sidebar:
  label: Extensibility
  order: 32
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 2
---

IdentityServer's SAML 2.0 Identity Provider has several extensibility interfaces you can implement
to customize behavior. They're all registered in the DI container and can be replaced with your own
implementations.

This page explains when you need each extensibility point. For the full interfaces, members, and default behavior, see the
[SAML reference](/identityserver/reference/v8/saml/saml-registration.md).

---

## SAML Authentication Context

When IdentityServer processes a SAML `AuthnRequest`, it stores the SAML-specific request details
alongside the standard authorization context. Your login UI can access this information by calling
`GetAuthenticationContextAsync` on `IIdentityServerInteractionService` and pattern-matching the
result to `SamlAuthenticationContext`.

For the happy path (user authenticates successfully), your existing login pages work with SAML
without changes, because IdentityServer redirects to your login page with a `returnUrl` regardless of
protocol. For non-success paths though (such as the user clicking a cancel button), your login page
needs to call `DenyAuthenticationAsync` on `IIdentityServerInteractionService` so that IdentityServer
can return the appropriate SAML error response to the SP. See [Denying Authentication](/identityserver/ui/login/context.md#denying-authentication) for details.

You need `GetAuthenticationContextAsync` when your login UI needs to behave differently based on
SAML-specific request details, such as enforcing MFA when the SP requests a specific `AuthnContext` class.

```csharp
// LoginModel.cshtml.cs
var context = await _interaction.GetAuthenticationContextAsync(returnUrl, HttpContext.RequestAborted);

if (context is SamlAuthenticationContext samlContext)
{
    var sp = samlContext.ServiceProvider;
    var requestedAuthnContext = samlContext.RequestedAuthnContext;
    // Adjust authentication flow based on SP requirements
}
```

For the full list of properties, see [SAML Authentication Context](/identityserver/reference/v8/saml/saml-authentication-context.md).

---

## ISaml2SsoInteractionResponseGenerator

`ISaml2SsoInteractionResponseGenerator` determines what interaction (login or error) is needed
during a SAML sign-in flow. After an `AuthnRequest` is received and validated, IdentityServer
calls `ProcessInteractionAsync` to decide whether the user needs to be redirected to the login page or whether the flow can proceed directly to assertion generation.

The default implementation handles standard login flows. Override it when you need custom step-up
authentication logic or any other non-standard interaction decision. To enforce `RequestedAuthnContext`,
add the checks here or in your login UI, because the default implementation doesn't evaluate it.
The default class is sealed, so wrap it rather than inherit from it.

For the full interface and its members, see [SAML SSO Interaction Response Generator](/identityserver/reference/v8/saml/saml-sso-interaction-response-generator.md).

### When to Use

Override this interface to customize the interaction flow for SAML sign-in requests, for example
to implement custom step-up authentication logic.

### Error Reporting

Instead of redirecting the user to the login page, you can return a SAML error response directly
to the SP by returning `Saml2InteractionResponse.Error(statusCode, subStatusCode)` from
`ProcessInteractionAsync`. This is useful when you want to reject the SSO request
programmatically, for example when the SP isn't permitted to request SSO at the current time
and you want the SP to receive a SAML error response rather than a login redirect.

See the reference page for the `Saml2InteractionResponse` factory methods.

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
to each SP that has a configured `SingleLogoutServiceUrls` entry. Override it to customize which SPs
receive notifications or to modify the logout messages.

For the full interface and result types, see [SAML Logout Services](/identityserver/reference/v8/saml/saml-logout-services.md#isamllogoutnotificationservice).

### When to Use

Override this interface to customize which Service Providers receive logout notifications, or to
modify the logout messages sent.

### Registration

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();

// AddSaml() replaces any earlier registration, so register your implementation afterwards
builder.Services.AddScoped<ISamlLogoutNotificationService, CustomSamlLogoutNotificationService>();
```

---

## ILogoutRequestValidator

`ILogoutRequestValidator` validates incoming SAML `LogoutRequest` messages from Service Providers.
It is called early in the SLO pipeline, before IdentityServer begins notifying other SPs.

Override this interface to add custom business rules on top of the default validation.

For the full interface and result types, see [SAML Logout Services](/identityserver/reference/v8/saml/saml-logout-services.md#ilogoutrequestvalidator).

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
to customize the response.

For the full interface and default behavior, see [SAML Logout Services](/identityserver/reference/v8/saml/saml-logout-services.md#isaml2sloresponsegenerator).

### When to Use

Replace `ISaml2SloResponseGenerator` when you need to change how partial logout is reported to the SP that initiated the logout.

This interface controls **response generation**, not persistence. To customize how logout session state is stored, see [`ISamlLogoutSessionStore`](#isamllogoutsessionstore).

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

**In-memory (default):** An in-memory implementation is registered automatically. This works for
development and single-server deployments, but state is lost on restart and isn't shared across
instances.

**EF Core (recommended for production):** When you call `AddOperationalStore()` on the IdentityServer builder,
IdentityServer automatically registers an EF Core-backed implementation. No additional configuration
is needed.

**Custom implementation:** Register your own implementation in the DI container. Use this when you need a specific persistence backend such as
Redis or DynamoDB, or when you're not using the EF operational store.

Expired logout sessions are removed automatically by `TokenCleanupService`. The lifetime of each
session is controlled by `LogoutSessionLifetime` in `SamlOptions` (see
[configuration](/identityserver/saml/configuration.md)).

If you implement `IOperationalStoreNotification`, the new `SamlLogoutSessionsRemovedAsync()`
callback is invoked each time `TokenCleanupService` removes a batch of expired logout sessions.
This lets you react to cleanup events, for example to update a secondary index or emit metrics.

For the full interface and the `SamlLogoutSession` model, see [SAML Logout Session Store](/identityserver/reference/v8/saml/saml-logout-session-store.md).

### When to Use

Replace the default in-memory store when:

* You're running multiple server instances and need logout session state shared across them.
* You want to use a specific distributed cache (Redis, etc.) or database.
* You need custom TTL or cleanup behavior for in-flight SLO sessions.

### Registration

You can register your custom store at startup:

```csharp
// Program.cs
builder.Services.AddScoped<ISamlLogoutSessionStore, CustomDistributedSamlLogoutSessionStore>();
builder.Services.AddIdentityServer()
    .AddSaml();
```

---

## ISaml2FrontChannelLogoutRequestBuilder

`ISaml2FrontChannelLogoutRequestBuilder` builds the outbound SAML `LogoutRequest` messages that
IdentityServer sends to each SP during the SLO flow. It is called once per SP that needs to be
notified, by `Saml2LogoutNotificationService`.

The default implementation constructs a standards-compliant `LogoutRequest` including the user's
`NameID` and session index. Override this interface to customize the logout request structure, for
example to add custom extensions or to change how the `NameID` is derived.

For the full interface, see [SAML Logout Services](/identityserver/reference/v8/saml/saml-logout-services.md#isaml2frontchannellogoutrequestbuilder).

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
Note that `AllowedScopes` must contain only identity resource names. API resource scopes aren't supported for SAML service providers.

The default implementation (`DefaultSamlResourceResolver`) resolves claim types from the
configured identity resource store based on the SP's `AllowedScopes`. Override this interface if
you need custom resource resolution logic, for example to apply dynamic scope filtering or to load
resources from a non-standard source.

For the full interface and result type, see [SAML Resource Resolver](/identityserver/reference/v8/saml/saml-resource-resolver.md).

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

The default implementation handles email address and unspecified (using the `sub` values as the identifier). Register a custom implementation to support additional `NameID` formats or to derive the `NameID` value from non-standard claims.

See [SAML NameID Generator](/identityserver/reference/v8/saml/saml-nameid-generator.md) for the interface, context, and result types.

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
                SamlStatusCodes.Responder, SamlStatusCodes.UnknownPrincipal,
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
used in portal pages (for example, a "My Apps" dashboard) where the user is already
authenticated and clicks a tile to launch an SP application.

Inject `IIdpInitiatedSsoService` into your own Razor Pages or controllers
to generate and send the SAML response programmatically. Because this flow bypasses the normal
SP-initiated request, the caller is responsible for anti-forgery protection.

:::caution
Even with proper CSRF protection on the entry point of the flow, IdP-initiated sign-in is still exposed to CSRF on the SP. This is a problem with the SAML 2.0 standard: there is no way to implement IdP-initiated sign-in with proper CSRF protection.

A better approach is to mimic the third-party initiated login flow used by OIDC: create an endpoint on the SP that responds with a redirect to the IdP, including an `AuthnRequest`.
:::

For the full interface and result type, see [SAML IdP-Initiated SSO Service](/identityserver/reference/v8/saml/saml-idp-initiated-sso-service.md).

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
        var result = await _ssoService.CreateResponseAsync(HttpContext, spEntityId, HttpContext.RequestAborted);
        if (result.IsError)
        {
            return BadRequest();
        }

        // result.Response is an IResult that writes the auto-submit form
        await result.Response!.ExecuteAsync(HttpContext);
        return new EmptyResult();
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
embed additional assertion elements required by a specific SP or
federation.

For the full interface and the overridable members of the default implementation, see [SAML SSO Response Generator](/identityserver/reference/v8/saml/saml-sso-response-generator.md).

### When to Use

Override `ISaml2SsoResponseGenerator` when:

* You need to add custom SAML attributes or assertion elements not supported by the default
  implementation.
* You need to customize the response for a particular SP, available through `validatedAuthnRequest.Saml2Sp`.

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

For the full interface and its members, see [SAML Signing Service](/identityserver/reference/v8/saml/saml-signing-service.md).

The default implementation derives the certificate from IdentityServer's configured signing keys.
When the active signing key is an `X509SecurityKey`, it uses the certificate directly. When the
key is a raw `RsaSecurityKey` managed by automatic key management, it wraps the key in a
self-signed X.509 container automatically.

### When to Use

Override `ISamlSigningService` when:

* Your signing certificate is stored in an external system such as Azure Key Vault or a hardware
  security module (HSM).
* You need to rotate the SAML signing certificate independently of the IdentityServer signing key
  configuration.
* You need to return a different certificate for SAML signing than the one used for OIDC token
  signing.

For most deployments the default implementation is sufficient. Only replace it if you have a
specific certificate selection or key management requirement that the default cannot satisfy.

### Registration

The default is registered with `TryAdd`, so your own registration replaces it:

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
keys to Service Providers and federation operators. SPs capable of loading metadata load this
regularly to get up to date configuration, including the public keys required for signature 
validation.

The default implementation produces a standards-compliant metadata document from the configured
`SamlOptions` and signing keys.

For the full interface, see [SAML Metadata Services](/identityserver/reference/v8/saml/saml-metadata-services.md#isaml2metadataresponsegenerator).

### When to Use

Override `ISaml2MetadataResponseGenerator` when:

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
`SamlOptions.EntityIdPath`, unless `SamlOptions.EntityId` is set. Override this interface when you need dynamic entity ID resolution,
for example in multi-tenant deployments where each tenant has a distinct SAML entity ID.

For the full interface, see [SAML Metadata Services](/identityserver/reference/v8/saml/saml-metadata-services.md#isaml2issuernameservice).

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

For the full interface and result type, see [SAML AuthnRequest Validator](/identityserver/reference/v8/saml/saml-authn-request-validator.md).

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
            if (request.Saml2Sp?.EntityId == "https://partner.example.com"
                && DateTime.UtcNow.Hour is < 8 or > 18)
            {
                return AuthnRequestValidationResult.InValid(
                    request, SamlStatusCodes.RequestDenied, "Access outside business hours is not permitted.");
            }
        }
        return result;
    }
}
```

---

## ISamlSigninStateStore

`ISamlSigninStateStore` persists SAML sign-in request state between the initial SSO request and
the callback after the user authenticates. Because SAML sign-in involves a redirect to the
login UI and back, the original request context (SP entity ID, ACS URL, relay state, etc.) needs
to be stored somewhere durable for the duration of the interaction.

Several implementations are available:

* **In-memory** (default, added by `AddSaml()`): suitable for development and testing. State is lost on restart and is
  not shared across multiple server instances.
* **EF Core**: registered when you call `AddOperationalStore()` from
  `Duende.IdentityServer.EntityFramework`. Use this for production. The operational store
  registration replaces the in-memory fallback. No extra configuration is needed.
* **Custom**: register your own implementation for a specific persistence backend (Redis,
  DynamoDB, etc.) in the DI container.

The `TokenCleanupService` automatically removes expired sign-in state entries
from the EF Core store during its scheduled cleanup runs. Each `SamlAuthenticationState` carries
an `ExpiresAtUtc` property that controls when the entry becomes eligible for removal. TTL-based
expiry is the primary cleanup mechanism; `RemoveSigninRequestStateAsync` is available for
scenarios that need immediate cleanup but is not called in the default flow.

If you implement `IOperationalStoreNotification`, the `SamlSigninStatesRemovedAsync()` callback
is invoked each time `TokenCleanupService` removes a batch of expired sign-in state entries. This
lets you react to cleanup events, for example to emit metrics or update external systems.

For the full interface and the `SamlAuthenticationState` model, see [SAML Sign-in State Store](/identityserver/reference/v8/saml/saml-signin-state-store.md).

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

For guidance on implementing a custom store, see [SAML Sign-in State Store](/identityserver/reference/v8/saml/saml-signin-state-store.md).

---

## ISamlSigninStateSerializer

`ISamlSigninStateSerializer` converts `SamlAuthenticationState` to and from its stored representation. `AddOperationalStore()` registers the default implementation for the EF Core store. Replace it if you need a different serialization format.

For the full interface, see [SAML Sign-in State Store](/identityserver/reference/v8/saml/saml-signin-state-store.md#isamlsigninstateserializer).

### When to Use

Override `ISamlSigninStateSerializer` when:

- You want to use a different serialization format (e.g., binary, MessagePack) for performance or size reasons.

### Registration

```csharp
// Program.cs
builder.Services.AddSingleton<ISamlSigninStateSerializer, CustomSamlSigninStateSerializer>();
```

---

## ISamlServiceProviderConfigurationValidator

`ISamlServiceProviderConfigurationValidator` validates the configuration of a SAML Service Provider
at runtime, before IdentityServer processes requests from that SP. It is called by
`ValidatingSamlServiceProviderStore<T>`, which wraps your store automatically when you use
`AddSamlServiceProviderStore<T>()`.

For the full interface and validation context, see [SAML Service Provider Configuration Validator](/identityserver/reference/v8/saml/saml-service-provider-configuration-validator.md).

### When to Use

The built-in `DefaultSamlServiceProviderConfigurationValidator` already checks EntityId, ACS URLs
(which must use HTTP-POST), AllowedScopes, and lifetime values. You can derive from it and override
individual checks without replacing the whole validator:

* `ValidateEntityIdAsync` - validates that EntityId is not null or empty.
* `ValidateAssertionConsumerServiceUrlsAsync` - validates that ACS URLs exist and use HTTP-POST.
* `ValidateAllowedScopesAsync` - validates that at least one scope is configured.
* `ValidateLifetimesAsync` - validates `AssertionLifetime`, `ClockSkew`, and `RequestMaxAge`.

Override the validator when you need custom rules beyond those checks, for example to enforce naming
conventions on EntityIds, restrict which scopes are allowed, or apply business-specific rules.

### Registration

Register your implementation after `AddIdentityServer()` to replace the default:

```csharp
// Program.cs
builder.Services.AddIdentityServer()
    .AddSaml();
builder.Services.AddScoped<ISamlServiceProviderConfigurationValidator, CustomSamlServiceProviderConfigurationValidator>();
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
