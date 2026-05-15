---
title: "SAML 2.0 Concepts"
description: Core SAML 2.0 concepts you need to understand when integrating with IdentityServer's SAML 2.0 Identity Provider feature.
date: 2026-05-15
sidebar:
  label: Concepts
  order: 5
---

<span data-shb-badge data-shb-badge-variant="default">Added in 8.0 (prerelease)</span>

SAML 2.0 is an XML-based federation protocol widely used in enterprise, government, healthcare, and education environments. This page explains the core concepts you need to understand when working with SAML 2.0 federation. Where relevant, each section links to the corresponding IdentityServer [configuration](/identityserver/saml/configuration.md) so you can put these concepts into practice.

## Assertions

An assertion is the central data structure in SAML. It is an XML document that carries claims about a user from the Identity Provider to the Service Provider. The assertion, the response, or both, can be digitally signed but aren't always.

Think of it as the SAML equivalent of an ID token in OpenID Connect.

An assertion contains three key parts:

* **Authentication Statement**: declares that the user authenticated, when they did so, and by what means (password, MFA, certificate).
* **Attribute Statement**: carries user properties such as email address, roles, group memberships, and department.
* **Conditions**: constrain where and when the assertion is valid. `NotBefore` and `NotOnOrAfter` define a time window (typically minutes), and `AudienceRestriction` limits which recipients can accept it.

The Identity Provider signs the assertion with its private key. The Service Provider validates the signature before trusting any claims inside.

In IdentityServer, you control what attributes appear in assertions via [claim mappings](/identityserver/saml/configuration.md#default-claim-mappings) and configure signing via [`SamlSigningBehavior`](/identityserver/saml/configuration.md#samlsigningbehavior).

## Identity Provider

The Identity Provider (IdP) is the system that authenticates users and issues assertions. It is the authority: the entity that knows who a user is and can prove it to other parties.

When a user needs access to a protected application, they authenticate at the IdP. The IdP verifies the user's identity using whatever mechanism is configured (password, multi-factor authentication, smart card), then constructs a signed assertion and delivers it to the requesting application.

**IdentityServer acts as the IdP** when you enable SAML 2.0 support via `AddSaml()`. It publishes its capabilities through a [metadata document](/identityserver/saml/endpoints.md#metadata-endpoint) that Service Providers import to configure trust.

## Service Provider

The Service Provider (SP) is the application the user wants to access. Rather than managing credentials itself, it delegates authentication to the IdP and relies on the assertions it receives.

When an unauthenticated user arrives, the SP sends an `AuthnRequest` to the IdP. After the IdP authenticates the user and returns an assertion, the SP validates the signature, checks the conditions, extracts identity and attributes, and establishes a local session. The SP never handles the user's credentials. It trusts the IdP because the two parties have established a federation agreement backed by exchanged metadata and certificates.

```mermaid
sequenceDiagram
    participant User
    participant SP as Service Provider
    participant IdP as Identity Provider

    User->>SP: Access protected resource
    SP->>User: Redirect with AuthnRequest
    User->>IdP: AuthnRequest (via browser)
    IdP->>User: Login page
    User->>IdP: Credentials
    IdP->>User: SAML Response (assertion)
    User->>SP: POST assertion to ACS URL
    SP->>SP: Validate signature & conditions
    SP->>User: Grant access (session created)
```

In IdentityServer, you register each SP using a `SamlServiceProvider` configuration object. This tells IdentityServer the SP's entity identifier, where to deliver assertions (the Assertion Consumer Service URL) and how to communicate. See the [Service Provider Store](/identityserver/saml/service-providers.md) and the [SamlServiceProvider model](/identityserver/saml/configuration.md#samlserviceprovider-model) for details.

Duende IdentityServer can also act as a SAML Service Provider itself, consuming assertions from an external SAML IdP. See [Identity Provider and Service Provider](/identityserver/saml/idp-and-sp.md) for an overview of both roles.

## Metadata

SAML metadata is an XML document that describes an entity's capabilities: its endpoints, supported bindings, and the certificates it uses for signing and encryption. Both IdPs and SPs publish metadata documents.

Metadata makes federation scalable. Instead of manually exchanging certificates and endpoint URLs out-of-band, parties import each other's metadata and configure trust automatically.

IdentityServer publishes its IdP metadata at `/saml/metadata`. Share this URL with each Service Provider during federation setup so they can automatically discover your signing certificates, NameID formats, and endpoint locations. See the [metadata endpoint](/identityserver/saml/endpoints.md#metadata-endpoint) for more details.

## Bindings

SAML bindings define how SAML messages physically travel over HTTP. The protocol payload (the XML message) is the same regardless of binding; the binding determines the transport mechanism.

IdentityServer supports two bindings:

* **HTTP-Redirect**: the SAML message is deflated, Base64-encoded, and appended to the URL as a query parameter. This is the standard binding for `AuthnRequest` messages, which are typically small. However, URL length constraints make it unsuitable for large assertions with many attributes.
* **HTTP-POST**: the SAML message is Base64-encoded and submitted in a hidden HTML form field that auto-submits to the destination. This handles larger payloads (such as assertions with many attributes) and keeps message content out of server access logs.

The SAML specification also defines **HTTP-Artifact** binding, which sends a short reference token through the browser and resolves the full assertion via a back-channel SOAP call. IdentityServer does not currently support Artifact binding.

You configure the binding per SP via the `Binding` property on each [`IndexedEndpoint`](/identityserver/saml/configuration.md#indexedendpoint) in `AssertionConsumerServiceUrls`. This is the current API:

```csharp
AssertionConsumerServiceUrls = new List<IndexedEndpoint>
{
    new IndexedEndpoint
    {
        Location = new Uri("https://sp.example.com/saml/acs"),
        Binding = SamlBinding.HttpPost,
        Index = 0,
        IsDefault = true
    }
}
```

The [`SamlBinding` enum](/identityserver/saml/configuration.md#samlbinding) defines the available binding values.

## Profiles

SAML profiles are predefined recipes that combine assertions, protocol messages, and bindings into complete workflows for specific use cases. Following a profile is what makes SAML implementations interoperable. Without adhering to a profile, a system can produce syntactically valid SAML messages that no other implementation will accept.

The two profiles most relevant to IdentityServer are:

* **Web Browser SSO Profile**: the most widely used profile. It defines the exact sequence of redirects, requests, assertions, and validations for browser-based single sign-on. IdentityServer's [sign-in endpoints](/identityserver/saml/endpoints.md#sign-in-endpoint) implement this profile.
* **Single Logout Profile**: coordinates session termination across all SPs in a federation when a user logs out. See [Single Logout](#single-logout) below.

The **Enhanced Client or Proxy (ECP) Profile** handles non-browser clients (such as native apps or SOAP clients). It is not covered here.

## Name Identifiers

The Name Identifier (NameID) is the value inside an assertion that identifies the user to the Service Provider. The NameID format determines the type of identifier used and how stable it is across sessions.

The three most common formats are:

* **Persistent**: a stable, opaque identifier that remains the same for a given user-SP pair across all sessions. Use this when the SP needs to correlate the user over time (for example, to maintain account linking or preferences). Persistent identifiers do not reveal the user's real identity at the IdP.
* **Transient**: a session-scoped, one-time identifier that changes with every SSO session. Use this when the SP does not need to recognize the user across sessions (for example, anonymous access or attribute-only scenarios). Transient identifiers offer the best privacy protection.
* **emailAddress**: the user's email address. Human-readable and easy to work with, but it exposes personally identifiable information (PII) and couples the identifier to a value that can change.

IdentityServer currently supports `email` and `unspecified` NameID formats out of the box. Persistent format support is planned for a future release. For custom NameID generation, implement [`ISamlNameIdGenerator`](/identityserver/saml/extensibility.md#isamlnameidgenerator).

## RelayState

RelayState is an opaque string parameter that an SP includes in its `AuthnRequest`. IdentityServer echoes it back unchanged in the SAML response after authentication completes, and the SP uses it to resume the user's original request.

The most common use of RelayState is deep linking: the SP encodes the URL the user originally requested (before the SSO redirect) into RelayState, so after authentication it can redirect the user directly to that page rather than to the application's home page. Without RelayState, every SSO flow deposits the user at the same landing page regardless of where they were trying to go.

IdentityServer preserves RelayState automatically through the authentication flow. The maximum permitted length is controlled by `SamlOptions.MaxRelayStateLength` (default: `80` bytes). See [SamlOptions](/identityserver/saml/configuration.md#samloptions).

## Single Logout (SLO)

SAML Single Logout (SLO) is a protocol for coordinating session termination across an entire federation.

When a user authenticates via SAML, they establish a session at the IdP and a separate local session at each SP they visit. Logging out of one application ends only that application's local session. Without SLO, the user still has active sessions at every other SP they visited, and anyone with access to the browser can continue using those applications. SLO solves this by letting a single logout action propagate to all SPs in the federation.

### SP-Initiated SLO

The most common flow starts at an SP. When the user clicks "Log out" in an application, the SP sends a `LogoutRequest` to the IdP. The IdP ends the user's session, then sends `LogoutRequest` messages to every other SP where the user has an active session. Each SP terminates its local session and responds with a `LogoutResponse`. Once all SPs have responded (or timed out), the IdP sends a final `LogoutResponse` back to the originating SP.

```mermaid
sequenceDiagram
    participant User
    participant SP_A as SP A (initiator)
    participant IdP as Identity Provider
    participant SP_B as SP B
    participant SP_C as SP C

    User->>SP_A: Logout
    SP_A->>IdP: LogoutRequest
    IdP->>IdP: End user session
    IdP->>SP_B: LogoutRequest (front-channel)
    SP_B-->>IdP: LogoutResponse
    IdP->>SP_C: LogoutRequest (front-channel)
    SP_C-->>IdP: LogoutResponse
    IdP-->>SP_A: LogoutResponse
```

### IdP-Initiated SLO

The IdP can also initiate logout without waiting for an SP to start the flow. This happens when an administrator ends a session, a session timeout occurs, or the IdP detects a security event. The IdP sends `LogoutRequest` messages directly to all SPs with active sessions for that user. There is no originating SP to return a final `LogoutResponse` to.

### Front-Channel Logout

IdentityServer uses front-channel logout, which means logout notifications travel through the user's browser via redirects. The IdP redirects the browser to each SP's SLO endpoint in sequence, and each SP terminates its local session before the browser is redirected onward. This approach is simpler to implement than back-channel (server-to-server) logout, but it requires the user's browser to remain open and active throughout the logout sequence. Back-channel logout is not supported.

### Partial Logout

Not all SPs may respond successfully. An SP may be unreachable, slow to respond, or the user may close the browser before the sequence completes. IdentityServer tracks which SPs are expected to respond and can return a "partial logout" status when some SPs do not confirm. This is a normal outcome in real-world deployments, not an error condition.

### Session Tracking

For SLO to work, the IdP must know which SPs have active sessions for a given user. IdentityServer tracks this automatically as users authenticate at each SP. You can customize the storage backend by implementing [`ISamlLogoutSessionStore`](/identityserver/saml/extensibility.md#isamllogoutsessionstore).

### Timeouts and Edge Cases

If an SP is unreachable or the user closes the browser mid-flow, the logout sequence may not complete for all SPs. Short session lifetimes and per-application logout are common supplements to SLO in deployments where reliability matters more than protocol completeness. You can tune logout timeout behavior via `SamlOptions` to balance user experience against thoroughness.

In IdentityServer, you configure SLO per SP by setting `SamlServiceProvider.SingleLogoutServiceUrl`. IdentityServer then sends front-channel logout notifications to all SPs with a configured SLO endpoint when a user's session ends. See the [logout endpoint](/identityserver/saml/endpoints.md#logout-endpoint) and [`ISamlLogoutNotificationService`](/identityserver/saml/extensibility.md#isamllogoutnotificationservice) for customization options.
