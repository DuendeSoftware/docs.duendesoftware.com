# IdentityServer 8.0 Documentation Updates

- **Tracking Issue**: https://github.com/DuendeSoftware/issues/issues/1398
- **Pull Request**: https://github.com/DuendeSoftware/docs.duendesoftware.com/pull/1012

## TL;DR

> **Summary**: Comprehensive docs update for IdentityServer 8.0 — new upgrade guide (v7.4→v8.0), SAML 2.0 IdP section, conformance report docs, and reference page updates for all breaking changes (IClock→TimeProvider, CancellationToken on interfaces, DPoP changes, cookie name changes, HTTP 303 unconditional).
> **Estimated Effort**: Large

## Context

### Original Request

Document all user-facing changes in Duende IdentityServer 8.0 across the Astro/Starlight docs site at `astro/src/content/docs/`.

### Key Findings

- **Upgrade guide template**: `v6_3-to-v7_0.md` uses frontmatter with `title`, `sidebar.order` (decreasing for newer), `sidebar.label`. Structure: intro → .NET update → NuGet → DB schema → breaking changes → new features → done. Most recent guide is `v7_3-to-v7_4.md` with `sidebar.order: 26`.
- **Upgrades index** (`upgrades/index.md`): Lists guides newest-first at top. Currently starts with "Upgrading from version 7.3 to 7.4".
- **Token creation service** (`reference/services/token-creation-service.md`): Line 61 shows `IClock clock` in `DefaultTokenCreationService` constructor. Must change to `TimeProvider`.
- **Client model** (`reference/models/client.md`): Lines 327-335 document `DPoPValidationMode` and `DPoPClockSkew` under `## DPoP` section.
- **Options** (`reference/options.md`): DPoP section at line 733 has `ProofTokenValidityDuration` and `ServerClockSkew`. UserInteraction section at line 490 — no `UseHttp303Redirects` currently documented. Authentication section at line 276 documents cookie settings but no `CookieName`/`ExternalCookieName` properties.
- **DI reference** (`reference/di.md`): 226 lines, ends after `AddBackchannelAuthenticationUserNotificationService`. No SAML or conformance entries.
- **Client store** (`reference/stores/client-store.md`): Only documents `FindClientByIdAsync`. No `GetAllClientsAsync`.
- **DPoP proof validator** (`reference/validators/dpop-proof-validator.md`): Documents `DPoPProofValidationContext`.
- **Schemes page** (`aspnet-identity/schemes.md`): Documents `"idsrv"` and `"idsrv.external"` cookie names. No mention of `__Host-` prefix.
- **FAPI 2.0** (`tokens/fapi-2-0-specification.md`): Badge says "Added in 7.3". No mention of HTTP 303 or conformance report.
- **PoP page** (`tokens/pop.md`): References DPoP configuration via client settings link.
- **Diagnostics section**: Has `_meta.yml` with `order: 8`. Contains index, events, logging, otel pages.
- **SAML directory**: Does not exist yet. Must be created as new top-level section under `identityserver/`.
- **BFF extensibility**: Has index, tokens, http-forwarder pages. BFF upgrading has v2→v3 and v3→v4 guides.
- **Navigation**: Starlight uses `_meta.yml` files for sidebar groups (with `label`, `collapsed`, `order` properties).

### Source Code Reference

Accurate API signatures should be verified from source at `D:\repos\duende\products` when implementing. Key paths:

- `identity-server/src/IdentityServer/Services/ITokenCreationService.cs` — CancellationToken param
- `identity-server/src/IdentityServer/Services/Default/DefaultTokenCreationService.cs` — TimeProvider constructor
- `identity-server/src/Storage/Stores/IClientStore.cs` — GetAllClientsAsync signature
- `identity-server/src/Storage/Models/Client.cs` — DPoP properties (unchanged names)
- `identity-server/src/IdentityServer/Configuration/DependencyInjection/BuilderExtensions/Saml.cs` — SAML builder extensions
- `identity-server/src/IdentityServer/Configuration/DependencyInjection/Options/` — removed UseHttp303Redirects, new cookie options
- `identity-server/src/IdentityServer/Saml/` — all SAML types, models, interfaces
- `identity-server/src/Storage/Models/SamlServiceProvider.cs` — SAML service provider model
- `identity-server/src/Storage/Stores/ISamlServiceProviderStore.cs` — SAML store interface
- `aspnetcore-authentication-jwtbearer/src/AspNetCore.Authentication.JwtBearer/DPoP/` — DPoP options, nonce validator
- `bff/src/Bff/Endpoints/IUserEndpointClaimsEnricher.cs` — BFF claims enricher

### Guardrails (Must NOT)

- Do NOT remove or restructure existing content unrelated to v8.0
- Do NOT document internal/non-public APIs
- Do NOT add preview/unreleased features without `:::note` callouts
- Do NOT change frontmatter `redirect_from` entries on existing pages

---

## TODOs

### Phase 1: Upgrade Guide (v7.4 → v8.0)

- [x] 1. **Create upgrade guide**
     **What**: Create `astro/src/content/docs/identityserver/upgrades/v7_4-to-v8_0.md`
     **Files**: `astro/src/content/docs/identityserver/upgrades/v7_4-to-v8_0.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "Duende IdentityServer v7.4 to v8.0"
  sidebar:
    order: 24
    label: v7.4 → v8.0
  ---
  ```

  (Order 24 places it before v7.3→v7.4 at 26, keeping newest-first in sidebar.)

  Content structure (follow `v6_3-to-v7_0.md` template):

  **Intro paragraph**: "IdentityServer v8.0 includes support for .NET 10, SAML 2.0 Identity Provider support, conformance reporting, and many other fixes and enhancements. Please see our [release notes](link) for complete details."

  **Step 1: Update .NET Version**
  - Change `<TargetFramework>net8.0</TargetFramework>` (or `net9.0`) to `<TargetFramework>net10.0</TargetFramework>`
  - Note: IdentityServer 8.0 targets .NET 10 only
  - Update Microsoft.\* NuGet dependencies accordingly

  **Step 2: Update NuGet Packages**
  - Change `<PackageReference Include="Duende.IdentityServer" Version="7.4.0"/>` to `Version="8.0"`
  - Also update: `Duende.IdentityServer.EntityFramework`, `Duende.IdentityServer.AspNetIdentity`, `Duende.IdentityServer.Configuration`, etc.

  **Step 3: Update Database Schema**
  - New tables for SAML service providers (if using SAML feature)
  - EF migration commands:
    ```bash
    dotnet ef migrations add Update_DuendeIdentityServer_v8_0 -c ConfigurationDbContext -o Migrations/ConfigurationDb
    ```
  - Same pattern as v7.0 guide for custom store implementations vs. EF store
  - Verify exact schema changes from source: `identity-server/src/EntityFramework.Storage/Entities/` and migration snapshots

  **Step 4: Breaking Changes** (each as a subheading):

  **4a. IClock removed — use TimeProvider**
  - `Duende.IdentityServer.IClock` has been removed
  - Replace with `System.TimeProvider` (built into .NET 8+)
  - Before/after code:

    ```csharp
    // Before (v7.x)
    public class MyService
    {
        public MyService(IClock clock) { }
    }

    // After (v8.0)
    public class MyService
    {
        public MyService(TimeProvider timeProvider) { }
    }
    ```

  - `DefaultTokenCreationService`, `DefaultTokenService`, and other services that accepted `IClock` now accept `TimeProvider`
  - Verify exact list from source: `identity-server/src/IdentityServer/Services/Default/`

  **4b. CancellationToken now required on all interface methods**
  - All store and service interfaces now include `CancellationToken` parameters
  - `ICancellationTokenProvider` has been removed — use the `CancellationToken` passed directly to methods
  - Example migration:

    ```csharp
    // Before (v7.x)
    public class MyClientStore : IClientStore
    {
        public Task<Client> FindClientByIdAsync(string clientId)
        { ... }
    }

    // After (v8.0)
    public class MyClientStore : IClientStore
    {
        public Task<Client> FindClientByIdAsync(string clientId, CancellationToken ct)
        { ... }
    }
    ```

  - Verify exact signatures from `identity-server/src/Storage/Stores/` and `identity-server/src/IdentityServer/Stores/`

  **4c. ICancellationTokenProvider removed**
  - If you injected `ICancellationTokenProvider`, remove it and use the `CancellationToken` passed to interface methods instead

  **4d. HTTP 303 redirects now unconditional**
  - `UserInteractionOptions.UseHttp303Redirects` has been removed
  - IdentityServer now always uses HTTP 303 (See Other) for redirects from POST endpoints
  - This aligns with FAPI 2.0 Section 5.3.2.2 requirements
  - No action needed unless you explicitly set this option to `false`

  **4e. Cookie names changed to `__Host-` prefix**
  - Default cookie names have changed:
    - `idsrv` → `__Host-idsrv`
    - `idsrv.external` → `__Host-idsrv.external`
  - The `__Host-` prefix is a cookie security hardening measure (HTTPS-only, `Path=/`, no `Domain` attribute)
  - **Migration**: Use the middleware to temporarily accept both old and new cookie names — call once per cookie, **before** `UseIdentityServer()`:
    ```csharp
    // Program.cs — add BEFORE UseIdentityServer()
    app.MigrateIdentityServerCookieName("idsrv", "__Host-idsrv");
    app.MigrateIdentityServerCookieName("idsrv.external", "__Host-idsrv.external");
    app.UseIdentityServer();
    ```
  - The middleware takes two required string parameters: `oldCookieName` and `newCookieName`
  - This is a transient migration aid — once all active sessions have been re-issued, the middleware can be removed
  - New options `AuthenticationOptions.CookieName` and `AuthenticationOptions.ExternalCookieName` can override the defaults
  - Verify option names from `identity-server/src/IdentityServer/Configuration/DependencyInjection/Options/AuthenticationOptions.cs`

  **4f. IClientStore.GetAllClientsAsync now required**
  - `IClientStore` now includes a new method: `IAsyncEnumerable<Client> GetAllClientsAsync(CancellationToken ct)`
  - Custom `IClientStore` implementations must add this method
  - Used by conformance reporting and configuration validation
  - Verify exact signature from `identity-server/src/Storage/Stores/IClientStore.cs`

  **4g. DPoP changes (JwtBearer package)**
  - The `Client.DPoPValidationMode` property (type `DPoPTokenExpirationValidationMode`) is **unchanged** in IdentityServer's client model
  - In the **JwtBearer** package (`Duende.AspNetCore.Authentication.JwtBearer`), the DPoP options were restructured:
    - New enum `DPoPProofExpirationMode` (values: `IssuedAt`, `Nonce`, `Both`)
    - `DPoPOptions.ProofTokenExpirationMode` (default: `IssuedAt`)
    - New properties: `ProofTokenIssuedAtClockSkew`, `ProofTokenNonceClockSkew`, `EnableReplayDetection`
    - New interface: `IDPoPNonceValidator` with `DefaultDPoPNonceValidator` implementation
    - `DPoPExtensions` replaced with `DPoPServiceCollectionExtensions`
  - Verify from `aspnetcore-authentication-jwtbearer/src/AspNetCore.Authentication.JwtBearer/DPoP/`

  **Step 5: New Features**
  - SAML 2.0 Identity Provider support — link to `/identityserver/saml/`
  - Conformance report — link to `/identityserver/diagnostics/conformance-report/`
  - Brief bullet points of other notable features from release notes

  **Step 6: Done!**
  - Standard closing: "That's it. Of course, at this point you can and should test that your IdentityServer is updated and working properly."

  **Acceptance**: Page renders in sidebar under "Upgrading" with label "v7.4 → v8.0" at correct position (before v7.3→v7.4). All internal links resolve.

---

- [x] 2. **Update upgrades index**
     **What**: Add v8.0 entry at the top of the upgrade list in `index.md`
     **Files**: `astro/src/content/docs/identityserver/upgrades/index.md` (edit)
     **Details**: Insert new section before the current first entry ("## Upgrading from version 7.3 to 7.4"):

  ```markdown
  ## Upgrading from version 7.4 to 8.0

  See [IdentityServer v7.4 to v8.0](/identityserver/upgrades/v7_4-to-v8_0/).
  ```

  **Acceptance**: New entry appears first in the upgrade list. Link resolves to the new upgrade guide.

---

### Phase 2: SAML 2.0 Documentation (New Section)

- [x] 3. **Create SAML directory and navigation metadata**
     **What**: Create the `saml/` directory under `identityserver/` with `_meta.yml` for Starlight sidebar
     **Files**: `astro/src/content/docs/identityserver/saml/_meta.yml` (new)
     **Details**:

  Check all existing `_meta.yml` files under `astro/src/content/docs/identityserver/` to find the correct `order` slot. Place SAML logically after Tokens and before UI. Then create:

  ```yaml
  label: "SAML 2.0"
  collapsed: true
  order: 6
  ```

  Adjust `order` value after checking existing `_meta.yml` orders to avoid conflicts.

  **Acceptance**: Sidebar shows "SAML 2.0" section in navigation at the correct position.

---

- [x] 4. **Create SAML overview page**
     **What**: Create overview/index page for SAML 2.0 IdP support
     **Files**: `astro/src/content/docs/identityserver/saml/index.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "SAML 2.0 Identity Provider"
  sidebar:
    label: Overview
    order: 1
  ---
  ```

  Content:
  - What SAML 2.0 IdP support means: IdentityServer can now act as a SAML 2.0 Identity Provider, issuing SAML assertions to Service Providers
  - New protocol type: `IdentityServerConstants.ProtocolTypes.Saml2p`
  - When to use SAML 2.0 (legacy integrations, enterprise requirements)
  - Prerequisites: `Duende.IdentityServer.Saml` NuGet package, Enterprise license
  - Quick setup overview linking to configuration, service provider, and endpoint pages
  - `:::note` callout about Enterprise Edition requirement
  - Verify all details from `D:\repos\duende\products\identity-server\src\IdentityServer\Saml\`

  **Acceptance**: Page renders as the landing page for SAML section.

---

- [x] 5. **Create SAML configuration page**
     **What**: Document SAML setup, options, and service provider model
     **Files**: `astro/src/content/docs/identityserver/saml/configuration.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "SAML Configuration"
  sidebar:
    label: Configuration
    order: 10
  ---
  ```

  Content sections:
  - **Setup**: `AddSaml()` builder extension on `IIdentityServerBuilder`
    ```csharp
    builder.Services.AddIdentityServer()
        .AddSaml();
    ```
  - **SamlOptions**: All configurable options — verify from `D:\repos\duende\products\identity-server\src\IdentityServer\Configuration\DependencyInjection\Options\SamlOptions.cs`
  - **SamlUserInteractionOptions**: SAML-specific UI route paths — verify nested class inside `SamlOptions`
  - **SamlServiceProvider model**: Full property reference — verify all properties from `D:\repos\duende\products\identity-server\src\Storage\Models\SamlServiceProvider.cs`
  - **Enums**: `SamlBinding`, `SamlSigningBehavior`, `SamlEndpointType` — describe each value
  - **Endpoint enable/disable**: Document the 6 SAML endpoints and how to enable/disable them in options

  **Acceptance**: Page documents all SAML configuration types. Code samples match source.

---

- [x] 6. **Create SAML service provider store page**
     **What**: Document how to register and manage SAML Service Providers
     **Files**: `astro/src/content/docs/identityserver/saml/service-providers.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "SAML Service Provider Store"
  sidebar:
    label: Service Providers
    order: 20
  ---
  ```

  Content:
  - `ISamlServiceProviderStore` interface — show full interface definition
    - Verify from `D:\repos\duende\products\identity-server\src\Storage\Stores\ISamlServiceProviderStore.cs`
  - Registration: `AddSamlServiceProviderStore<T>()` builder extension
  - In-memory store for dev/testing: `AddInMemorySamlServiceProviders(IEnumerable<SamlServiceProvider>)`
  - Example:
    ```csharp
    builder.Services.AddIdentityServer()
        .AddSaml()
        .AddInMemorySamlServiceProviders(new[]
        {
            new SamlServiceProvider
            {
                EntityId = "https://sp.example.com",
                // ...
            }
        });
    ```
  - For production: implement `ISamlServiceProviderStore` with your own data store

  **Acceptance**: Interface signature matches source. Examples compile.

---

- [x] 7. **Create SAML endpoints page**
     **What**: Document the 6 SAML protocol endpoints
     **Files**: `astro/src/content/docs/identityserver/saml/endpoints.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "SAML Endpoints"
  sidebar:
    label: Endpoints
    order: 30
  ---
  ```

  Content — document each endpoint:
  1. **Metadata** — SAML metadata document
  2. **Sign-in** — SP-initiated SSO entry point
  3. **Sign-in Callback** — processes SAML AuthnRequest
  4. **IdP-initiated Sign-in** — IdP-initiated SSO
  5. **Logout** — single logout
  6. **Logout Callback** — processes SAML LogoutRequest/Response
  - For each: route path, HTTP method(s), purpose
  - Verify exact route paths from `D:\repos\duende\products\identity-server\src\IdentityServer\Internal\Saml\` endpoint registration code and `IdentityServerConstants`

  **Acceptance**: All 6 endpoints documented with correct route paths.

---

- [x] 8. **Create SAML extensibility page**
     **What**: Document SAML extensibility points and overridable services
     **Files**: `astro/src/content/docs/identityserver/saml/extensibility.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "SAML Extensibility"
  sidebar:
    label: Extensibility
    order: 40
  ---
  ```

  Content — document each interface:
  - **ISamlClaimsMapper**: Customize how IdentityServer claims are mapped to SAML attributes
  - **ISamlInteractionService**: Controls UI interaction during SAML flows
  - **ISamlSigninInteractionResponseGenerator**: Generate interaction responses for SAML sign-in requests
  - **ISamlFrontChannelLogout**: Handle front-channel logout notifications to SAML SPs
  - **ISamlLogoutNotificationService**: Send logout notifications to SAML SPs
  - For each: purpose, when to override, interface signature, registration method
  - Verify all interfaces from `D:\repos\duende\products\identity-server\src\IdentityServer\Saml\`

  **Acceptance**: All extensibility interfaces documented with correct signatures.

---

### Phase 3: Conformance Report Documentation

- [x] 9. **Create conformance report page**
     **What**: Document the new conformance report feature
     **Files**: `astro/src/content/docs/identityserver/diagnostics/conformance-report.md` (new)
     **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "Conformance Report"
  sidebar:
    label: Conformance Report
    order: 50
    badge:
      text: v8.0
      variant: tip
  ---
  ```

  Content:
  - What it does: generates an HTML report assessing your IdentityServer deployment against OAuth 2.1 and FAPI 2.0 specifications
  - NuGet package: `Duende.IdentityServer.ConformanceReport`
  - Setup: `AddConformanceReport()` builder extension
    ```csharp
    builder.Services.AddIdentityServer()
        .AddConformanceReport();
    ```
  - What the report covers:
    - Server configuration assessment (options, endpoints, key management)
    - Per-client configuration assessment (grant types, secrets, DPoP, PAR)
    - Findings categorized by severity
  - How to access the report (endpoint or middleware — verify from source)
  - How to interpret findings
  - Requires `IClientStore.GetAllClientsAsync` — link to upgrade guide breaking changes
  - Verify all details from `D:\repos\duende\products\identity-server\src\IdentityServer.ConformanceReport\` and `D:\repos\duende\products\conformance-report\`

  **Acceptance**: Page renders in diagnostics section with v8.0 badge. Setup code is accurate.

---

- [x] 10. **Update diagnostics index**
      **What**: Add conformance report entry to diagnostics overview
      **Files**: `astro/src/content/docs/identityserver/diagnostics/index.md` (edit)
      **Details**: Add new section after existing content:

  ```markdown
  ## Conformance Report

  IdentityServer can generate a conformance report that assesses your configuration against OAuth 2.1 and FAPI 2.0 specifications.

  [Read More](/identityserver/diagnostics/conformance-report/)
  ```

  **Acceptance**: Link appears on diagnostics overview and resolves correctly.

---

### Phase 4: Reference Page Updates

- [x] 11. **Update options reference — Authentication section**
      **What**: Document new `CookieName` and `ExternalCookieName` options
      **Files**: `astro/src/content/docs/identityserver/reference/options.md` (edit)
      **Details**:
  - In the `## Authentication` section (around line 276), add two new options:

    ```markdown
    - **`CookieName`** (added in `v8.0`)

      Sets the name of the primary IdentityServer authentication cookie. Defaults to `"__Host-idsrv"`.

    - **`ExternalCookieName`** (added in `v8.0`)

      Sets the name of the external authentication cookie. Defaults to `"__Host-idsrv.external"`.
    ```

  - In the `## UserInteraction` section: if `UseHttp303Redirects` is documented, remove it and add a note that HTTP 303 redirects are now always used
  - Verify exact property names from `D:\repos\duende\products\identity-server\src\IdentityServer\Configuration\DependencyInjection\Options\AuthenticationOptions.cs`

  **Acceptance**: New options appear in Authentication section. No stale options remain.

---

- [x] 12. **Update options reference — DPoP section**
      **What**: Update DPoP option names if they changed in v8.0
      **Files**: `astro/src/content/docs/identityserver/reference/options.md` (edit)
      **Details**:
  - Review DPoP section at line 733. Currently documents `ProofTokenValidityDuration` and `ServerClockSkew`.
  - Verify from `D:\repos\duende\products\identity-server\src\IdentityServer\Configuration\DependencyInjection\Options\DPoPOptions.cs` whether these names changed
  - If `DPoPOptions` was restructured, update the section accordingly

  **Acceptance**: DPoP options section matches v8.0 source.

---

- [x] 13. **Update DI reference**
      **What**: Add SAML and conformance report builder extensions
      **Files**: `astro/src/content/docs/identityserver/reference/di.md` (edit)
      **Details**:
  - Add new section after "Additional services" (after line 225):

    ```markdown
    ## SAML 2.0

    Extension methods for configuring [SAML 2.0 Identity Provider](/identityserver/saml/) support. Added in `v8.0`.

    - **`AddSaml`**

      Adds SAML 2.0 Identity Provider services to IdentityServer.

    - **`AddSamlServiceProviderStore<T>`**

      Registers a custom `ISamlServiceProviderStore` implementation.

    - **`AddInMemorySamlServiceProviders`**

      Registers an `ISamlServiceProviderStore` based on an in-memory collection of `SamlServiceProvider` configuration objects.

    ## Conformance Report

    Added in `v8.0`.

    - **`AddConformanceReport`**

      Adds the [conformance report](/identityserver/diagnostics/conformance-report/) service that assesses server and client configuration against OAuth 2.1 and FAPI 2.0 specifications.
    ```

  - Verify exact extension method names from `D:\repos\duende\products\identity-server\src\IdentityServer\Configuration\DependencyInjection\BuilderExtensions\Saml.cs` and `D:\repos\duende\products\identity-server\src\IdentityServer.ConformanceReport\`

  **Acceptance**: New builder extensions appear in DI reference page.

---

- [x] 14. **Update token creation service reference**
      **What**: Replace `IClock` with `TimeProvider` in constructor example
      **Files**: `astro/src/content/docs/identityserver/reference/services/token-creation-service.md` (edit)
      **Details**:
  - Around line 61: Change `IClock clock` to `TimeProvider timeProvider` in constructor
  - Update `base(clock, ...)` call to `base(timeProvider, ...)`
  - Check if `CreateTokenAsync` gained a `CancellationToken` parameter — if so, update the interface definition shown on line 27
  - Verify exact signatures from `D:\repos\duende\products\identity-server\src\IdentityServer\Services\ITokenCreationService.cs` and `D:\repos\duende\products\identity-server\src\IdentityServer\Services\Default\DefaultTokenCreationService.cs`

  **Acceptance**: Code sample compiles with v8.0 APIs.

---

- [x] 15. **Update authentication schemes and cookies page**
      **What**: Document new `__Host-` prefixed cookie names and migration middleware
      **Files**: `astro/src/content/docs/identityserver/aspnet-identity/schemes.md` (edit)
      **Details**:
  - In "Standalone IdentityServer" section (around line 17): Update to note that default cookie name is now `"__Host-idsrv"` (changed in v8.0 from `"idsrv"`)
  - In external auth section (around line 58): Update from `"idsrv.external"` to `"__Host-idsrv.external"`
  - Add a new section "## Cookie Name Migration (v8.0)" explaining:
    - Why: `__Host-` prefix provides security hardening (HTTPS-only, `Path=/`, no `Domain` attribute)
    - The middleware takes two required string parameters and must be called once per cookie, before `UseIdentityServer()`:
      ```csharp
      app.MigrateIdentityServerCookieName("idsrv", "__Host-idsrv");
      app.MigrateIdentityServerCookieName("idsrv.external", "__Host-idsrv.external");
      app.UseIdentityServer();
      ```
    - How to configure: `AuthenticationOptions.CookieName` and `AuthenticationOptions.ExternalCookieName`
    - Link to upgrade guide for more context
  - Keep the `IdentityServerConstants.DefaultCookieAuthenticationScheme` constant reference — note that the scheme name hasn't changed, only the cookie name

  **Acceptance**: Page accurately describes v8.0 cookie defaults. Migration path is clear.

---

- [x] 16. **Update client model reference — DPoP section**
      **What**: Verify DPoP property names are accurate for v8.0
      **Files**: `astro/src/content/docs/identityserver/reference/models/client.md` (edit)
      **Details**:
  - Lines 327-335: `DPoPValidationMode` (type `DPoPTokenExpirationValidationMode`) and `DPoPClockSkew` are **unchanged** in IS8
  - Verify docs match current source: property name is `DPoPValidationMode`, enum type is `DPoPTokenExpirationValidationMode`, values include `Iat` and `Nonce`
  - Only update if current docs show stale type names
  - Note: The `DPoPProofExpirationMode` enum exists in the **JwtBearer** package only, not in the Client model
  - Verify from `D:\repos\duende\products\identity-server\src\Storage\Models\Client.cs`

  **Acceptance**: DPoP property names are verified correct for v8.0.

---

- [x] 17. **Update client store reference**
      **What**: Add `GetAllClientsAsync` to `IClientStore` interface documentation
      **Files**: `astro/src/content/docs/identityserver/reference/stores/client-store.md` (edit)
      **Details**:
  - Update the interface code block to add the new method and CancellationToken to existing method:

    ```csharp
    public interface IClientStore
    {
        Task<Client?> FindClientByIdAsync(string clientId, CancellationToken ct);

        IAsyncEnumerable<Client> GetAllClientsAsync(CancellationToken ct);
    }
    ```

  - Add description: "`GetAllClientsAsync` returns all configured clients as an async enumerable. Added in v8.0. Used by the conformance report and configuration validation features."
  - Verify exact signatures from `D:\repos\duende\products\identity-server\src\Storage\Stores\IClientStore.cs`

  **Acceptance**: Interface shows both methods with correct v8.0 signatures.

---

- [x] 18. **Update DPoP proof validator reference**
      **What**: Update `DPoPProofValidationContext` if properties changed in v8.0
      **Files**: `astro/src/content/docs/identityserver/reference/validators/dpop-proof-validator.md` (edit)
      **Details**:
  - Verify current state of `DPoPProofValidationContext` from `D:\repos\duende\products\identity-server\src\IdentityServer\Validation\DPoPProofValidationContext.cs`
  - Update properties list to match v8.0 source
  - Check if `ValidateAsync` gained a `CancellationToken` parameter and update accordingly

  **Acceptance**: Context model and interface signature match v8.0 source.

---

- [x] 19. **Update PoP / DPoP tokens page**
      **What**: Verify DPoP references are accurate for v8.0
      **Files**: `astro/src/content/docs/identityserver/tokens/pop.md` (edit)
      **Details**:
  - Scan the page for any type names that may have changed
  - Verify that links to client settings and global options still resolve with correct anchors
  - If any outdated references are found, update them

  **Acceptance**: All DPoP references use v8.0 type names. Links resolve.

---

- [x] 20. **Update FAPI 2.0 page**
      **What**: Note HTTP 303 is now unconditional; link to conformance report
      **Files**: `astro/src/content/docs/identityserver/tokens/fapi-2-0-specification.md` (edit)
      **Details**:
  - Add a note in the relevant section about HTTP 303 being unconditional in v8.0:
    ```markdown
    :::note
    As of v8.0, IdentityServer unconditionally uses HTTP 303 (See Other) redirects from POST
    endpoints, in compliance with FAPI 2.0 Section 5.3.2.2. The `UseHttp303Redirects` option
    has been removed.
    :::
    ```
  - Add a section or note about the conformance report:

    ```markdown
    ## Conformance Report

    Starting in v8.0, IdentityServer includes a [conformance report](/identityserver/diagnostics/conformance-report/)
    that assesses your deployment against OAuth 2.1 and FAPI 2.0 specifications.
    ```

  **Acceptance**: FAPI page reflects v8.0 changes. Conformance report link resolves.

---

- [x] 21. **Update store reference pages for CancellationToken**
      **What**: Add `CancellationToken` to interface method signatures across all store reference pages
      **Files** (all in `astro/src/content/docs/identityserver/reference/stores/`):
  - `resource-store.md`
  - `persisted-grant-store.md`
  - `device-flow-store.md`
  - `backchannel-auth-request-store.md`
  - `pushed-authorization-request-store.md`
  - `signing-key-store.md`
  - `server-side-sessions.md`
  - `idp-store.md`
  - `cors-policy-service.md`

  **Details**:
  - For each file: read current interface code block, add `CancellationToken ct` to all async methods that don't already have it
  - Verify each interface from corresponding source files in `D:\repos\duende\products\identity-server\src\Storage\Stores\` and `D:\repos\duende\products\identity-server\src\IdentityServer\Stores\`
  - Only update if the interface actually changed

  **Acceptance**: All store interface signatures match v8.0 source.

---

- [x] 22. **Add SAML service provider store to stores reference**
      **What**: Create a store reference page for `ISamlServiceProviderStore`
      **Files**: `astro/src/content/docs/identityserver/reference/stores/saml-service-provider-store.md` (new)
      **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "SAML Service Provider Store"
  sidebar:
    label: SAML Service Provider
    order: 45
    badge:
      text: v8.0
      variant: tip
  ---
  ```

  Content:
  - Full `ISamlServiceProviderStore` interface definition
  - Description of each method
  - Link to SAML service providers page for usage guidance
  - Verify from `D:\repos\duende\products\identity-server\src\Storage\Stores\ISamlServiceProviderStore.cs`

  **Acceptance**: Page renders in stores reference section with v8.0 badge.

---

### Phase 5: BFF Updates

- [x] 23. **Document IUserEndpointClaimsEnricher**
      **What**: Document the new BFF extensibility interface for enriching user endpoint claims
      **Files**: `astro/src/content/docs/bff/extensibility/user-endpoint-claims.md` (new)
      **Details**:

  Frontmatter:

  ```yaml
  ---
  title: "User Endpoint Claims Enrichment"
  sidebar:
    label: User Claims
    order: 20
    badge:
      text: New
      variant: tip
  ---
  ```

  Content:
  - Purpose: `IUserEndpointClaimsEnricher` allows you to enrich or replace the claims returned from the BFF user endpoint
  - Advantage over `IClaimsTransformation`: provides access to `AuthenticateResult` including the access token
  - Interface signature (from `D:\repos\duende\products\bff\src\Bff\Endpoints\IUserEndpointClaimsEnricher.cs`):
    ```csharp
    public interface IUserEndpointClaimsEnricher
    {
        Task<IReadOnlyList<ClaimRecord>> EnrichClaimsAsync(
            AuthenticateResult authenticateResult,
            IReadOnlyList<ClaimRecord> claims,
            CancellationToken ct = default);
    }
    ```
  - Registration: register via DI, e.g. `services.AddTransient<IUserEndpointClaimsEnricher, MyClaimsEnricher>()`
  - Example implementation:
    ```csharp
    public class MyClaimsEnricher : IUserEndpointClaimsEnricher
    {
        public Task<IReadOnlyList<ClaimRecord>> EnrichClaimsAsync(
            AuthenticateResult authenticateResult,
            IReadOnlyList<ClaimRecord> claims,
            CancellationToken ct = default)
        {
            var enriched = claims.ToList();
            enriched.Add(new ClaimRecord("custom", "value"));
            return Task.FromResult<IReadOnlyList<ClaimRecord>>(enriched);
        }
    }
    ```

  **Acceptance**: Page renders in BFF extensibility section. Interface matches source.

---

- [x] 24. **Update BFF extensibility index**
      **What**: Add user endpoint claims enrichment to the extensibility overview
      **Files**: `astro/src/content/docs/bff/extensibility/index.md` (edit)
      **Details**: Add a mention of the new `IUserEndpointClaimsEnricher` extensibility point to the existing list.

  **Acceptance**: Overview mentions the new extensibility point.

---

- [x] 25. **BFF upgrade guide (conditional)**
      **What**: Create BFF v4→v5 upgrade guide if BFF ships a new major version with IS 8.0
      **Files**: `astro/src/content/docs/bff/upgrading/bff-v4-to-v5.md` (new, only if BFF v5)
      **Details**:
  - Check BFF version from `D:\repos\duende\products\bff\src\Bff\Bff.csproj`
  - Only create if BFF version bumps to v5; otherwise skip this task
  - If BFF stays at v4.x, add a brief note to the BFF docs about .NET 10 requirement
  - Follow pattern from `bff-v3-to-v4.md`
  - Document CancellationToken changes on BFF interfaces and `IUserEndpointClaimsEnricher` as new feature

  **Acceptance**: If applicable, upgrade guide follows established pattern and covers all BFF breaking changes.

---

## Verification

- [x] 26. Run `npm run build` in `astro/` and verify zero errors
      **What**: Build the Astro site to catch broken links and missing pages
      **Files**: N/A
      **Acceptance**: Build completes with zero errors.

- [x] 27. Verify sidebar navigation
      **What**: Check that all new pages appear in correct sidebar positions
      **Files**: N/A
      **Acceptance**: SAML section, upgrade guide v7.4→v8.0, and conformance report page all appear in sidebar at correct positions.
